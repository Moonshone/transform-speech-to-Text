"use client";

import { useEffect, useRef, useState } from "react";

import { BrowserTranscriber, type TranscriberStatus } from "../lib/browser-transcriber";
import { AudioUploadCard } from "./audio-upload-card";
import { RecorderCard } from "./recorder-card";
import { TranscriptCard } from "./transcript-card";
import {
  languageFromLocale,
  languageLabels,
  speechRecognitionLocales,
  type DetectedLanguage,
  type SupportedLanguage,
} from "../types/languages";

export type { SupportedLanguage } from "../types/languages";

const recognitionErrors: Partial<Record<SpeechRecognitionErrorCode, string>> = {
  "no-speech": "Es wurde keine Sprache erkannt. Bitte sprich deutlich in das Mikrofon.",
  "audio-capture": "Die Spracherkennung kann kein Mikrofonsignal empfangen.",
  network: "Die Spracherkennung konnte den Netzwerkdienst nicht erreichen.",
  "not-allowed": "Der Mikrofonzugriff für die Spracherkennung wurde abgelehnt.",
  "service-not-allowed": "Der Browser hat den Spracherkennungsdienst nicht zugelassen.",
  "language-not-supported": "Die gewählte Sprache wird von der Live-Spracherkennung dieses Browsers nicht unterstützt.",
};

function appendTranscript(current: string, addition: string): string {
  const cleanAddition = addition.trim();
  if (!cleanAddition) return current;
  return current.trim() ? `${current.trimEnd()} ${cleanAddition}` : cleanAddition;
}

