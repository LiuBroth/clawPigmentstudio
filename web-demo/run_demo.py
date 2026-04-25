#!/usr/bin/env python3
"""Run the web demo from any current working directory.

Usage:
  python3 web-demo/run_demo.py
  python3 /path/to/repo/web-demo/run_demo.py --port 9000
"""

from __future__ import annotations

import argparse
import http.server
import socketserver
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[1]


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run the 3D sword-fighting web demo")
    parser.add_argument("--port", type=int, default=8000, help="Port to serve on (default: 8000)")
    return parser.parse_args()


def main() -> None:
    args = parse_args()

    handler = lambda *a, **kw: http.server.SimpleHTTPRequestHandler(  # noqa: E731
        *a,
        directory=str(REPO_ROOT),
        **kw,
    )

    with socketserver.TCPServer(("", args.port), handler) as httpd:
        print(f"Serving repo: {REPO_ROOT}")
        print(f"Open: http://localhost:{args.port}/web-demo/")
        httpd.serve_forever()


if __name__ == "__main__":
    main()
