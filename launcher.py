import os
import sys
import tkinter as tk
from tkinter import messagebox

def check_google_api_key():
    key = os.getenv('GOOGLE_API_KEY') or ''
    return bool(key.strip())

def check_voice_dependencies():
    try:
        import speech_recognition as sr  # type: ignore
        import pyttsx3  # type: ignore
        import pyaudio  # type: ignore
        return True
    except Exception:
        return False

def check_microphone():
    # Attempt to open the default microphone briefly
    try:
        import speech_recognition as sr  # type: ignore
        with sr.Microphone() as source:
            return True
    except Exception:
        return False

def main():
    root = tk.Tk()
    root.withdraw()  # hide main window

    if not check_google_api_key():
        res = messagebox.askyesno("Missing API Key",
                                  "GOOGLE_API_KEY is not set. Without it, online AI features won't work.\n\nDo you want to open the documentation to set it up now?")
        if res:
            # open README or VOICE_SETUP
            doc = os.path.join(os.path.dirname(__file__), 'VOICE_SETUP.md')
            if os.path.exists(doc):
                try:
                    if sys.platform == 'win32':
                        os.startfile(doc)
                    else:
                        import webbrowser
                        webbrowser.open(doc)
                except Exception:
                    pass
        # continue anyway

    if not check_voice_dependencies():
        messagebox.showwarning("Voice dependencies missing",
                               "Voice features require: SpeechRecognition, PyAudio and pyttsx3.\nPlease install them if you want voice interaction.")

    if not check_microphone():
        messagebox.showwarning("Microphone not available",
                               "No usable microphone was detected. Voice input will be disabled.")

    # Launch the main GUI
    try:
        from modern_gui import ModernKonsultabotGUI
        app = ModernKonsultabotGUI()
        app.root.mainloop()
    except Exception as e:
        messagebox.showerror("Launch failed", f"Failed to start the application: {e}")

if __name__ == '__main__':
    main()
