"""CLI entry point for running web scrapers.

Usage:
    python -m src.scraping.cli --site batdongsannhatrang --agent-phone 0901953889
"""

import asyncio
import os
from pathlib import Path

import click
from sqlalchemy import text

from src.db.connection import get_engine, get_session


def _resolve_agent_id(db_url: str, phone: str) -> int:
    """Look up agent ID by phone number."""
    engine = get_engine(db_url)
    session = get_session(engine)
    try:
        result = session.execute(
            text("SELECT id FROM agents WHERE phone = :phone"),
            {"phone": phone},
        )
        row = result.fetchone()
        if not row:
            raise click.ClickException(
                f"No agent found with phone '{phone}'. "
                f"Create one first with scripts/create_agent.sh"
            )
        return row[0]
    finally:
        session.close()


@click.command()
@click.option(
    "--site",
    default="batdongsannhatrang",
    type=click.Choice(["batdongsannhatrang"]),
    help="Which site scraper to run.",
)
@click.option(
    "--max-listings",
    default=0,
    type=int,
    help="Max listings to scrape (0 = all).",
)
@click.option(
    "--agent-phone",
    required=True,
    help="Phone number of the agent to assign listings to.",
)
@click.option(
    "--headless/--no-headless",
    default=True,
    help="Run browser in headless mode.",
)
@click.option(
    "--uploads-dir",
    default=None,
    type=click.Path(),
    help="Directory for photo downloads. Defaults to ./uploads/",
)
def scrape(
    site: str,
    max_listings: int,
    agent_phone: str,
    headless: bool,
    uploads_dir: str | None,
) -> None:
    """Scrape real estate listings from a website into the database."""
    db_url = os.environ.get(
        "DATABASE_URL",
        "postgresql://re_nhatrang:change_me_in_production@localhost:5432/re_nhatrang",
    )

    agent_id = _resolve_agent_id(db_url, agent_phone)
    print(f"Agent ID: {agent_id} (phone: {agent_phone})")

    upload_path = Path(uploads_dir) if uploads_dir else Path("./uploads")
    upload_path.mkdir(parents=True, exist_ok=True)

    if site == "batdongsannhatrang":
        from src.scraping.batdongsannhatrang import BatDongSanNhaTrangScraper

        scraper = BatDongSanNhaTrangScraper(
            db_url=db_url,
            uploads_dir=upload_path,
            agent_id=agent_id,
            headless=headless,
        )
    else:
        raise click.ClickException(f"Unknown site: {site}")

    counts = asyncio.run(scraper.run(max_listings=max_listings))
    print(f"\nResults: {counts}")


if __name__ == "__main__":
    scrape()
