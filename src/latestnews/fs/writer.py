"""Atomic filesystem writer + markdown stub generator.

NFR-R3: a crash during save MUST NOT produce a half-written file at the
target path. The algorithm is temp-file-plus-rename with fsync at both the
file and directory levels:

    1. Write content into a uniquely-named temp file inside the target's
       parent directory.
    2. `flush()` the file handle and `os.fsync` the fd — forces the content
       to disk (through the OS page cache).
    3. `os.replace(tmp, target)` — atomic on POSIX.
    4. Open the parent directory and `os.fsync` its fd — forces the
       rename's metadata change to disk on ext4/XFS. No-op on Windows,
       harmless on macOS (APFS).

If any step raises, the temp file is best-effort cleaned up; the target is
never visible in a partially-written state.
"""

from __future__ import annotations

import os
import random
import re
from datetime import UTC, datetime
from pathlib import Path
from typing import Final

import yaml

_TMP_PREFIX: Final = "."
_TMP_SUFFIX_TEMPLATE: Final = ".tmp.{pid}.{rand}"


def _tmp_path_for(target: Path) -> Path:
    """Build a sibling temp path. `.`-prefix hides it from file browsers."""
    suffix = _TMP_SUFFIX_TEMPLATE.format(
        pid=os.getpid(),
        rand=random.randbytes(4).hex(),
    )
    return target.parent / f"{_TMP_PREFIX}{target.name}{suffix}"


def atomic_write(path: Path, content: str | bytes) -> None:
    """Write `content` to `path` atomically.

    The target file is either fully present after the call or not present
    at all. No partial writes, no corruption windows.

    Parameters
    ----------
    path:
        Target file path. Its parent directory MUST already exist.
    content:
        Text or binary content. `str` is UTF-8-encoded at write time.
    """
    tmp = _tmp_path_for(path)
    mode = "wb" if isinstance(content, bytes) else "w"
    encoding = None if isinstance(content, bytes) else "utf-8"

    try:
        with open(tmp, mode, encoding=encoding) as fh:
            fh.write(content)
            fh.flush()
            os.fsync(fh.fileno())
        # `os.replace` is the POSIX-semantic atomic rename; overwrites
        # target if present. On every supported platform.
        os.replace(tmp, path)
        # Directory fsync — needed on ext4/XFS so the rename's metadata
        # change is durable. No-op on Windows (NTFS).
        if hasattr(os, "O_DIRECTORY") or os.name == "posix":
            dir_fd = os.open(path.parent, os.O_RDONLY)
            try:
                os.fsync(dir_fd)
            finally:
                os.close(dir_fd)
    except BaseException:
        # Best-effort cleanup of the tmp file on any failure (including
        # KeyboardInterrupt). The target stays untouched.
        import contextlib

        with contextlib.suppress(OSError):
            tmp.unlink(missing_ok=True)
        raise


# ---------------------------------------------------------------------------
# Slugify + stub writer
# ---------------------------------------------------------------------------

_SLUG_REPLACE: Final = re.compile(r"[^a-z0-9]+")
_SLUG_TRIM: Final = re.compile(r"^-+|-+$")


def slugify(title: str, max_len: int = 40) -> str:
    """Filesystem-friendly slug: lowercase-ASCII-hyphens, truncated.

    Empty / all-non-alphanumeric input returns `"untitled"` so the filename
    is never empty.
    """
    lower = title.strip().lower()
    hyphenated = _SLUG_REPLACE.sub("-", lower)
    trimmed = _SLUG_TRIM.sub("", hyphenated)
    truncated = trimmed[:max_len]
    cleaned = _SLUG_TRIM.sub("", truncated)
    return cleaned or "untitled"


_TIMESTAMP_FORMAT: Final = "%Y%m%dT%H%M%SZ"


def _utc_now_filename_stamp() -> str:
    return datetime.now(tz=UTC).strftime(_TIMESTAMP_FORMAT)


def _utc_now_iso_millis() -> str:
    """ISO 8601 UTC with millisecond precision + `Z` suffix."""
    now = datetime.now(tz=UTC)
    # isoformat(timespec="milliseconds") → `2026-04-19T12:34:56.789+00:00`
    iso = now.isoformat(timespec="milliseconds")
    return iso.replace("+00:00", "Z")


def _build_frontmatter(
    *,
    item_id: str,
    source: str,
    source_type: str,
    title: str,
    created_at: str,
) -> str:
    # Field order matters — architecture spec + Obsidian-friendly. Build an
    # insertion-ordered dict; yaml.safe_dump with sort_keys=False preserves
    # it.
    payload = {
        "id": item_id,
        "schema_version": 1,
        "source": source,
        "source_type": source_type,
        "sensitivity": "personal",
        "created_at": created_at,
        "title": title,
    }
    body = yaml.safe_dump(
        payload,
        sort_keys=False,
        allow_unicode=True,
        default_flow_style=False,
    )
    return f"---\n{body}---\n"


def write_item_stub(
    data_root: Path,
    *,
    item_id: str,
    source: str,
    source_type: str,
    title: str,
) -> Path:
    """Write a markdown stub (frontmatter only, empty body) and return its path.

    Parameters mirror the frontmatter fields. `created_at` is set to UTC-now
    at call time. The stub filename is `{YYYYmmddTHHMMSSZ}-{slug}.md` in
    `data_root`.
    """
    created_at = _utc_now_iso_millis()
    filename = f"{_utc_now_filename_stamp()}-{slugify(title)}.md"
    target = data_root / filename
    content = _build_frontmatter(
        item_id=item_id,
        source=source,
        source_type=source_type,
        title=title,
        created_at=created_at,
    )
    atomic_write(target, content)
    return target
