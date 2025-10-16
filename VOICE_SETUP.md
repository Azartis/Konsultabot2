Voice setup and manual test instructions

1) Install dependencies (prefer virtualenv):

   pip install -r requirements.txt

   If you prefer to only install voice deps:

   pip install SpeechRecognition pyttsx3 pyaudio

   Note: On Windows, installing pyaudio via pip may require the appropriate wheel. If pip install pyaudio fails, try:

   - Download a prebuilt .whl from https://www.lfd.uci.edu/~gohlke/pythonlibs/#pyaudio and install with:

     pip install path\to\PyAudio‑<version>.whl

2) Test microphone access:

   - Run the GUI with `python tests/run_gui_manual.py` and click the microphone button.
   - Speak a short phrase. The recognized phrase should appear in the input box and auto-send.

3) Troubleshooting:

   - If you see the warning 'Voice features not available', ensure the above packages are installed in the same Python environment.
   - On Windows, ensure microphone access is enabled for apps and that your default audio device works.
