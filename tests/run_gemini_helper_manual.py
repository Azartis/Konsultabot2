import sys
import types
import os
from pathlib import Path

# Ensure project root is on sys.path so importing top-level modules works
project_root = str(Path(__file__).resolve().parent.parent)
if project_root not in sys.path:
    sys.path.insert(0, project_root)

def make_fake_genai():
    genai = types.SimpleNamespace()

    class FakeModel:
        def __init__(self, name):
            self.name = name

        def generate_content(self, prompt):
            class R:
                def __init__(self, text):
                    self.text = text
            if "fail" in self.name:
                raise RuntimeError("model failure")
            return R(f"Response from {self.name}: {prompt}")

    def GenerativeModel(name):
        return FakeModel(name)

    def list_models():
        return [types.SimpleNamespace(name="models/fake-1"), types.SimpleNamespace(name="models/fake-2")]

    genai.GenerativeModel = GenerativeModel
    genai.list_models = list_models
    genai.configure = lambda api_key=None: None
    return genai


def main():
    # Inject fake module
    fake = make_fake_genai()
    fake_module = types.ModuleType("google.generativeai")
    fake_module.GenerativeModel = fake.GenerativeModel
    fake_module.list_models = fake.list_models
    fake_module.configure = fake.configure
    sys.modules["google.generativeai"] = fake_module

    # Ensure API key is set
    os.environ["GOOGLE_API_KEY"] = "test-key"

    try:
        import importlib
        gemini_helper = importlib.import_module("gemini_helper")

        model = gemini_helper._ensure_model()
        if not model:
            print("FAIL: _ensure_model returned None")
            sys.exit(2)

        resp = gemini_helper.ask_gemini("Hello from test")
        if "Response from" not in resp:
            print("FAIL: ask_gemini returned unexpected response:", resp)
            sys.exit(3)

        print("PASS: manual gemini helper test succeeded")
        sys.exit(0)
    except Exception as e:
        print("FAIL: Exception during test:", e)
        sys.exit(1)

if __name__ == '__main__':
    main()
