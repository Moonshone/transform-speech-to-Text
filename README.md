# Transform Speech to Text

Lokale Speech-to-Text-App mit Python, Streamlit und faster-whisper.

## Funktionen

- Mikrofonaufnahme oder Audio-Upload
- automatische oder manuelle Sprachauswahl
- lokale Transkription mit Whisper
- TXT- und SRT-Export
- automatische Löschung temporärer Audiodateien

## Installation

```bash
python -m venv .venv
```

Windows:

```bash
.venv\Scripts\activate
```

Linux/macOS:

```bash
source .venv/bin/activate
```

```bash
pip install -r requirements.txt
streamlit run app.py
```

## Tests

```bash
pip install -r requirements-dev.txt
pytest
```

## Projektstruktur

```text
.
├── app.py
├── requirements.txt
├── requirements-dev.txt
├── src/
│   ├── config.py
│   ├── exporters.py
│   └── transcriber.py
└── tests/
    └── test_exporters.py
```
