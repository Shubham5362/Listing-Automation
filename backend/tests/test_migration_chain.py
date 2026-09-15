from pathlib import Path
import re


def _migration_graph():
    versions = Path(__file__).resolve().parents[1] / "migrations" / "versions"
    revision_ids = []
    parents = {}
    for path in versions.glob("*.py"):
        source = path.read_text(encoding="utf-8")
        revision_match = re.search(r"(?:^|\n)revision\s*=\s*[\"']([^\"']+)", source)
        if not revision_match:
            continue
        revision = revision_match.group(1)
        revision_ids.append(revision)
        parent_match = re.search(r"(?:^|\n)down_revision\s*=\s*(?:[\"']([^\"']+)[\"']|None)", source)
        if parent_match and parent_match.group(1):
            parents[revision] = parent_match.group(1)
    return revision_ids, parents


def test_every_migration_parent_exists():
    revision_ids, parents = _migration_graph()
    known = set(revision_ids)
    missing = {revision: parent for revision, parent in parents.items() if parent not in known}
    assert not missing, f"Migration(s) reference missing parent revisions: {missing}"


def test_migration_revisions_are_unique_and_final_head_exists():
    revision_ids, _ = _migration_graph()
    duplicates = {revision for revision in revision_ids if revision_ids.count(revision) > 1}
    assert not duplicates, f"Duplicate migration revision IDs: {sorted(duplicates)}"
    assert "0036_final_ai_seller_os" in revision_ids
