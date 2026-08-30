#!/usr/bin/env python3
"""Static server with byte-range support for local audio and video seeking."""

from __future__ import annotations

import argparse
import re
import shutil
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path


RANGE_RE = re.compile(r"bytes=(\d*)-(\d*)$")


class RangeRequestHandler(SimpleHTTPRequestHandler):
    protocol_version = "HTTP/1.1"

    def end_headers(self) -> None:
        self.send_header("Accept-Ranges", "bytes")
        super().end_headers()

    def send_head(self):
        self._range = None
        path = Path(self.translate_path(self.path))
        range_header = self.headers.get("Range")

        if not range_header or not path.is_file():
            return super().send_head()

        match = RANGE_RE.fullmatch(range_header.strip())
        if not match:
            self.send_error(416, "Unsupported byte range")
            return None

        size = path.stat().st_size
        first, last = match.groups()

        if first:
            start = int(first)
            end = min(int(last), size - 1) if last else size - 1
        elif last:
            suffix_length = int(last)
            start = max(0, size - suffix_length)
            end = size - 1
        else:
            self.send_error(416, "Empty byte range")
            return None

        if start >= size or start > end:
            self.send_response(416)
            self.send_header("Content-Range", f"bytes */{size}")
            self.send_header("Content-Length", "0")
            self.end_headers()
            return None

        source = path.open("rb")
        self._range = (start, end)
        self.send_response(206)
        self.send_header("Content-Type", self.guess_type(str(path)))
        self.send_header("Content-Range", f"bytes {start}-{end}/{size}")
        self.send_header("Content-Length", str(end - start + 1))
        self.send_header("Last-Modified", self.date_time_string(path.stat().st_mtime))
        self.end_headers()
        source.seek(start)
        return source

    def copyfile(self, source, outputfile) -> None:
        if self._range is None:
            shutil.copyfileobj(source, outputfile)
            return

        start, end = self._range
        remaining = end - start + 1
        while remaining:
            chunk = source.read(min(64 * 1024, remaining))
            if not chunk:
                break
            outputfile.write(chunk)
            remaining -= len(chunk)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--port", type=int, default=8080)
    args = parser.parse_args()

    server = ThreadingHTTPServer(("", args.port), RangeRequestHandler)
    print(f"Serving on http://localhost:{args.port}", flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
