"""Contract tests for `latestnews.fs.writer`.

Covers the atomic-write guarantee, the stub frontmatter shape, and the
slug helper. Uses pytest's `tmp_path` fixture so each test owns an
isolated directory.
"""

from __future__ import annotations

from pathlib import Path
from unittest.mock import patch

import pytest
import yaml

from latestnews.fs.writer import (
    atomic_write,
    slugify,
    write_item_stub,
)

# ---------------------------------------------------------------------------
# atomic_write
# ---------------------------------------------------------------------------


def test_atomic_write_writes_text_content(tmp_path: Path) -> None:
    target = tmp_path / "note.md"
    atomic_write(target, "hello world\n")
    assert target.read_text(encoding="utf-8") == "hello world\n"


def test_atomic_write_writes_bytes_content(tmp_path: Path) -> None:
    target = tmp_path / "blob.bin"
    atomic_write(target, b"\x00\x01\x02")
    assert target.read_bytes() == b"\x00\x01\x02"


def test_atomic_write_overwrites_existing_file(tmp_path: Path) -> None:
    target = tmp_path / "note.md"
    target.write_text("old", encoding="utf-8")
    atomic_write(target, "new")
    assert target.read_text(encoding="utf-8") == "new"


def test_atomic_write_leaves_no_partial_file_on_flush_failure(
    tmp_path: Path,
) -> None:
    """If the underlying write raises, the target must not appear."""
    target = tmp_path / "note.md"

    # Patch os.fsync to raise — the write has completed but fsync fails.
    # atomic_write should clean up its tmp file and not create the target.
    with (
        patch("latestnews.fs.writer.os.fsync", side_effect=OSError("boom")),
        pytest.raises(OSError),
    ):
        atomic_write(target, "content")

    assert not target.exists()
    # Temp siblings are cleaned up.
    leftover = [p for p in tmp_path.iterdir() if p.name.startswith(".")]
    assert leftover == []


def test_atomic_write_supports_concurrent_different_paths(tmp_path: Path) -> None:
    """Two atomic_writes on different paths don't collide."""
    a = tmp_path / "a.md"
    b = tmp_path / "b.md"
    atomic_write(a, "A")
    atomic_write(b, "B")
    assert a.read_text(encoding="utf-8") == "A"
    assert b.read_text(encoding="utf-8") == "B"


# ---------------------------------------------------------------------------
# slugify
# ---------------------------------------------------------------------------


def test_slugify_basic_case() -> None:
    assert slugify("My First Item") == "my-first-item"


def test_slugify_collapses_separators() -> None:
    assert slugify("  Hello   World!!! ") == "hello-world"


def test_slugify_truncates_to_max_len() -> None:
    assert slugify("a" * 100, max_len=10) == "a" * 10


def test_slugify_empty_fallbacks_to_untitled() -> None:
    assert slugify("") == "untitled"
    assert slugify("   !!!  ") == "untitled"


def test_slugify_strips_non_ascii_to_dashes() -> None:
    # Non-ASCII characters collapse to `-` (ASCII transliteration is
    # post-MVP). `árvíztűrő` → dashes between ASCII-visible gaps.
    assert slugify("árvíztűrő") == "rv-zt-r"


# ---------------------------------------------------------------------------
# write_item_stub
# ---------------------------------------------------------------------------


def _parse_frontmatter(path: Path) -> dict[str, object]:
    body = path.read_text(encoding="utf-8")
    assert body.startswith("---\n")
    end = body.index("\n---\n", 4)
    return yaml.safe_load(body[4:end])


def test_write_item_stub_creates_file_with_required_fields(
    tmp_path: Path,
) -> None:
    path = write_item_stub(
        tmp_path,
        item_id="018f-test",
        source="url",
        source_type="url_html",
        title="Hello World",
    )
    assert path.exists()
    assert path.parent == tmp_path
    assert path.name.endswith("-hello-world.md")

    fm = _parse_frontmatter(path)
    assert fm["id"] == "018f-test"
    assert fm["schema_version"] == 1
    assert fm["source"] == "url"
    assert fm["source_type"] == "url_html"
    assert fm["sensitivity"] == "personal"
    assert fm["title"] == "Hello World"
    assert isinstance(fm["created_at"], str)
    assert fm["created_at"].endswith("Z")


def test_write_item_stub_preserves_field_order(tmp_path: Path) -> None:
    path = write_item_stub(
        tmp_path,
        item_id="x",
        source="file",
        source_type="pdf",
        title="doc",
    )
    body = path.read_text(encoding="utf-8")
    # Field order matters for Obsidian-friendliness.
    idx_id = body.index("id:")
    idx_schema = body.index("schema_version:")
    idx_source = body.index("source:")
    idx_source_type = body.index("source_type:")
    idx_sensitivity = body.index("sensitivity:")
    idx_created = body.index("created_at:")
    idx_title = body.index("title:")
    ordered = [
        idx_id,
        idx_schema,
        idx_source,
        idx_source_type,
        idx_sensitivity,
        idx_created,
        idx_title,
    ]
    assert ordered == sorted(ordered)


def test_write_item_stub_body_is_empty(tmp_path: Path) -> None:
    path = write_item_stub(
        tmp_path,
        item_id="x",
        source="url",
        source_type="url_html",
        title="t",
    )
    body = path.read_text(encoding="utf-8")
    # Frontmatter + empty body = ends with closing `---\n` then EOF.
    assert body.endswith("---\n")
    after = body[body.rindex("---\n") + 4 :]
    assert after == ""
