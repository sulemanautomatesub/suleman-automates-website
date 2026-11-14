"""Local dev server for the Suleman Automates site.

Same behaviour as the production Vercel config:
- Clean URLs: /product and /pricing resolve to product.html / pricing.html
- No caching: always serves the current files (no stale pages while editing)

Usage (from this folder):
    python serve.py            # port 8742
    python serve.py 8000       # custom port
"""

import http.server
import os
import sys

ROOT = os.path.dirname(os.path.abspath(__file__))
DEFAULT_PORT = 8742


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def send_head(self):
        # Clean URLs: /product -> product.html (matches vercel.json cleanUrls)
        try:
            path = self.translate_path(self.path)
            if not os.path.exists(path) and not self.path.endswith('/'):
                if os.path.exists(path + '.html'):
                    self.path = self.path + '.html'
        except Exception:
            pass
        return super().send_head()

    def end_headers(self):
        # Never cache during local development
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()


if __name__ == '__main__':
    port = int(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_PORT
    server = http.server.ThreadingHTTPServer(('127.0.0.1', port), Handler)
    print('Serving at http://localhost:%d  (Ctrl+C to stop)' % port)
    server.serve_forever()
