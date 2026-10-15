import http.server
import socketserver
import json
import os
import socket
import sys

if sys.stdout and hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass
if sys.stderr and hasattr(sys.stderr, 'reconfigure'):
    try:
        sys.stderr.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

PORT = 8080
DATA_FILE = "veriler.json"

DEFAULT_TEAM = []
DEFAULT_TASKS = []

def load_data():
    if os.path.exists(DATA_FILE):
        try:
            with open(DATA_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    return {
        "team": DEFAULT_TEAM,
        "tasks": DEFAULT_TASKS,
        "notes": ""
    }

def save_data(data):
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

class TaskServerHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def do_GET(self):
        # Redirect root to index.html
        if self.path == "/" or self.path == "":
            self.send_response(302)
            self.send_header("Location", "/index.html")
            self.end_headers()
            return

        if self.path.startswith("/api/data"):
            data = load_data()
            payload = json.dumps(data, ensure_ascii=False).encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(payload)))
            self.end_headers()
            self.wfile.write(payload)
            return

        super().do_GET()

    def do_POST(self):
        if self.path.startswith("/api/data"):
            content_length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(content_length)
            try:
                posted_data = json.loads(body.decode("utf-8"))
                current_data = load_data()
                payload_data = posted_data.get("data", posted_data) if isinstance(posted_data, dict) else {}
                if "tasks" in payload_data:
                    current_data["tasks"] = payload_data["tasks"]
                if "team" in payload_data:
                    current_data["team"] = payload_data["team"]
                if "notes" in payload_data:
                    current_data["notes"] = payload_data["notes"]
                save_data(current_data)

                response = json.dumps({"status": "ok", "message": "Kaydedildi"}).encode("utf-8")
                self.send_response(200)
                self.send_header("Content-Type", "application/json; charset=utf-8")
                self.send_header("Content-Length", str(len(response)))
                self.end_headers()
                self.wfile.write(response)
            except Exception as e:
                err_msg = json.dumps({"status": "error", "message": str(e)}).encode("utf-8")
                self.send_response(400)
                self.send_header("Content-Type", "application/json; charset=utf-8")
                self.send_header("Content-Length", str(len(err_msg)))
                self.end_headers()
                self.wfile.write(err_msg)
            return

        super().do_POST()

def get_local_ips():
    ips = []
    try:
        # Get all local host addresses
        host_name = socket.gethostname()
        for ip in socket.gethostbyname_ex(host_name)[2]:
            if not ip.startswith("127."):
                ips.append(ip)
    except Exception:
        pass
    return ips

if __name__ == "__main__":
    # Ensure data file exists
    if not os.path.exists(DATA_FILE):
        save_data(load_data())

    server_address = ("", PORT)
    socketserver.TCPServer.allow_reuse_address = True
    
    with socketserver.TCPServer(server_address, TaskServerHandler) as httpd:
        local_ips = get_local_ips()
        main_ip = local_ips[0] if local_ips else "BILGISAYAR_IP_ADRESI"

        print("=" * 70)
        print("  CAN CEREZ (1978 | Adiyla Tadiyla Can'dan) - SIRKET ICI YEREL SUNUCU")
        print("=" * 70)
        print()
        print("  [YONETICI PANELINIZ]:")
        print(f"     -> http://localhost:{PORT}/yonetici.html")
        print()
        print("  [PERSONEL EKRANI] (Diger Bilgisayarlar ve Telefonlar Icin):")
        for ip in local_ips:
            print(f"     -> http://{ip}:{PORT}/personel.html")
        print()
        print(f"  [YEREL VERITABANI]: {os.path.abspath(DATA_FILE)}")
        print("  [GUVENLIK]: Veriler %100 bu bilgisayarda saklanir, disa aktarilmaz.")
        print("=" * 70)
        print("  Sunucuyu durdurmak icin pencereyi kapatabilir veya Ctrl+C yapabilirsiniz.")
        print()

        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nSunucu kapatıldı.")
