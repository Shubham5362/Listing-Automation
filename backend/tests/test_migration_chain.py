from pathlib import Path
import re


def test_every_migration_parent_exists():
    versions = Path(__file__).resolve().parents[1] / "migrations" / "versions"
    revision_ids = set()
    parents = {}

    for path in versions.glob("*.py"):
        source = path.read_text(encoding="utf-8")
        revision_match = re.search(r"(?:^|\n)revision\s*=\s*[\"']([^\"']+)", source)
        if not revision_match:
            continue
        revision = revision_match.group(1)
        revision_ids.add(revision)
        parent_match = re.search(r"(?:^|\n)down_revision\s*=\s*(?:[\"']([^\"']+)[\"']|None)", source)
        if parent_match and parent_match.group(1):
            parents[revision] = parent_match.group(1)

    missing = {revision: parent for revision, parent in parents.items() if parent not in revision_ids}
    assert not missing, f"Migration(s) reference missing parent revisions: {missing}"
