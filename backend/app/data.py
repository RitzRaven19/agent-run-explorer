import json
import logging
import os
from pathlib import Path

from pydantic import ValidationError

from app.models import Run

logger = logging.getLogger(__name__)

# Resolved from this file's location (backend/app/data.py), not the working directory,
# so it works locally and on Render.
DEFAULT_DATA_PATH = Path(__file__).resolve().parents[2] / "data" / "runs.jsonl"

runs: list[Run] = []
data_warnings: list[str] = []


def load_data() -> None:
    """Fill the module-level `runs` and `data_warnings` from DATA_PATH. Never raises on bad data."""
    path = Path(os.environ.get("DATA_PATH") or DEFAULT_DATA_PATH)
    loaded, warnings = load_runs(path)
    runs.clear()
    runs.extend(loaded)
    data_warnings.clear()
    data_warnings.extend(warnings)
    for warning in warnings:
        logger.warning(warning)
    logger.info("Loaded %d runs from %s (%d warnings)", len(loaded), path, len(warnings))


def load_runs(path: Path) -> tuple[list[Run], list[str]]:
    """Read a JSONL file and return (clean-enough runs, warnings about everything odd)."""
    warnings: list[str] = []
    parsed = parse_lines(path, warnings)
    unique_runs = resolve_duplicates(parsed)
    for run in unique_runs:
        # extend, not assign: a kept duplicate already carries the note about the copy that was dropped.
        run.warnings.extend(find_run_warnings(run))
        warnings.extend(f"{run.id}: {warning}" for warning in run.warnings)
    return unique_runs, warnings


def parse_lines(path: Path, warnings: list[str]) -> list[tuple[int, Run]]:
    """Parse each line on its own so one bad line cannot stop the rest. Returns (line number, run)."""
    parsed: list[tuple[int, Run]] = []
    try:
        lines = path.read_text(encoding="utf-8").splitlines()
    except OSError as error:
        warnings.append(f"Could not read data file {path}: {error}")
        return parsed

    for line_number, line in enumerate(lines, start=1):
        if not line.strip():
            continue
        try:
            parsed.append((line_number, Run.model_validate(json.loads(line))))
        except json.JSONDecodeError as error:
            warnings.append(f"line {line_number}: skipped, not valid JSON ({error.msg})")
        except ValidationError as error:
            fields = ", ".join(".".join(str(part) for part in e["loc"]) for e in error.errors())
            warnings.append(f"line {line_number}: skipped, failed validation on: {fields}")
    return parsed


def find_inconsistencies(run: Run) -> list[str]:
    """Contradictions inside a single record, e.g. 'succeeded' with no end time."""
    problems: list[str] = []
    if run.status == "running":
        if run.ended_at is not None:
            problems.append("status is 'running' but ended_at is set")
    else:
        if run.ended_at is None:
            problems.append(f"status is '{run.status}' but ended_at is missing")
        if run.duration_ms is None:
            problems.append(f"status is '{run.status}' but duration_ms is missing")
        if any(step.status == "running" for step in run.steps):
            problems.append(f"status is '{run.status}' but a step is still running")
    return problems


def resolve_duplicates(parsed: list[tuple[int, Run]]) -> list[Run]:
    """Keep one record per id: the one with the fewest contradictions (the first on a tie).

    The kept run gets a warning about each dropped copy, so its own page can explain the choice.
    """
    by_id: dict[str, list[tuple[int, Run]]] = {}
    for line_number, run in parsed:
        by_id.setdefault(run.id, []).append((line_number, run))

    unique_runs: list[Run] = []
    for run_id, copies in by_id.items():
        # min() returns the first of equal items, so ties keep the earlier line.
        kept_line, kept = min(copies, key=lambda copy: len(find_inconsistencies(copy[1])))
        unique_runs.append(kept)
        for line_number, dropped in copies:
            if line_number == kept_line:
                continue
            reasons = find_inconsistencies(dropped) or ["it has no contradictions, but so does the kept copy"]
            kept.warnings.append(
                f"duplicate id. Kept line {kept_line} (status '{kept.status}'), "
                f"dropped line {line_number} (status '{dropped.status}') because "
                + "; ".join(reasons)
            )
    return unique_runs


def find_run_warnings(run: Run) -> list[str]:
    """Per-run warnings shown as a badge in the UI."""
    warnings = find_inconsistencies(run)
    if run.cost_usd is None:
        warnings.append("unpriced: cost_usd is missing")
    if run.duration_ms is not None and run.duration_ms < 0:
        warnings.append(
            f"invalid duration: duration_ms is {run.duration_ms} (ended_at is before started_at)"
        )
    if run.error is not None and run.error.step_index >= len(run.steps):
        warnings.append(
            f"error points to step {run.error.step_index} but only {len(run.steps)} steps were recorded"
        )
    return warnings
