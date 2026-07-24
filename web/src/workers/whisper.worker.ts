/// <reference lib="webworker" />

import { pipeline, type AutomaticSpeechRecognitionPipeline } from "@huggingface/transformers";
import type { DetectedLanguage, SupportedLanguage } from "../types/languages";

const scope = self as unknown as DedicatedWorkerGlobalScope;
const MODEL = "onnx-community/whisper-tiny";
let transcriberPromise: Promise<{ transcriber: AutomaticSpeechRecognitionPipeline; backend: "webgpu" | "wasm" }> | null = null;

function post(message: object): void { scope.postMessage(message); }

async function loadModel(id: number) {
  if (!transcriberPromise) {
    transcriberPromise = (async () => {
      const progress_callback = (event: { status?: string; progress?: number }): void => {
        if (event.status === "progress") post({ type: "loading", id, progress: event.progress });
      };
      if ("gpu" in navigator) {
        try {
          const transcriber = await pipeline("automatic-speech-recognition", MODEL, { device: "webgpu", progress_callback });
          return { transcriber, backend: "webgpu" as const };
        } catch { /* Fall back to broadly supported WASM. */ }
      }
      try {
        const transcriber = await pipeline("automatic-speech-recognition", MODEL, { device: "wasm", progress_callback });
        return { transcriber, backend: "wasm" as const };
      } catch (error) {
        transcriberPromise = null;
        const detail = error instanceof Error ? error.message : String(error);
        throw new Error(`Das Whisper-Modell konnte weder mit WebGPU noch mit WASM geladen werden. ${detail}`);
      }
    })();
  }
  return transcriberPromise;
}

scope.onmessage = async ({ data }: MessageEvent<{ type: string; id: number; audio: Float32Array; language: SupportedLanguage }>) => {
  if (data.type === "dispose") { scope.close(); return; }
  if (data.type !== "transcribe") return;
  try {
    post({ type: "loading", id: data.id });
    const { transcriber, backend } = await loadModel(data.id);
    post({ type: "ready", id: data.id, backend });
    post({ type: "transcribing", id: data.id });
    const options = data.language === "auto"
      ? { task: "transcribe" as const }
      : { task: "transcribe" as const, language: data.language };
    const result = await transcriber(data.audio, options);
    const text = Array.isArray(result) ? result.map((item) => item.text).join(" ") : result.text;
    const reportedLanguage = !Array.isArray(result) && "language" in result ? result.language : undefined;
    const language: DetectedLanguage = typeof reportedLanguage === "string"
      && ["de", "en", "fa", "fr", "es", "it"].includes(reportedLanguage)
      ? reportedLanguage as DetectedLanguage
      : data.language === "auto" ? null : data.language;
    post({ type: "result", id: data.id, text: text.trim(), language });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unbekannter Fehler";
    const memoryHint = /memory|allocation|out of bounds/i.test(message) ? " Möglicherweise steht zu wenig Gerätespeicher zur Verfügung." : "";
    post({ type: "error", id: data.id, message: `Transkription fehlgeschlagen: ${message}${memoryHint}` });
  }
};

export {};
