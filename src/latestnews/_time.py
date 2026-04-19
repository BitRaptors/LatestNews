"""Shared time-formatting helpers.

Centralises the two UTC timestamp shapes the app uses:
  - `utc_now_iso_millis()` — ISO 8601 UTC with millisecond precision and
    a `Z` suffix. Used in YAML frontmatter `created_at` and SSE event
    `meta.timestamp` fields.
  - `utc_now_filename_stamp()` — compact `YYYYmmddTHHMMSSZ` form. Used in
    the human-readable half of the stub filename.

Hoisted out of `fs/writer.py` so `ingest/coordinator.py` can share the
same formatter when it stamps event envelopes.
"""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Final

_FILENAME_FORMAT: Final = "%Y%m%dT%H%M%SZ"


def utc_now_iso_millis() -> str:
    """ISO 8601 UTC with millisecond precision + `Z` suffix."""
    now = datetime.now(tz=UTC)
    # isoformat(timespec="milliseconds") → `2026-04-19T12:34:56.789+00:00`
    return now.isoformat(timespec="milliseconds").replace("+00:00", "Z")


def utc_now_filename_stamp() -> str:
    """Compact UTC timestamp suitable for filenames: `YYYYmmddTHHMMSSZ`."""
    return datetime.now(tz=UTC).strftime(_FILENAME_FORMAT)