export function SpeechToTextApp() {
  const [finalText, setFinalText] = useState("");
  const [language, setLanguage] = useState<SupportedLanguage>("auto");
  const [detectedLanguage, setDetectedLanguage] = useState<DetectedLanguage>(null);
  const [interimText, setInterimText] = useState("");
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<"Mikrofon" | "Upload" | null>(null);
  const [tab, setTab] = useState<"microphone" | "upload">("microphone");
  const [uploadStatus, setUploadStatus] = useState("");
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [isUploadBusy, setIsUploadBusy] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const shouldRecognizeRef = useRef(false);
  const restartCountRef = useRef(0);
  const restartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const transcriberRef = useRef<BrowserTranscriber | null>(null);

  const handleWorkerStatus = (status: TranscriberStatus): void => {
    if (status.type === "loading") {
      setUploadProgress(status.progress ?? null);
      setUploadStatus(status.progress === undefined ? "Spracherkennungsmodell wird geladen …" : "Modell wird geladen");
    } else if (status.type === "ready") {
      setUploadProgress(null);
      setUploadStatus(`Modell bereit (${status.backend === "webgpu" ? "WebGPU" : "WASM-Fallback"})`);
    } else if (status.type === "transcribing") setUploadStatus("Transkription läuft …");
  };

  const stopRecognition = (): void => {
    shouldRecognizeRef.current = false;
    if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
    restartTimerRef.current = null;
    recognitionRef.current?.stop();
    setIsRecognizing(false);
    setInterimText("");
  };

  const startRecognition = (): void => {
    setError(null);
    setSource("Mikrofon");
    const Recognition = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!Recognition) {
      setError("Dieser Browser unterstützt die Web Speech API nicht. Bitte verwende Chrome oder Edge.");
      return;
    }

    recognitionRef.current?.abort();
    const recognition = new Recognition();
    const browserLanguage = languageFromLocale(navigator.language);
    const effectiveLanguage = language === "auto" ? (browserLanguage ?? "de") : language;
    recognition.lang = speechRecognitionLocales[effectiveLanguage];
    recognition.continuous = true;
    recognition.interimResults = true;
    shouldRecognizeRef.current = true;
    restartCountRef.current = 0;
    recognitionRef.current = recognition;
    setIsRecognizing(true);

    recognition.onstart = () => setIsRecognizing(true);
    recognition.onresult = (event) => {
      restartCountRef.current = 0;
      let newFinal = "";
      let newInterim = "";
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const transcript = event.results[index][0]?.transcript ?? "";
        if (event.results[index].isFinal) newFinal += transcript;
        else newInterim += transcript;
      }
      if (newFinal.trim()) {
        setFinalText((current) => appendTranscript(current, newFinal));
        setDetectedLanguage(effectiveLanguage);
      }
      setInterimText(newInterim.trim());
    };
    recognition.onerror = (event) => {
      const automaticNoResult = language === "auto" && event.error === "no-speech";
      setError(automaticNoResult
        ? "Die automatische Spracherkennung hat kein Ergebnis geliefert. Bitte wähle möglichst eine Sprache aus."
        : recognitionErrors[event.error] ?? `Die Spracherkennung ist fehlgeschlagen (${event.error}).`);
      if (["not-allowed", "service-not-allowed", "audio-capture"].includes(event.error)) {
        shouldRecognizeRef.current = false;
      }
    };
    recognition.onend = () => {
      setIsRecognizing(false);
      if (!shouldRecognizeRef.current || recognitionRef.current !== recognition) return;
      if (restartCountRef.current >= 3) {
        shouldRecognizeRef.current = false;
        setError("Die Spracherkennung wurde mehrfach beendet und konnte nicht neu gestartet werden.");
        return;
      }
      restartCountRef.current += 1;
      restartTimerRef.current = setTimeout(() => {
        if (!shouldRecognizeRef.current || recognitionRef.current !== recognition) return;
        try {
          recognition.start();
        } catch {
          shouldRecognizeRef.current = false;
          setError("Die Spracherkennung konnte nicht neu gestartet werden.");
        }
      }, 300 * restartCountRef.current);
    };

    try {
      recognition.start();
    } catch {
      shouldRecognizeRef.current = false;
      setIsRecognizing(false);
      setError("Die Spracherkennung konnte nicht gestartet werden.");
    }
  };

  useEffect(() => {
    transcriberRef.current = new BrowserTranscriber(handleWorkerStatus);
    return () => {
      shouldRecognizeRef.current = false;
      if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
      recognitionRef.current?.abort();
      transcriberRef.current?.terminate();
    };
  }, []);

  const transcribeUpload = async (file: File): Promise<void> => {
    if (isUploadBusy) return;
    stopRecognition();
    setError(null);
    setUploadProgress(null);
    setUploadStatus("Audio wird vorbereitet …");
    setIsUploadBusy(true);
    try {
      const result = await transcriberRef.current!.transcribe(file, language);
      if (!result.text) throw new Error(language === "auto" ? "Die automatische Spracherkennung hat kein Ergebnis geliefert." : "In der Audiodatei wurde keine Sprache erkannt.");
      setFinalText(result.text);
      setDetectedLanguage(result.language);
      setInterimText("");
      setSource("Upload");
      setUploadStatus("Transkription abgeschlossen");
    } catch (uploadError) {
      const message = uploadError instanceof Error ? uploadError.message : "Transkription fehlgeschlagen.";
      setError(message);
      setUploadStatus("Transkription fehlgeschlagen");
    } finally {
      setUploadProgress(null);
      setIsUploadBusy(false);
    }
  };

  const clearTranscription = (): void => {
    stopRecognition();
    recognitionRef.current = null;
    setFinalText("");
    setInterimText("");
    setError(null);
    setSource(null);
    setDetectedLanguage(null);
    setUploadStatus("");
    setUploadProgress(null);
  };

  const displayedText = appendTranscript(finalText, interimText);

  return (
    <div className="mt-10">
      <div className="mb-5 max-w-md rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <label htmlFor="recording-language" className="block text-sm font-bold text-ink">Sprache der Aufnahme</label>
        <select
          id="recording-language"
          value={language}
          disabled={isRecognizing || isUploadBusy}
          onChange={(event) => setLanguage(event.target.value as SupportedLanguage)}
          className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-ink disabled:cursor-not-allowed disabled:bg-slate-100"
        >
          {(Object.entries(languageLabels) as [SupportedLanguage, string][]).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
      </div>
      <div className="mb-5 inline-flex rounded-xl bg-slate-200/70 p-1" role="tablist" aria-label="Eingabequelle">
        <button type="button" role="tab" aria-selected={tab === "microphone"} disabled={isUploadBusy} onClick={() => setTab("microphone")} className={`rounded-lg px-5 py-2.5 text-sm font-semibold ${tab === "microphone" ? "bg-white text-accent-700 shadow-sm" : "text-slate-600"}`}>Mikrofon</button>
        <button type="button" role="tab" aria-selected={tab === "upload"} disabled={isRecognizing} onClick={() => setTab("upload")} className={`rounded-lg px-5 py-2.5 text-sm font-semibold ${tab === "upload" ? "bg-white text-accent-700 shadow-sm" : "text-slate-600"}`}>Audiodatei hochladen</button>
      </div>
      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        {tab === "microphone"
          ? <RecorderCard language={language} onRecordingStart={startRecognition} onRecordingStop={stopRecognition} onReset={clearTranscription} />
          : <AudioUploadCard language={language} busy={isUploadBusy} status={uploadStatus} progress={uploadProgress} error={error} onTranscribe={transcribeUpload} onError={setError} onReset={clearTranscription} />}
        <TranscriptCard language={language} detectedLanguage={detectedLanguage} text={displayedText} source={source} status={isUploadBusy ? uploadStatus : undefined} isTranscribing={isRecognizing || isUploadBusy} error={tab === "microphone" ? error : null} onClear={clearTranscription} />
      </div>
    </div>
  );
}
