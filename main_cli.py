"""
Simple CLI entry to demo KonsultaBot with automatic online/offline switching.

Usage:
  python main_cli.py

Type 'exit' or 'quit' to leave.
"""
from __future__ import annotations

import sys

from chatbot_core import get_bot_response


def run_cli() -> None:
    print("KonsultaBot CLI (online/offline). Type 'exit' to quit.\n")
    language = "english"

    while True:
        try:
            user_input = input("You: ").strip()
        except (EOFError, KeyboardInterrupt):
            print("\nGoodbye!")
            break

        if not user_input:
            continue
        if user_input.lower() in {"exit", "quit"}:
            print("Goodbye!")
            break

        result = get_bot_response(user_input, language)
        text = result.get("response", "(no response)")
        mode = result.get("mode", "unknown")
        print(f"Bot ({mode}): {text}\n")


if __name__ == "__main__":
    run_cli()
