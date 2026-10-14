# Can Kardeşler Kuruyemiş - Koordinasyon & Aksiyon Takip Portalı

Bu sistem, **Can Kardeşler Kuruyemiş** bünyesindeki Mağazalar, Fabrika, Satış-Pazarlama ve Tedarik birimlerinin haftalık koordinasyon toplantısı kararlarını ve aksiyonlarını anlık olarak takip etmek üzere geliştirilmiştir.

---

## 🌐 Canlı Web Bağlantıları (7/24 Bulut Senkronize)

Herhangi bir kurulum gerektirmeden doğrudan tarayıcı üzerinden kullanılabilir:

* 👑 **Yönetici Paneli:** [https://fearfestiwal.github.io/gorev-takip/yonetici.html](https://fearfestiwal.github.io/gorev-takip/yonetici.html)
  * Genel başarı ve tamamlanma yüzdesi (KPI)
  * Sorumlu bazında performans ve durum özeti
  * 2. Sayfa detaylı aksiyon listesi (Filtreleme, arama, öncelik takibi)
  * Tek tıkla kişiye özel veya toplu hatırlatma e-postası gönderme
  * JSON & Excel (CSV) olarak tek tıkla bilgisayara yedek alma

* 👥 **Personel Paneli:** [https://fearfestiwal.github.io/gorev-takip/personel.html](https://fearfestiwal.github.io/gorev-takip/personel.html)
  * Sade çalışan seçim ekranı
  * Çalışana özel atanmış görevlerin listesi
  * Tek tıkla "Tamamlandı" olarak işaretleme ve yöneticiye bildirim maili atma

---

## 🔒 Şirket İçi %100 Yerel Sunucu (Local Server)

Verilerin hiçbir şekilde internete veya dış bulut sunucularına çıkmasını istemediğiniz durumlarda:

1. `Sirket_Sunucusunu_Baslat.bat` dosyasına çift tıklayın.
2. Tüm veriler doğrudan bilgisayarınızdaki `veriler.json` dosyasına yazılır.
3. Aynı ofis Wi-Fi / yerel ağına bağlı tüm cihazlar (telefon, tablet, bilgisayar) ana bilgisayarın IP adresi üzerinden sisteme bağlanabilir:
   * **Yönetici:** `http://localhost:8080/yonetici.html`
   * **Personel:** `http://[ANA_BILGISAYAR_IP]:8080/personel.html`

---

## 💾 Yedekleme & Güvenlik

* **JSON Yedeği:** Yönetici panelindeki dişli (⚙️) simgesinden sistemin tam yedeğini tek tıkla bilgisayarınıza indirebilir ve gerektiğinde geri yükleyebilirsiniz.
* **Excel (.CSV) Desteği:** Toplantılarda sunum yapmak veya arşivlemek için görev listesini tek tıkla Excel uyumlu `.csv` olarak indirebilirsiniz.
* **Çevrimdışı Hafıza:** İnternet bağlantısı kesilse bile tarayıcı (`localStorage`) verileri korur.
