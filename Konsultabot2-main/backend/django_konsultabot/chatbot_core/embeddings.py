"""
Simple text embeddings and similarity helpers for the KonsultaBot Knowledge Base.

This module deliberately avoids heavy dependencies so it can run in constrained
environments. It uses a basic bag-of-words + TF weighting approach and cosine
similarity. For production, you can swap this out for a proper vector DB or a
sentence-transformer model without changing callers.
"""

from __future__ import annotations

import math
from collections import Counter
from typing import Dict, List, Tuple


def _tokenize(text: str) -> List[str]:
    """Very small tokenizer: lowercase, split on non‑alphanumerics."""
    if not text:
        return []
    import re

    return [t for t in re.split(r"[^a-z0-9]+", text.lower()) if t]


def build_embedding(text: str) -> Dict[str, float]:
    """
    Build a sparse term‑frequency embedding for the given text.

    Returns a mapping token -> tf weight.
    """
    tokens = _tokenize(text)
    if not tokens:
        return {}
    counts = Counter(tokens)
    total = float(len(tokens))
    return {tok: cnt / total for tok, cnt in counts.items()}


def cosine_similarity(vec_a: Dict[str, float], vec_b: Dict[str, float]) -> float:
    """Cosine similarity for sparse vectors represented as dicts."""
    if not vec_a or not vec_b:
        return 0.0

    # Dot product on intersection
    common = set(vec_a.keys()) & set(vec_b.keys())
    dot = sum(vec_a[t] * vec_b[t] for t in common)

    # Norms
    norm_a = math.sqrt(sum(v * v for v in vec_a.values()))
    norm_b = math.sqrt(sum(v * v for v in vec_b.values()))
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return dot / (norm_a * norm_b)


def most_similar(
    query: str,
    candidates: List[Tuple[str, Dict[str, float]]],
    top_k: int = 3,
) -> List[Tuple[str, float]]:
    """
    Given a query string and a list of (id, embedding) pairs, return the top_k
    most similar IDs with their similarity scores.
    """
    query_vec = build_embedding(query)
    scored: List[Tuple[str, float]] = []
    for cid, emb in candidates:
        score = cosine_similarity(query_vec, emb)
        if score > 0:
            scored.append((cid, score))

    scored.sort(key=lambda x: x[1], reverse=True)
    return scored[:top_k]


__all__ = ["build_embedding", "cosine_similarity", "most_similar"]


