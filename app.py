import tempfile
from pathlib import Path

import streamlit as st

from src.exporters import segments_to_srt
from src.transcriber import transcribe_audio

st.set_page_config(page_title="Speech to Text", page_icon="🎙️")
st.title("🎙️ Speech-to-Text-App")
st.write("Nimm Sprache auf oder lade eine Audiodatei hoch.")

source = st.radio("Audioquelle", ["Datei hochladen", "Mikrofon"])

if source == "Datei hochladen":
    audio = st.file_uploader(
        "Audiodatei auswählen",
        type=["wav", "mp3", "m4a", "ogg", "flac"],
    )
else:
    audio = st.audio_input("Sprache aufnehmen", sample_rate=16000)

language = st.selectbox(
    "Sprache",
    options=["auto", "de", "en", "fa"],
    format_func=lambda value: {
        "auto": "Automatisch erkennen",
        "de": "Deutsch",
        "en": "Englisch",
        "fa": "Persisch",
    }[value],
)
model_size = st.selectbox("Whisper-Modell", ["tiny", "base", "small"], index=2)

if audio is not None:
    st.audio(audio)

    if st.button("Transkription starten", type="primary"):
        suffix = Path(getattr(audio, "name", "recording.wav")).suffix or ".wav"
        temp_path = None

        try:
            with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp_file:
                temp_file.write(audio.getvalue())
                temp_path = Path(temp_file.name)

            with st.spinner("Audio wird transkribiert ..."):
                result = transcribe_audio(
                    temp_path,
                    model_size=model_size,
                    language=None if language == "auto" else language,
                )

            st.success(f"Erkannte Sprache: {result.language}")
            st.text_area("Transkription", result.text, height=250)

            st.download_button(
                "TXT herunterladen",
                data=result.text,
                file_name="transkription.txt",
                mime="text/plain",
            )
            st.download_button(
                "SRT herunterladen",
                data=segments_to_srt(result.segments),
                file_name="transkription.srt",
                mime="application/x-subrip",
            )
        except Exception as exc:
            st.error(f"Die Transkription ist fehlgeschlagen: {exc}")
        finally:
            if temp_path and temp_path.exists():
                temp_path.unlink()
