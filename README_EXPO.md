Expo-ready README

This project includes a Tkinter desktop GUI and optional voice features.

To prepare for distribution (Windows exe) or an 'expo' deployment, follow these steps:

1) Create a clean virtual environment and install dependencies:

   python -m venv .venv
   .\.venv\Scripts\activate
   pip install -r requirements_enhanced.txt

2) Build a Windows executable with PyInstaller (recommended for quick expo packaging):

   pip install pyinstaller
   pyinstaller --onefile --add-data "VOICE_SETUP.md;." --name Konsultabot modern_gui.py

   The built exe will be in the `dist` folder and can be distributed to Windows machines.

3) Alternatively, package as a portable Python app (zip the venv) or create an installer using Inno Setup.

Notes:
- Ensure `GOOGLE_API_KEY` is set in the environment or a `.env` file in the same directory as the exe.
- For voice features, include the required native libraries (PyAudio) or use a prebuilt wheel.
- Test on a clean VM before publishing.
