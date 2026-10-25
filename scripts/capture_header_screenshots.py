# scripts/capture_header_screenshots.py
import subprocess
import time
import os
import sys
from pathlib import Path
from http.server import SimpleHTTPRequestHandler
import socketserver
import threading

PORT = 5174
BROWSER = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
OUTPUT_DIR = Path("exports/screenshots")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

class QuietHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory="dist", **kwargs)
    def log_message(self, format, *args):
        pass

def run_server():
    socketserver.TCPServer.allow_reuse_address = True
    server = socketserver.TCPServer(("127.0.0.1", PORT), QuietHandler)
    server.serve_forever()

server_thread = threading.Thread(target=run_server, daemon=True)
server_thread.start()
time.sleep(1.0)
print(f"HTTP server running on http://127.0.0.1:{PORT}")

configs = [
    # 1920 Desktop
    ("header_1920_no_hint.png", 1920, 1080, f"http://127.0.0.1:{PORT}/?hints=off", 2500),
    ("header_1920_with_hint.png", 1920, 1080, f"http://127.0.0.1:{PORT}/?preset=HBB&editor=BE4max+(C%E2%86%92T)&pam=SpCas9", 4000),

    # 1024 Tablet
    ("header_1024_no_hint.png", 1024, 768, f"http://127.0.0.1:{PORT}/?hints=off", 2500),
    ("header_1024_with_hint.png", 1024, 768, f"http://127.0.0.1:{PORT}/?preset=HBB&editor=BE4max+(C%E2%86%92T)&pam=SpCas9", 4000),

    # 390 Mobile
    ("header_390_no_hint.png", 390, 844, f"http://127.0.0.1:{PORT}/?hints=off", 2500),
    ("header_390_with_hint.png", 390, 844, f"http://127.0.0.1:{PORT}/?preset=HBB&editor=BE4max+(C%E2%86%92T)&pam=SpCas9", 4000),

    # Bonus: LNP Tab Hint (#4)
    ("header_1920_lnp_hint.png", 1920, 1080, f"http://127.0.0.1:{PORT}/?tab=lnp&peg=3.5", 4000),
]

for filename, w, h, url, budget in configs:
    out_file = OUTPUT_DIR / filename
    cmd = [
        BROWSER,
        "--headless=new",
        "--disable-gpu",
        "--no-sandbox",
        "--hide-scrollbars",
        f"--window-size={w},{h}",
        f"--screenshot={out_file.resolve()}",
        f"--virtual-time-budget={budget}",
        url,
    ]
    print(f"Capturing {filename} ({w}x{h})...")
    res = subprocess.run(cmd, capture_output=True, text=True)
    if res.returncode != 0:
        print(f"Error capturing {filename}: {res.stderr}")
    else:
        if out_file.exists():
            print(f"  Saved {filename} ({out_file.stat().st_size // 1024} KB)")
        else:
            print(f"  Failed: file not created for {filename}")

print("All captures completed.")
sys.exit(0)
