"""Photo download utilities for scraped listings."""

import hashlib
from pathlib import Path
from urllib.parse import quote, urlparse

import httpx


def _encode_url(url: str) -> str:
    """URL-encode the path component (handles spaces and special chars)."""
    parsed = urlparse(url)
    encoded_path = quote(parsed.path, safe="/")
    return parsed._replace(path=encoded_path).geturl()


async def download_photo(
    client: httpx.AsyncClient,
    url: str,
    dest_dir: Path,
    timeout: float = 30.0,
) -> tuple[str, int] | None:
    """Download a photo and save with a content-hashed filename.

    Args:
        client: Async HTTP client for making requests.
        url: URL of the photo to download.
        dest_dir: Directory to save the photo.
        timeout: Request timeout in seconds.

    Returns:
        Tuple of (relative file path, file size in bytes), or None on failure.
    """
    try:
        encoded_url = _encode_url(url)
        resp = await client.get(encoded_url, timeout=timeout, follow_redirects=True)
        resp.raise_for_status()
    except (httpx.HTTPError, httpx.TimeoutException) as exc:
        print(f"  [photo] Failed to download {url}: {exc}")
        return None

    content = resp.content
    if len(content) < 1000:
        # Likely an error page, not a real image
        print(f"  [photo] Skipping tiny response ({len(content)} bytes) from {url}")
        return None

    # Determine file extension from Content-Type or URL
    content_type = resp.headers.get("content-type", "")
    if "png" in content_type:
        ext = ".png"
    elif "webp" in content_type:
        ext = ".webp"
    elif "gif" in content_type:
        ext = ".gif"
    else:
        ext = ".jpg"

    # Hash the content for dedup-friendly filename
    content_hash = hashlib.md5(content).hexdigest()
    filename = f"{content_hash}{ext}"
    file_path = dest_dir / filename

    # Skip if already downloaded (content-based dedup)
    if not file_path.exists():
        dest_dir.mkdir(parents=True, exist_ok=True)
        file_path.write_bytes(content)

    return str(file_path), len(content)
