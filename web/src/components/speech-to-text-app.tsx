"use client";

import { useEffect, useRef, useState } from "react";

import { RecorderCard } from "./recorder-card";
import { TranscriptCard } from "./transcript-card";

const recognitionErrors: Partial<Record<SpeechRecognitionErrorCode, string>> = {
  "no-speech": "Es wurde keine Sprache erkannt. Bitte sprich deutlich in das Mikrofon.",
  "audio-capture": "Die Spracherkennung kann kein Mikrofonsignal empfangen.",
  network: "Die Spracherkennung konnte den Netzwerkdienst nicht erreichen.",
  "not-allowed": "Der Mikrofonzugriff für die Spracherkennung wurde abgelehnt.",
  "service-not-allowed": "Der Browser hat den Spracherkennungsdienst nicht zugelassen.",
};

function appendTranscript(current: string, addition: string): string {
  const cleanAddition = addition.trim();
  if (!cleanAddition) return current;
  return current.trim() ? `${current.trimEnd()} ${cleanAddition}` : cleanAddition;
}

export function SpeechToTextApp() {
  const [finalText, setFinalText] = useState("");
  const [interimText, setInterimText] = useState("");
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const shouldRecognizeRef = useRef(false);
  const restartCountRef = useRef(0);
  const restartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    const Recognition = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!Recognition) {
      setError("Dieser Browser unterstützt die Web Speech API nicht. Bitte verwende Chrome oder Edge.");
      return;
    }

    recognitionRef.current?.abort();
    const recognition = new Recognition();
    recognition.lang = "de-DE";
    recognition.continuous = true;
    recognition.interimResults = true;
    shouldRecognizeRef.current = true;
    restartCountRef.current = 0;
    recognitionRef.current = recognition;

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
      if (newFinal.trim()) setFinalText((current) => appendTranscript(current, newFinal));
      setInterimText(newInterim.trim());
    };
    recognition.onerror = (event) => {
      setError(recognitionErrors[event.error] ?? `Die Spracherkennung ist fehlgeschlagen (${event.error}).`);
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
      setError("Die Spracherkennung konnte nicht gestartet werden.");
    }
  };

  useEffect(() => () => {
    shouldRecognizeRef.current = false;
    if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
    recognitionRef.current?.abort();
  }, []);

  const clearTranscription = (): void => {
    stopRecognition();
    recognitionRef.current = null;
    setFinalText("");
    setInterimText("");
    setError(null);
  };

  const displayedText = appendTranscript(finalText, interimText);

  return (
    <div className="mt-10 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
      <RecorderCard onRecordingStart={startRecognition} onRecordingStop={stopRecognition} onReset={clearTranscription} />
      <TranscriptCard text={displayedText} isTranscribing={isRecognizing} error={error} onClear={() => { setFinalText(""); setInterimText(""); setError(null); }} />
    </div>
  );
}
