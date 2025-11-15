"""
Manual GUI runner for local testing.
Run this on a machine with a display. It will open the GUI and let you test voice and responsiveness.
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from modern_gui import ModernKonsultabotGUI

if __name__ == '__main__':
    app = ModernKonsultabotGUI()
    app.root.mainloop()
