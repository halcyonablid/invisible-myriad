from __future__ import annotations

import argparse
import json
import re
from datetime import datetime, timezone
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
OBSIDIAN_MEMORY = ROOT / "memory" / "obsidian-plugin-system"
ATLAS = OBSIDIAN_MEMORY / "atlas"
FRAMEWORK = OBSIDIAN_MEMORY / "framework"
CHANGE_RECORDS = OBSIDIAN_MEMORY / "change-records"
CARDS = OBSIDIAN_MEMORY / "cards"
SKILLS = ROOT / "skills"
RESULTS = ROOT / "results"
OUTPUT = RESULTS / "atlas_query_last.json"


MAX_CARDS = 12
MAX_CHANGE_RECORDS = 12
MAX_SKILL_RULES = 8
MAX_ATLAS_PAGES = 12


def rel(path: Path) -> str:
    return path.relative_to(ROOT).as_posix()


def read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def title_for(text: str, path: Path) -> str:
    match = re.search(r"^#\s+(.+)$", text, flags=re.MULTILINE)
    return match.group(1).strip() if match else path.stem


def line_number(text: str, offset: int) -> int:
    return text.count("\n", 0, offset) + 1


def excerpt(text: str, query: str, max_len: int = 220) -> str:
    idx = text.lower().find(query.lower())
    if idx < 0:
        idx = 0
    start = max(0, idx - 80)
    end = min(len(text), idx + max_len)
    return re.sub(r"\s+", " ", text[start:end]).strip()


def split_aliases(value: str) -> list[str]:
    return [part.strip() for part in re.split(r"[,，、]", value) if part.strip()]


def load_glossary() -> dict[str, dict]:
    path = ATLAS / "glossary.md"
    if not path.exists():
        return {}
    text = read(path)
    entries: dict[str, dict] = {}
    matches = list(re.finditer(r"^##\s+(.+?)\s*$", text, flags=re.MULTILINE))
    for idx, match in enumerate(matches):
        heading = match.group(1).strip()
        start = match.end()
        end = matches[idx + 1].start() if idx + 1 < len(matches) else len(text)
        body = text[start:end]
        meta = {"heading": heading, "canonical_term": heading, "aliases": [], "body": body.strip(), "path": rel(path)}
        for key in ("canonical_term", "type", "owner", "meaning", "not", "related"):
            found = re.search(rf"^\s*-\s*{re.escape(key)}:\s*(.+?)\s*$", body, flags=re.MULTILINE)
            if found:
                meta[key] = found.group(1).strip()
        if "aliases" in body:
            found = re.search(r"^\s*-\s*aliases:\s*(.+?)\s*$", body, flags=re.MULTILINE)
            if found:
                meta["aliases"] = split_aliases(found.group(1))
        entries[heading] = meta
    return entries


def load_aliases() -> tuple[dict[str, dict], list[dict]]:
    path = ATLAS / "aliases.md"
    if not path.exists():
        return {}, []
    text = read(path)
    alias_map: dict[str, dict] = {}
    forbidden = []
    for line in text.splitlines():
        if not line.strip().startswith("|") or "---" in line:
            continue
        cells = [cell.strip() for cell in line.strip().strip("|").split("|")]
        if len(cells) < 4 or cells[0] == "Alias / phrase":
            continue
        alias_map[cells[0]] = {
            "alias": cells[0],
            "canonical_term": cells[1],
            "allowed_meaning": cells[2],
            "danger": cells[3],
            "path": rel(path),
        }
    for match in re.finditer(r"Do not conflate `([^`]+)` with `?([^`.\n]+)`?", text):
        forbidden.append({"left": match.group(1).strip(), "right": match.group(2).strip().rstrip("."), "path": rel(path)})
    return alias_map, forbidden


def canonical_for(query: str, glossary: dict[str, dict], aliases: dict[str, dict]) -> tuple[str | None, list[dict], list[str]]:
    warnings = []
    alias_matches = []
    exact_glossary = [entry for term, entry in glossary.items() if query == term or query == entry.get("canonical_term")]
    if exact_glossary:
        return exact_glossary[0].get("canonical_term"), alias_matches, warnings

    for entry in glossary.values():
        if query in entry.get("aliases", []):
            alias_matches.append({"alias": query, "canonical_term": entry.get("canonical_term"), "source": "glossary"})
            return entry.get("canonical_term"), alias_matches, warnings

    if query in aliases:
        item = aliases[query]
        alias_matches.append(item)
        if item["canonical_term"] == "ambiguous":
            candidates = re.findall(r"[\u4e00-\u9fffA-Za-z：/ ]+", item.get("allowed_meaning", ""))
            warnings.append(f"Ambiguous alias '{query}'. Inspect context before choosing a canonical term.")
            return None, alias_matches, warnings + [f"Candidate context: {item.get('allowed_meaning')}"]
        return item["canonical_term"], alias_matches, warnings

    partial = []
    for entry in glossary.values():
        haystack = " ".join([entry.get("heading", ""), entry.get("canonical_term", ""), " ".join(entry.get("aliases", []))])
        if query in haystack or haystack in query:
            partial.append(entry.get("canonical_term"))
    if len(set(partial)) > 1:
        warnings.append(f"Query matches multiple canonical terms: {sorted(set(partial))}")
        return None, alias_matches, warnings
    if partial:
        return partial[0], alias_matches, warnings
    return None, alias_matches, warnings


