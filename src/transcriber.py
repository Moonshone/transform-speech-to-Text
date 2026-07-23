from dataclasses import dataclass
from pathlib import Path
from typing import Optional

from faster_whisper import WhisperModel

from src.config import DEFAULT_COMPUTE_TYPE, DEFAULT_DEVICE, DEFAULT_MODEL_SIZE


@dataclass(frozen=True)
class TranscriptSegment:
    start: float
    end: float
    text: str


@dataclass(frozen=True)
class TranscriptionResult:
    text: str
    language: str
    segments: list[TranscriptSegment]


def transcribe_audio(
    audio_path: str | Path,
    model_size: str = DEFAULT_MODEL_SIZE,
    language: Optional[str] = None,
    device: str = DEFAULT_DEVICE,
    compute_type: str = DEFAULT_COMPUTE_TYPE,
) -> TranscriptionResult:
    path = Path(audio_path)
    if not path.is_file():
        raise FileNotFoundError(f"Audiodatei nicht gefunden: {path}")

    model = WhisperModel(model_size, device=device, compute_type=compute_type)
    raw_segments, info = model.transcribe(
        str(path),
        language=language,
        vad_filter=True,
    )

    segments = [
        TranscriptSegment(
            start=float(segment.start),
            end=float(segment.end),
            text=segment.text.strip(),
        )
        for segment in raw_segments
        if segment.text.strip()
    ]

    return TranscriptionResult(
        text=" ".join(segment.text for segment in segments),
        language=info.language,
        segments=segments,
    )
