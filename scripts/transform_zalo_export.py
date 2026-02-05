"""CLI tool to convert Zalo chat exports into standardized CSV format.

Usage:
    python scripts/transform_zalo_export.py input.txt output.csv --group "BDS Nha Trang"
    python scripts/transform_zalo_export.py input.txt  # outputs to input_transformed.csv
"""

from pathlib import Path

import click

from src.ingestion.zalo_transformer import transform_chat_export


@click.command()
@click.argument("input_path", type=click.Path(exists=True, path_type=Path))
@click.argument("output_path", type=click.Path(path_type=Path), required=False)
@click.option(
    "--group",
    "-g",
    default="",
    help="Zalo group name to tag messages with.",
)
def main(input_path: Path, output_path: Path | None, group: str) -> None:
    """Convert a Zalo chat export file to standardized CSV format."""
    if output_path is None:
        output_path = input_path.with_name(f"{input_path.stem}_transformed.csv")

    click.echo(f"Input:  {input_path}")
    click.echo(f"Output: {output_path}")
    click.echo(f"Group:  {group or '(not set)'}")

    count = transform_chat_export(input_path, output_path, source_group=group)
    click.echo(f"Transformed {count} messages to {output_path}")


if __name__ == "__main__":
    main()