def score_text(text: str, query: str, canonical: str | None) -> int:
    score = 0
    lowered = text.lower()
    for term, weight in [(query, 10), (canonical or "", 8)]:
        if term and term.lower() in lowered:
            score += weight
    return score


def search_paths(paths: list[Path], query: str, canonical: str | None, limit: int) -> list[dict]:
    hits = []
    for path in paths:
        if not path.exists() or path.suffix.lower() != ".md":
            continue
        text = read(path)
        score = score_text(text, query, canonical)
        if score <= 0:
            continue
        first_term = canonical if canonical and canonical in text else query
        offset = text.find(first_term) if first_term in text else 0
        heading_score = 5 if re.search(rf"^#+\s+.*{re.escape(first_term)}", text, flags=re.MULTILINE) else 0
        score += heading_score
        hits.append(
            {
                "path": rel(path),
                "title": title_for(text, path),
                "score": score,
                "line": line_number(text, offset),
                "excerpt": excerpt(text, first_term),
            }
        )
    return sorted(hits, key=lambda item: (-item["score"], item["path"]))[:limit]


def atlas_pages() -> list[Path]:
    return sorted(ATLAS.rglob("*.md")) if ATLAS.exists() else []


def framework_pages() -> list[Path]:
    paths = [FRAMEWORK / "registry.md", FRAMEWORK / "question-map.md", ATLAS / "unknowns-register.md"]
    return [path for path in paths if path.exists()]


def limited_recent(root: Path, limit: int) -> list[Path]:
    if not root.exists():
        return []
    return sorted(root.rglob("*.md"), key=lambda p: p.stat().st_mtime, reverse=True)[:limit * 4]


def skill_pages() -> list[Path]:
    return [
        path
        for path in [
            SKILLS / "obsidian-system-plugin-dev" / "SKILL.md",
            SKILLS / "obsidian-project-effectiveness-coach" / "SKILL.md",
        ]
        if path.exists()
    ]


def main() -> int:
    parser = argparse.ArgumentParser(description="Query the Obsidian system Atlas before broader evidence reading.")
    parser.add_argument("query", help="Concept or term to look up in the Atlas.")
    args = parser.parse_args()
    query = args.query.strip()

    glossary = load_glossary()
    aliases, forbidden = load_aliases()
    canonical, alias_matches, warnings = canonical_for(query, glossary, aliases)
    glossary_entry = None
    if canonical:
        for entry in glossary.values():
            if entry.get("canonical_term") == canonical or entry.get("heading") == canonical:
                glossary_entry = {k: v for k, v in entry.items() if k != "body"}
                glossary_entry["body_excerpt"] = excerpt(entry.get("body", ""), canonical)
                break

    related_atlas_pages = search_paths(atlas_pages(), query, canonical, MAX_ATLAS_PAGES)
    related_framework = search_paths(framework_pages(), query, canonical, 8)
    related_change_records = search_paths(limited_recent(CHANGE_RECORDS, MAX_CHANGE_RECORDS), query, canonical, MAX_CHANGE_RECORDS)
    related_cards = search_paths(limited_recent(CARDS, MAX_CARDS), query, canonical, MAX_CARDS)
    relevant_skill_rules = search_paths(skill_pages(), query, canonical, MAX_SKILL_RULES)
    open_unknowns = [hit for hit in related_framework if "unknowns-register.md" in hit["path"] or "question-map.md" in hit["path"]]

    forbidden_hits = [
        item for item in forbidden if query in item["left"] or query in item["right"] or (canonical and (canonical in item["left"] or canonical in item["right"]))
    ]

    result = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "query": query,
        "canonical_term": canonical,
        "alias_matches": alias_matches,
        "warnings": warnings,
        "glossary_entry": glossary_entry,
        "forbidden_conflations": forbidden_hits,
        "related_atlas_pages": related_atlas_pages,
        "related_framework_entries": related_framework,
        "open_unknowns": open_unknowns,
        "related_cards": related_cards,
        "related_change_records": related_change_records,
        "relevant_skill_rules": relevant_skill_rules,
        "boundaries": {
            "scanned_runtime": False,
            "scanned_business_json": False,
            "scanned_state_cards": False,
            "scanned_workspaces": False,
            "note": "This query is an Atlas-first locator. It does not prove code facts and does not replace later evidence reading.",
        },
    }

    RESULTS.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
