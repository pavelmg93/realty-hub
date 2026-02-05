"""Pretty-print Kestra execution logs from logs/kestra/.

Usage:
    python scripts/show_execution_log.py                 # Show all logs
    python scripts/show_execution_log.py --last 5        # Last 5 executions
    python scripts/show_execution_log.py --flow ingest   # Filter by flow name
    python scripts/show_execution_log.py --failures      # Only show entries with failures
"""

import json
from datetime import datetime
from pathlib import Path

import click

LOGS_DIR = Path(__file__).parent.parent / "logs" / "kestra"


def _load_logs(flow_filter: str | None = None) -> list[dict]:
    """Load and sort all JSON log files, newest first."""
    logs = []
    if not LOGS_DIR.exists():
        return logs

    for f in LOGS_DIR.glob("*.json"):
        try:
            data = json.loads(f.read_text(encoding="utf-8"))
            data["_file"] = f.name
            if flow_filter and flow_filter.lower() not in data.get("flow", "").lower():
                continue
            logs.append(data)
        except (json.JSONDecodeError, OSError):
            continue

    logs.sort(key=lambda x: x.get("timestamp", ""), reverse=True)
    return logs


def _format_entry(entry: dict) -> str:
    """Format a single log entry for display."""
    lines = []
    timestamp = entry.get("timestamp", "?")
    try:
        dt = datetime.fromisoformat(timestamp.replace("Z", "+00:00"))
        timestamp = dt.strftime("%Y-%m-%d %H:%M:%S UTC")
    except (ValueError, AttributeError):
        pass

    flow = entry.get("flow", "?")
    exec_id = entry.get("execution_id", "?")
    status = entry.get("status", "?")

    lines.append(f"  Flow:         {flow}")
    lines.append(f"  Execution:    {exec_id}")
    lines.append(f"  Time:         {timestamp}")
    lines.append(f"  Status:       {status}")

    # Ingest-specific fields
    if "rows_ingested" in entry:
        lines.append(f"  Rows ingested: {entry['rows_ingested']}")
        groups = entry.get("source_groups", [])
        if groups:
            lines.append(f"  Source groups: {', '.join(groups)}")
        warned = entry.get("empty_messages_warned", 0)
        if warned > 0:
            lines.append(f"  Empty msgs:   {warned} (warned)")

    # Parse-specific fields
    if "parsed" in entry and "failed" in entry:
        total = entry.get("total", 0)
        parsed = entry["parsed"]
        failed = entry["failed"]
        rate = entry.get("success_rate", 0)
        lines.append(f"  Total:        {total}")
        lines.append(f"  Parsed:       {parsed}")
        lines.append(f"  Failed:       {failed}")
        lines.append(f"  Success rate: {rate:.0%}")

        failures = entry.get("sample_failures", [])
        if failures:
            lines.append(f"  Sample failures ({len(failures)}):")
            for sf in failures:
                preview = sf.get("text_preview", "")[:80]
                errors = sf.get("errors", "")
                conf = sf.get("confidence", 0)
                lines.append(f"    - [{conf:.0%}] {preview}...")
                if errors:
                    lines.append(f"      Errors: {errors}")

    if "batch_id" in entry and entry["batch_id"]:
        lines.append(f"  Batch ID:     {entry['batch_id']}")

    return "\n".join(lines)


@click.command()
@click.option("--last", "-n", type=int, default=0, help="Show last N entries only.")
@click.option("--flow", "-f", type=str, default=None, help="Filter by flow name (substring).")
@click.option("--failures", is_flag=True, help="Only show entries with parse failures.")
def main(last: int, flow: str | None, failures: bool) -> None:
    """Display Kestra execution logs."""
    logs = _load_logs(flow_filter=flow)

    if failures:
        logs = [
            e for e in logs
            if e.get("failed", 0) > 0 or e.get("sample_failures")
        ]

    if last > 0:
        logs = logs[:last]

    if not logs:
        click.echo("No execution logs found.")
        click.echo(f"  Log directory: {LOGS_DIR}")
        return

    click.echo(f"Execution logs ({len(logs)} entries):\n")
    for i, entry in enumerate(logs):
        click.echo(f"[{i + 1}] {entry.get('_file', '?')}")
        click.echo(_format_entry(entry))
        click.echo()


if __name__ == "__main__":
    main()
