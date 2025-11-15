import sys
import types
import pytest

# We'll import the module under test dynamically after inserting a fake google.generativeai

def make_fake_genai(working_model_name="fake-model"):
    genai = types.SimpleNamespace()

    class FakeModel:
        def __init__(self, name):
            self.name = name

        def generate_content(self, prompt):
            # Return an object with .text attribute to mimic real SDK
            class R:
                def __init__(self, text):
                    self.text = text
            if "fail" in self.name:
                raise RuntimeError("model failure")
            return R(f"Response from {self.name}: {prompt}")

    def GenerativeModel(name):
        return FakeModel(name)

    def list_models():
        # return a list of objects with .name
        return [types.SimpleNamespace(name="fake-model"), types.SimpleNamespace(name="another-model"), {"name": "dict-model"}]

    genai.GenerativeModel = GenerativeModel
    genai.list_models = list_models
    genai.configure = lambda api_key=None: None
    import sys
    import types
    import pytest

    # We'll import the module under test dynamically after inserting a fake google.generativeai

    def make_fake_genai(working_model_name="fake-model"):
        genai = types.SimpleNamespace()

        class FakeModel:
            def __init__(self, name):
                self.name = name

            def generate_content(self, prompt):
                # Return an object with .text attribute to mimic real SDK
                class R:
                    def __init__(self, text):
                        self.text = text
                if "fail" in self.name:
                    raise RuntimeError("model failure")
                return R(f"Response from {self.name}: {prompt}")

        def GenerativeModel(name):
            return FakeModel(name)

        def list_models():
            # return a list of objects with .name
            return [types.SimpleNamespace(name="fake-model"), types.SimpleNamespace(name="another-model"), {"name": "dict-model"}]

        genai.GenerativeModel = GenerativeModel
        genai.list_models = list_models
        genai.configure = lambda api_key=None: None
        return genai


    def test_model_selection_and_ask(monkeypatch, tmp_path):
        # Create a fake genai module and inject into sys.modules
        fake_genai = make_fake_genai()
        fake_module = types.ModuleType("google.generativeai")
        fake_module.__dict__.update(genai=fake_genai)

        # monkeypatch the actual google.generativeai import to our fake
        sys.modules["google.generativeai"] = fake_module

        # Ensure env var is set for API key
        monkeypatch.setenv("GOOGLE_API_KEY", "test-key")

        # Now import the gemini_helper (it will pick up our fake genai)
        import importlib
        gemini_helper = importlib.import_module("gemini_helper")

        # Ensure initialization picks a working model
        model = gemini_helper._ensure_model()
        assert model is not None

        # Test ask_gemini returns text
        resp = gemini_helper.ask_gemini("Hello test")
        assert "Response from" in resp

        # Cleanup
        del sys.modules["google.generativeai"]