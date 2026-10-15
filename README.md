# CAN ÇEREZ (1978 | Adıyla Tadıyla Can'dan) - Görev & Aksiyon Takip Portalı

Bu sistem, **CAN ÇEREZ** bünyesindeki Mağazalar, Fabrika, Satış-Pazarlama ve Tedarik birimlerinin haftalık koordinasyon kararlarını, termin tarihlerini ve aksiyonlarını anlık olarak takip etmek üzere geliştirilmiştir.

---

## 🌐 Canlı Web & PWA Uygulaması (7/24 Bulut Senkronize)

Herhangi bir kurulum veya mağaza (Play Store / App Store) onayı gerektirmeden doğrudan web üzerinden çalışır ve **PWA (Progressive Web App)** olarak masaüstünüze veya telefonunuza uygulama olarak yüklenebilir:

* 👑 **Yönetici Paneli:** [https://fearfestiwal.github.io/gorev-takip/yonetici.html](https://fearfestiwal.github.io/gorev-takip/yonetici.html)
  * Genel başarı ve tamamlanma yüzdesi (KPI paneli)
  * Sorumlu bazında performans ve durum özeti
  * 2. Sayfa detaylı aksiyon listesi (Filtreleme, arama, öncelik takibi, Kanban panosu)
  * Tek tıkla kişiye özel veya toplu WhatsApp ve Gmail hatırlatmaları
  * JSON & Excel (CSV) olarak tek tıkla bilgisayara yedek alma

* 👥 **Personel Paneli:** [https://fearfestiwal.github.io/gorev-takip/personel.html](https://fearfestiwal.github.io/gorev-takip/personel.html)
  * Sade çalışan profil seçim ekranı
  * Çalışana özel atanmış görevlerin listesi ve termin durumu
  * Tek tıkla "Tamamlandı" olarak işaretleme ve yöneticiye WhatsApp / Gmail durum bildirimi gönderme

---

## 📱 PWA Uygulama Olarak Yükleme (App Store / Play Store Gerekmez)

* **Windows & Mac (Chrome / Edge):** Sitede üst bardaki **"Uygulamayı Yükle"** butonuna veya adres çubuğundaki yükle ikonuna tıklayın. Masaüstünüze / Dock'a bağımsız uygulama penceresi olarak gelir.
* **iPhone & iPad (Safari):** Safari'de sayfayı açıp alt ortadaki **"Paylaş"** (kare ve yukarı ok) butonuna basın -> **"Ana Ekrana Ekle"** seçeneğini seçin.
* **Android (Chrome):** Menüden (üç nokta) **"Ana Ekrana Ekle"** veya **"Uygulamayı Yükle"** butonuna dokunun.

---

## 🔒 Şirket İçi %100 Yerel Sunucu (Local Server)

Verilerin hiçbir şekilde dış buluta çıkmasını istemediğiniz durumlarda:

1. `Sirket_Sunucusunu_Baslat.bat` dosyasına çift tıklayın.
2. Tüm veriler doğrudan bilgisayarınızdaki `veriler.json` dosyasına yazılır.
3. Aynı ofis Wi-Fi / yerel ağına bağlı tüm cihazlar (telefon, tablet, bilgisayar) ana bilgisayarın IP adresi üzerinden sisteme bağlanabilir:
   * **Yönetici:** `http://localhost:8080/yonetici.html`
   * **Personel:** `http://[ANA_BILGISAYAR_IP]:8080/personel.html`

---

## 💾 Yedekleme & Güvenlik

* **JSON Yedeği:** Yönetici panelindeki ayarlar (⚙️) simgesinden sistemin tam yedeğini tek tıkla bilgisayarınıza indirebilir ve gerektiğinde geri yükleyebilirsiniz.
* **Excel (.CSV) Desteği:** Toplantılarda sunum yapmak veya arşivlemek için görev listesini tek tıkla Excel uyumlu `.csv` olarak indirebilirsiniz.
* **Çevrimdışı Hafıza:** Service Worker (`sw.js`) ve tarayıcı hafızası (`localStorage`) sayesinde internet kesilse dahi uygulama çalışmaya devam eder.
