# ==============================================================================
# VIDEALINK PRODUCTION DEPLOYMENT & HARDENING GUIDE (SENIOR IoT PLATFORM ENGINEER)
# ==============================================================================

Dokumen ini memandu langkah demi langkah membawa platform VideaLink dari tahap lokal (development) menuju **Production Server (VPS / Cloud Server Ubuntu/Debian/CentOS)** dengan standar industri IoT: kehandalan 99.9%, pengamanan kredensial, proteksi memori, dan auto-restart daemon.

---

## 1. Arsitektur Komponen Production

```
                                  INTERNET
                                      │
              ┌───────────────────────┴────────────────────────┐
              ▼                                                ▼
     [ NGINX Reverse Proxy ]                          [ MQTT Broker (Mosquitto/EMQX) ]
     • SSL/TLS via Let's Encrypt                      • Port 8883 (MQTTS / TLS)
     • Port 80/443                                    • Username/Password Auth + ACL
              │                                                │
      ┌───────┴───────┐                                        │
      ▼               ▼                                        ▼
[ Web Frontend ]  [ Laravel API ]                     [ PM2: mqtt-listener.cjs ]
(Vite / dist)     (PHP-FPM 8.2+)                      • Auto-restart jika crash
                          │                           • Dynamic topic subscription
                          ▼                                    │
                  [ MySQL / MariaDB ] ◄────────────────────────┘
```

---

## 2. Setup MQTT Listener Daemon (PM2 Process Manager)

Di server production, **JANGAN** menjalankan `node mqtt-listener.cjs` langsung di terminal biasa karena akan mati begitu sesi SSH ditutup. Gunakan **PM2**:

### Langkah Instalasi & Menjalankan:
```bash
# 1. Install PM2 secara global
npm install -g pm2

# 2. Buat folder log
mkdir -p logs

# 3. Jalankan listener menggunakan ecosystem config yang telah disediakan
pm2 start ecosystem.config.cjs --env production

# 4. Simpan state PM2 agar otomatis hidup saat server reboot
pm2 save
pm2 startup
```

### Perintah Pemeliharaan PM2:
* `pm2 status`: Memeriksa status hidup/matinya daemon listener.
* `pm2 logs videalink-mqtt-listener`: Memantau lalu lintas data telemetri realtime.
* `pm2 restart videalink-mqtt-listener`: Me-restart daemon.

---

## 3. Menghubungkan ke Private MQTT Broker (Self-Hosted Mosquitto / EMQX)

Saat di production, hindari menggunakan broker publik (`test.mosquitto.org`) demi kerahasiaan data sensor.

### A. Install Mosquitto di VPS Ubuntu:
```bash
sudo apt update && sudo apt install -y mosquitto mosquitto-clients
```

### B. Konfigurasi Autentikasi Kredensial Mosquitto (`/etc/mosquitto/mosquitto.conf`):
```ini
listener 1883
allow_anonymous false
password_file /etc/mosquitto/passwd
```

Buat username dan password:
```bash
sudo mosquitto_passwd -c /etc/mosquitto/passwd videalink_user
# Masukkan password yang kuat
sudo systemctl restart mosquitto
```

### C. Sesuaikan Environment di `ecosystem.config.cjs`:
```javascript
env_production: {
  NODE_ENV: 'production',
  MQTT_BROKER_URL: 'mqtt://videalink_user:PASSWORD_ANDA@IP_VPS_ANDA:1883',
  API_BASE_URL: 'https://iot.domainanda.com/api/v1',
}
```

---

## 4. Build Frontend Web untuk Production

Aplikasi React / Vite harus di-compile menjadi static production bundle untuk performa kilat:

```bash
# Di folder root project
npm run build
```
Hasil build akan berada di direktori `dist/` dan siap disajikan langsung oleh NGINX / Cloudflare Pages / CPanel.

---

## 5. Konfigurasi NGINX Web Server

Berikut template virtual host NGINX (`/etc/nginx/sites-available/videalink.conf`):

```nginx
server {
    listen 80;
    server_name iot.domainanda.com;
    root /var/www/videalink/dist;
    index index.html;

    # Frontend Single Page Application (SPA)
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Laravel API Backend Proxy
    location /api {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Optimasi Asset Statis
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, no-transform";
    }
}
```

Pasang sertifikat SSL gratis via Certbot:
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d iot.domainanda.com
```

---

## 6. Optimasi Laravel Backend di Production

Jalankan perintah optimasi cache Laravel di server:
```bash
cd backend
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan event:cache
```

Pastikan variabel `.env` backend memiliki nilai:
```ini
APP_ENV=production
APP_DEBUG=false
APP_URL=https://iot.domainanda.com
```

---

## 7. Rekomendasi Firmware Hardware di Lapangan (Field Deployment)

1. **Watchdog Timer (WDT)**:
   Aktifkan Software / Hardware Watchdog di ESP8266/ESP32 agar jika modul mengalami freeze atau memory leak, modul akan auto-restart sendiri tanpa perlu dicabut manual.
2. **Exponential Backoff Reconnect**:
   Jika Wi-Fi atau MQTT terputus, jangan melakukan reconnect setiap 100ms karena akan menghabiskan baterai dan membebani router. Beri interval bertahap (5s, 10s, 30s, 60s).
3. **QoS (Quality of Service)**:
   Gunakan **QoS 0** untuk telemetri sensor rutin (suhu/kelembapan tiap beberapa detik), dan **QoS 1** untuk alarm kritis (sensor api/gas bocor/tombol darurat).
