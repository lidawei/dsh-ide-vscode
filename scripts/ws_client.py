#!/usr/bin/env python3
"""Manual WebSocket client for DSH IDE Bridge (dsh-ide-vscode).

Reads discovery lock files under $DSH_HOME/ide/, connects, authenticates,
and prints all server messages as pretty JSON.

Usage:
  python scripts/ws_client.py
  python scripts/ws_client.py --port 42381 --token <uuid>
  python scripts/ws_client.py --lock "%USERPROFILE%\\.dsh\\ide\\42381.lock"
"""

from __future__ import annotations

import argparse
import asyncio
import glob
import json
import os
import sys
from pathlib import Path
from typing import Any

try:
    import websockets
    from websockets.asyncio.client import connect
except ImportError:
    print(
        "Missing dependency: websockets\n"
        "Install with: pip install websockets",
        file=sys.stderr,
    )
    sys.exit(1)


def resolve_dsh_home() -> Path:
    override = os.environ.get("DSH_HOME", "").strip()
    if override:
        return Path(override).expanduser().resolve()
    return Path.home() / ".dsh"


def resolve_lock_dir() -> Path:
    override = os.environ.get("DSH_IDE_LOCK_DIR", "").strip()
    if override:
        return Path(override).expanduser().resolve()
    return resolve_dsh_home() / "ide"


def load_lock(path: Path) -> dict[str, Any]:
    with path.open(encoding="utf-8") as f:
        return json.load(f)


def pick_lock(lock_dir: Path, port: int | None) -> Path:
    if port is not None:
        candidate = lock_dir / f"{port}.lock"
        if not candidate.is_file():
            raise FileNotFoundError(f"No lock file: {candidate}")
        return candidate

    locks = sorted(glob.glob(str(lock_dir / "*.lock")), key=os.path.getmtime, reverse=True)
    if not locks:
        raise FileNotFoundError(f"No *.lock files in {lock_dir}")
    return Path(locks[0])


def print_message(raw: str) -> None:
    try:
        obj = json.loads(raw)
        print(json.dumps(obj, indent=2, ensure_ascii=False))
    except json.JSONDecodeError:
        print(raw)
    print("-" * 60)


async def run_client(host: str, port: int, token: str) -> None:
    url = f"ws://{host}:{port}"
    print(f"Connecting to {url} …")

    async with connect(url) as ws:
        await ws.send(json.dumps({"type": "auth", "token": token}))
        print("Sent auth. Waiting for messages (Ctrl+C to quit)…\n")

        async for message in ws:
            print_message(message)


def main() -> None:
    parser = argparse.ArgumentParser(description="DSH IDE Bridge WebSocket test client")
    parser.add_argument("--host", default=os.environ.get("DSH_IDE_WS_HOST", "127.0.0.1"))
    parser.add_argument("--port", type=int, help="WS port (default: newest lock file)")
    parser.add_argument("--token", help="Auth token (default: read from lock file)")
    parser.add_argument("--lock", type=Path, help="Explicit path to a .lock file")
    parser.add_argument("--lock-dir", type=Path, help="Directory to scan for *.lock")
    args = parser.parse_args()

    if args.lock:
        lock_path = args.lock.expanduser().resolve()
        lock = load_lock(lock_path)
        port = args.port or int(lock["port"])
        token = args.token or str(lock["authToken"])
    else:
        lock_dir = (args.lock_dir or resolve_lock_dir()).expanduser().resolve()
        lock_path = pick_lock(lock_dir, args.port)
        lock = load_lock(lock_path)
        port = args.port or int(lock["port"])
        token = args.token or str(lock["authToken"])

    print(f"Using lock: {lock_path}")
    print(f"  workspaceFolders: {lock.get('workspaceFolders', [])}")
    print(f"  sources: {lock.get('sources', [])}\n")

    try:
        asyncio.run(run_client(args.host, port, token))
    except KeyboardInterrupt:
        print("\nStopped.")


if __name__ == "__main__":
    main()
