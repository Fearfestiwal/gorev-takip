import http.server
import socketserver
import json
import os
import socket

PORT = 8080
DATA_FILE = "veriler.json"

DEFAULT_TEAM = [
    { "name": "Hikmet CAN", "title": "Şirket Yöneticisi / Ortak", "phone": "0532 111 22 33", "department": "Yönetim & Mağazalar", "email": "hikmet@sirket.com" },
    { "name": "Veli CAN", "title": "Satış & Pazarlama Sorumlusu", "phone": "0533 222 33 44", "department": "Satış - Pazarlama", "email": "veli@sirket.com" },
    { "name": "Umut CAN", "title": "Operasyon & İl Müdürü", "phone": "0535 333 44 55", "department": "Operasyon & Yönetim", "email": "umut@sirket.com" },
    { "name": "Mustafa CAN", "title": "Fabrika & Üretim Müdürü", "phone": "0536 444 55 66", "department": "Fabrika", "email": "mustafa@sirket.com" },
    { "name": "Fahri CAN", "title": "Mağaza Koordinatörü", "phone": "0530 555 66 77", "department": "Mağazalar", "email": "fahri@sirket.com" },
    { "name": "Fırat", "title": "Tedarik & Envanter Sorumlusu", "phone": "0542 666 77 88", "department": "Tedarik & Ambalaj", "email": "firat@sirket.com" }
]

DEFAULT_TASKS = [
    { "id": 1, "title": "3. Mağaza açılması", "department": "Hikmet CAN", "action": "Fahri Can ile görüşme yapılacak", "owner": "Hikmet CAN", "dueDate": "2026-09-29", "status": "Açık", "priority": "Yüksek" },
    { "id": 2, "title": "Alışveriş sipariş listesi hazırlanacak", "department": "Satış-Pazarlama", "action": "7 gün içinde liste hazırlanacak", "owner": "Veli CAN", "dueDate": "2026-09-28", "status": "Açık", "priority": "Normal" },
    { "id": 3, "title": "Bellidede şirketi yönetici atanması", "department": "Umut CAN", "action": "Eylül ayında görüşmeler yapılacak", "owner": "Umut CAN", "dueDate": "2026-10-01", "status": "Açık", "priority": "Yüksek" },
    { "id": 4, "title": "İl Müdürü alımı", "department": "Umut CAN", "action": "İş görüşmesi yapılacak", "owner": "Umut CAN", "dueDate": "2026-10-01", "status": "Açık", "priority": "Kritik" },
    { "id": 5, "title": "Tedarik & Envanter Ambalaj listesi", "department": "Fırat - Umut - Mustafa", "action": "Reçeteler yapılacak, talep listesi çıkarılacak", "owner": "Umut CAN", "dueDate": "2026-09-29", "status": "Açık", "priority": "Normal" },
    { "id": 6, "title": "Reçetelerin oluşumu", "department": "Fabrika", "action": "Ürün başlıkları belirlenip içerik çıkarılacak", "owner": "Mustafa CAN", "dueDate": "2026-09-29", "status": "Açık", "priority": "Yüksek" },
    { "id": 7, "title": "Fabrika ruhsat işleri", "department": "Mustafa CAN", "action": "Resmi belgeler hazırlanacak", "owner": "Mustafa CAN", "dueDate": "2026-09-29", "status": "Tamamlandı", "priority": "Kritik" }
]

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
        "notes": "Ford Transit - 35 CUZ 038\nToplantı kararları haftalık takip edilecek."
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
        # Redirect root to yonetici.html
        if self.path == "/" or self.path == "":
            self.send_response(302)
            self.send_header("Location", "/yonetici.html")
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
                if "tasks" in posted_data:
                    current_data["tasks"] = posted_data["tasks"]
                if "team" in posted_data:
                    current_data["team"] = posted_data["team"]
                if "notes" in posted_data:
                    current_data["notes"] = posted_data["notes"]
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
        print("  KOORDİNASYON & AKSİYON TAKİP SİSTEMİ - ŞİRKET SUNUCUSU AKTİF")
        print("=" * 70)
        print()
        print("  👑 SİZİN EKRANINIZ (Yönetici Paneli):")
        print(f"     👉 http://localhost:{PORT}/yonetici.html")
        print()
        print("  👥 ÇALIŞANLARIN EKRANI (Diğer Bilgisayarlar ve Telefonlar İçin):")
        for ip in local_ips:
            print(f"     👉 http://{ip}:{PORT}/personel.html")
        print()
        print(f"  💾 Ortak Veritabanı: {os.path.abspath(DATA_FILE)}")
        print("  🔄 Tüm bilgisayarlar tek bir ortak veritabanına bağlıdır.")
        print("=" * 70)
        print("  Sunucuyu durdurmak için bu pencereyi kapatabilirsiniz.")
        print()

        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nSunucu kapatıldı.")
