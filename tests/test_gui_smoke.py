import sys
import types
from pathlib import Path

project_root = str(Path(__file__).resolve().parent.parent)
if project_root not in sys.path:
    sys.path.insert(0, project_root)

import importlib


def test_apply_transcript_and_busy(monkeypatch):
    gui_mod = importlib.import_module('modern_gui')
    # Create a minimal instance without calling setup_main_window to avoid Tk init
    gui = object.__new__(gui_mod.ModernKonsultabotGUI)
    # set required attributes used by _apply_transcript
    gui.message_entry = types.SimpleNamespace()
    gui.chat_display = types.SimpleNamespace()
    def fake_insert(a, b):
        pass
    gui.message_entry.delete = lambda a, b: None
    gui.message_entry.insert = lambda idx, text: setattr(gui, '_last_insert', text)
    gui.display_message = lambda s, m, t: setattr(gui, '_last_display', (s, m, t))

    # run apply transcript
    gui._apply_transcript('hello world')
    assert getattr(gui, '_last_insert', None) == 'hello world'

    # test busy toggling
    gui.send_btn = types.SimpleNamespace()
    gui.message_entry = types.SimpleNamespace()
    gui.send_btn.config = lambda **kw: setattr(gui, '_send_btn_state', kw)
    gui.message_entry.config = lambda **kw: setattr(gui, '_entry_state', kw)
    gui._set_ui_busy(True)
    assert getattr(gui, '_send_btn_state', None) is not None
