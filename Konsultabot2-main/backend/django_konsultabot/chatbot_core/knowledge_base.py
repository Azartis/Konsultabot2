"""
Lightweight JSON-based Knowledge Base for KonsultaBot SUPPORT MODE.

Storage format (backend/django_konsultabot/storage/knowledge_base.json):
[
  {
    "id": "kb_1",
    "title": "WiFi not working",
    "question_pattern": "wifi not working",
    "answer": "Step-by-step fix...",
    "tags": ["wifi", "network"],
    "source": "kb" | "gemini",
    "created_at": "2025-11-29T08:00:00Z",
    "updated_at": "2025-11-29T08:00:00Z"
  },
  ...
]

The KB is purposely simple so it can be used both online and completely offline.
"""

from __future__ import annotations

import json
import os
from datetime import datetime, timezone
from threading import RLock
from typing import Dict, List, Optional, Tuple

from django.conf import settings

from .embeddings import build_embedding, most_similar


KB_PATH = os.path.join(settings.BASE_DIR, "storage", "knowledge_base.json")
_kb_cache: List[Dict] = []
_embedding_cache: Dict[str, Dict[str, float]] = {}
_kb_lock = RLock()


def _ensure_storage_dir() -> None:
    directory = os.path.dirname(KB_PATH)
    os.makedirs(directory, exist_ok=True)


def _load_kb() -> List[Dict]:
    global _kb_cache
    if _kb_cache:
        return _kb_cache

    _ensure_storage_dir()
    if not os.path.exists(KB_PATH):
        _kb_cache = []
        return _kb_cache

    try:
        with open(KB_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)
            if isinstance(data, list):
                _kb_cache = data
            else:
                _kb_cache = []
    except Exception:
        _kb_cache = []
    return _kb_cache


def _save_kb() -> None:
    _ensure_storage_dir()
    with open(KB_PATH, "w", encoding="utf-8") as f:
        json.dump(_kb_cache, f, ensure_ascii=False, indent=2)


def _iso_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def get_all_entries() -> List[Dict]:
    """Return all KB entries."""
    with _kb_lock:
        return list(_load_kb())


def add_entry(
    title: str,
    question_pattern: str,
    answer: str,
    tags: Optional[List[str]] = None,
    source: str = "gemini",
) -> Dict:
    """
    Add a new entry to the KB. Returns the created record.

    This is used when Gemini handles a SUPPORT MODE query that is not yet
    covered by the offline knowledge base.
    """
    with _kb_lock:
        kb = _load_kb()
        entry_id = f"kb_{len(kb) + 1}"
        now = _iso_now()
        entry = {
            "id": entry_id,
            "title": title or question_pattern[:60],
            "question_pattern": question_pattern,
            "answer": answer,
            "tags": tags or [],
            "source": source,
            "created_at": now,
            "updated_at": now,
        }
        kb.append(entry)
        _save_kb()
        # Update embedding cache lazily
        _embedding_cache[entry_id] = build_embedding(
            f"{question_pattern} {' '.join(entry['tags'])}"
        )
        return entry


def _build_embedding_cache() -> None:
    if _embedding_cache:
        return
    kb = _load_kb()
    for entry in kb:
        _embedding_cache[entry["id"]] = build_embedding(
            f"{entry.get('question_pattern', '')} {' '.join(entry.get('tags', []))}"
        )


def search_best_match(
    query: str,
    min_score: float = 0.35,
) -> Optional[Tuple[Dict, float]]:
    """
    Semantic-ish search over KB using lightweight embeddings.

    Returns (entry, score) if a good match is found, otherwise None.
    """
    with _kb_lock:
        _build_embedding_cache()
        candidates = list(_embedding_cache.items())
        scored = most_similar(query, candidates, top_k=1)
        if not scored:
            return None

        entry_id, score = scored[0]
        if score < min_score:
            return None

        for entry in _kb_cache:
            if entry["id"] == entry_id:
                return entry, score
        return None


__all__ = ["get_all_entries", "add_entry", "search_best_match", "KB_PATH"]


