import React, { useState, useMemo } from 'react';
import {
  BookOpen, Terminal, Cpu, Wifi, Database, Check, Copy,
  ArrowRight, ShieldCheck, Zap, Layers, RefreshCw, AlertCircle,
  ExternalLink, Code2, Server, HelpCircle, ChevronRight,
  LayoutDashboard, Webhook, Home, Sliders, Palette, Users,
  Key, Clock, Sparkles, Compass, Shield, Search, FileText,
  SlidersHorizontal, Radio, Activity, Download, ListTree,
  ChevronDown, ArrowUpRight, ChevronLeft, Globe
} from 'lucide-react';

export default function Guide() {
  const [currentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('iot_user');
      return saved ? JSON.parse(saved) : { role: 'admin' };
    } catch {
      return { role: 'admin' };
    }
  });

  const [activeCategory, setActiveCategory] = useState('getting-started');
  const [activeArticle, setActiveArticle] = useState('install');
  const [copiedKey, setCopiedKey] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all'); // 'all' | 'user' | 'admin'

  const copyToClipboard = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // 1. DAFTAR LENGKAP SEMUA MODUL DOKUMENTASI DENGAN BATASAN ROLE (USER VS ADMIN)
  const docSections = useMemo(() => [
    {
      id: 'getting-started',
      title: 'Getting started',
      icon: Compass,
      items: [
        { id: 'install', label: 'Pengenalan & Instalasi', tag: '', role: 'user' },
        { id: 'quickstart', label: 'Alur Kerja Cepat (Quickstart)', tag: '', role: 'user' },
        { id: 'architecture', label: 'Arsitektur Platform', tag: 'Core', role: 'user' },
        { id: 'listener', label: 'MQTT Listener Daemon', tag: 'Daemon', role: 'admin' },
      ],
    },
    {
      id: 'devices',
      title: 'Devices & Hardware',
      icon: Cpu,
      items: [
        { id: 'device-register', label: 'Registrasi Perangkat', tag: '', role: 'user' },
        { id: 'device-auth', label: 'Token & Keamanan Device', tag: 'Security', role: 'user' },
        { id: 'heartbeat', label: 'Heartbeat & Online Detection', tag: '60s', role: 'user' },
        { id: 'device-room', label: 'Sinkronisasi Ruangan (Room)', tag: 'Sync', role: 'user' },
      ],
    },
    {
      id: 'buckets',
      title: 'Data Buckets',
      icon: Database,
      items: [
        { id: 'bucket-concept', label: 'Konsep Time-Series Bucket', tag: '', role: 'user' },
        { id: 'auto-discovery', label: 'Auto-Discovery Sensor Fields', tag: 'Smart', role: 'user' },
        { id: 'charts-widgets', label: 'Widget & Grafik Real-time', tag: '', role: 'user' },
        { id: 'data-export', label: 'Ekspor Data & Storage', tag: '', role: 'user' },
      ],
    },
    {
      id: 'smart-home',
      title: 'Smart Home & Rules',
      icon: Home,
      items: [
        { id: 'rooms-management', label: 'Manajemen Ruangan (Rooms)', tag: '', role: 'user' },
        { id: 'floor-plan', label: 'Visual Denah (Floor Plan)', tag: 'Visual', role: 'user' },
        { id: 'automations', label: 'Automations (Rule Engine)', tag: 'Trigger', role: 'user' },
      ],
    },
    {
      id: 'endpoints',
      title: 'Endpoints & Webhooks',
      icon: Webhook,
      items: [
        { id: 'webhook-setup', label: 'Integrasi HTTP Webhook', tag: 'POST', role: 'user' },
        { id: 'telegram-email', label: 'Telegram & Email Alerts', tag: 'Alert', role: 'user' },
      ],
    },
    {
      id: 'firmware',
      title: 'Firmware & Code',
      icon: Code2,
      items: [
        { id: 'esp8266-mqtt', label: 'ESP8266 via MQTT', tag: 'MQTT', role: 'user' },
        { id: 'esp8266-http', label: 'ESP8266 via HTTP REST', tag: 'HTTP', role: 'user' },
        { id: 'esp32-mqtt',   label: 'ESP32 via MQTT', tag: 'MQTT', role: 'user' },
        { id: 'esp32-http',   label: 'ESP32 via HTTP REST', tag: 'HTTP', role: 'user' },
        { id: 'arduino-libraries', label: 'Library Arduino IDE', tag: 'Setup', role: 'user' },
      ],
    },
    {
      id: 'settings',
      title: 'Settings & System',
      icon: Sliders,
      items: [
        { id: 'theme-colors', label: 'Tema Warna & Mode UI', tag: 'Theme', role: 'user' },
        { id: 'timezone-config', label: 'Zona Waktu (Timezone)', tag: 'WIB', role: 'user' },
        { id: 'user-access', label: 'User Roles & Profil', tag: 'RBAC', role: 'admin' },
      ],
    },
    {
      id: 'production',
      title: 'Production & Deploy',
      icon: Server,
      adminOnly: true,
      items: [
        { id: 'prod-pm2', label: 'PM2 Daemon Manager', tag: '24/7', role: 'admin' },
        { id: 'prod-nginx', label: 'NGINX & SSL Reverse Proxy', tag: 'SSL', role: 'admin' },
        { id: 'prod-broker', label: 'Private Mosquitto / EMQX', tag: 'Secure', role: 'admin' },
        { id: 'prod-hardening', label: 'IoT Hardware Hardening', tag: 'WDT', role: 'admin' },
      ],
    },
  ], []);

  // Urutan linier seluruh bab/artikel (Flatten) untuk Previous & Next otomatis
  const flatArticles = useMemo(() => {
    const list = [];
    const isAdmin = currentUser?.role === 'admin';

    docSections.forEach((section) => {
      // Jika section khusus admin dan user biasa yang login, sembunyikan total
      if (section.adminOnly && !isAdmin) return;

      section.items.forEach((item) => {
        // Jika user biasa login: HANYA tampilkan panduan ber-role 'user'
        if (!isAdmin && item.role !== 'user') return;

        // Jika admin login: filter berdasarkan pilihan switcher ('all', 'user', 'admin')
        if (isAdmin && roleFilter !== 'all' && item.role !== roleFilter) return;

        list.push({
          sectionId: section.id,
          sectionTitle: section.title,
          articleId: item.id,
          label: item.label,
          role: item.role,
        });
      });
    });
    return list;
  }, [docSections, roleFilter, currentUser]);

  const currentIndex = flatArticles.findIndex((a) => a.articleId === activeArticle);
  const prevArticle = currentIndex > 0 ? flatArticles[currentIndex - 1] : null;
  const nextArticle = currentIndex < flatArticles.length - 1 ? flatArticles[currentIndex + 1] : null;

  const selectArticle = (sectionId, articleId) => {
    setActiveCategory(sectionId);
    setActiveArticle(articleId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // =========================================================================
  // 1. KODE ESP8266 MQTT
  // =========================================================================
  const codeESP8266MQTT = `#include <ESP8266WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>

// ========================================================
// 1. KONFIGURASI WI-FI & MQTT BROKER
// ========================================================
const char* WIFI_SSID     = "NAMA_WIFI_ANDA";
const char* WIFI_PASSWORD = "PASSWORD_WIFI_ANDA";

// Broker MQTT (Default VideaLink: test.mosquitto.org)
const char* MQTT_BROKER   = "test.mosquitto.org";
const int   MQTT_PORT     = 1883;

// Topik Bucket Anda di VideaLink
// Sesuaikan dengan MQTT Topic di menu Data Buckets
const char* MQTT_TOPIC    = "videalink/devices/esp8266-01";

// Interval pengiriman data (ms)
const unsigned long SEND_INTERVAL = 5000; // Tiap 5 detik

// ========================================================
// 2. OBJEK KONEKSI & VARIABEL
// ========================================================
WiFiClient espClient;
PubSubClient mqttClient(espClient);
unsigned long lastMsgTime = 0;

void setupWiFi() {
  delay(10);
  Serial.println();
  Serial.print("[WiFi] Menghubungkan ke: ");
  Serial.println(WIFI_SSID);

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("\\n[WiFi] Terhubung!");
  Serial.print("[WiFi] IP Address: ");
  Serial.println(WiFi.localIP());
}

void reconnectMQTT() {
  while (!mqttClient.connected()) {
    // Generate Client ID Unik berbasis MAC Address (Standar Industri)
    String clientId = "VideaLink-ESP8266-" + WiFi.macAddress();
    clientId.replace(":", "");

    Serial.print("[MQTT] Menghubungkan sebagai ");
    Serial.print(clientId);
    Serial.print("...");

    if (mqttClient.connect(clientId.c_str())) {
      Serial.println(" BERHASIL!");
    } else {
      Serial.print(" GAGAL (rc=");
      Serial.print(mqttClient.state());
      Serial.println("). Coba lagi dalam 5 detik...");
      delay(5000);
    }
  }
}

void setup() {
  Serial.begin(115200);
  setupWiFi();

  mqttClient.setServer(MQTT_BROKER, MQTT_PORT);
  mqttClient.setBufferSize(512); // Buffer untuk JSON
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) {
    setupWiFi();
  }
  if (!mqttClient.connected()) {
    reconnectMQTT();
  }
  mqttClient.loop();

  unsigned long now = millis();
  if (now - lastMsgTime > SEND_INTERVAL) {
    lastMsgTime = now;

    // Baca sensor fisik atau simulasi nilai
    float temperature = 24.0 + (random(0, 120) / 10.0); // 24.0 - 36.0 C
    float humidity    = 50.0 + (random(0, 300) / 10.0); // 50.0 - 80.0 %
    int   signalRssi  = WiFi.RSSI();

    // Format JSON Telemetri
    StaticJsonDocument<256> doc;
    doc["temperature"] = serialized(String(temperature, 2));
    doc["humidity"]    = serialized(String(humidity, 2));
    doc["rssi"]        = signalRssi;

    char jsonBuffer[256];
    serializeJson(doc, jsonBuffer);

    Serial.print("[MQTT] Kirim ke ");
    Serial.print(MQTT_TOPIC);
    Serial.print(" -> ");
    Serial.println(jsonBuffer);

    mqttClient.publish(MQTT_TOPIC, jsonBuffer);
  }
}`;

  // =========================================================================
  // 2. KODE ESP8266 HTTP REST
  // =========================================================================
  const codeESP8266HTTP = `#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <WiFiClient.h>
#include <ArduinoJson.h>

// ========================================================
// 1. KONFIGURASI WI-FI & VIDEALINK HTTP REST API
// ========================================================
const char* WIFI_SSID     = "NAMA_WIFI_ANDA";
const char* WIFI_PASSWORD = "PASSWORD_WIFI_ANDA";

// Endpoint Telemetri Device Anda
// Ganti IP_HOST dengan IP komputer/server Anda (misal 192.168.1.100 atau domain)
// Ganti {1} dengan ID numerik device Anda di VideaLink
const char* API_URL       = "http://192.168.1.100/videalink/backend/public/api/v1/devices/1/telemetry";

// Token Autentikasi Device (didapat dari form Device di dashboard)
const char* DEVICE_TOKEN  = "YOUR_DEVICE_32_CHAR_CREDENTIALS";

const unsigned long SEND_INTERVAL = 5000; // Tiap 5 detik
unsigned long lastMsgTime = 0;

void setupWiFi() {
  delay(10);
  Serial.println();
  Serial.print("[WiFi] Menghubungkan ke: ");
  Serial.println(WIFI_SSID);

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("\\n[WiFi] Terhubung!");
  Serial.print("[WiFi] IP Address: ");
  Serial.println(WiFi.localIP());
}

void setup() {
  Serial.begin(115200);
  setupWiFi();
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) {
    setupWiFi();
  }

  unsigned long now = millis();
  if (now - lastMsgTime > SEND_INTERVAL) {
    lastMsgTime = now;

    WiFiClient client;
    HTTPClient http;

    http.begin(client, API_URL);
    http.addHeader("Content-Type", "application/json");
    http.addHeader("Authorization", String("Bearer ") + DEVICE_TOKEN);

    // Siapkan Data Telemetri
    StaticJsonDocument<256> doc;
    doc["temperature"] = 28.5 + (random(0, 50) / 10.0);
    doc["humidity"]    = 60.0 + (random(0, 100) / 10.0);
    doc["rssi"]        = WiFi.RSSI();

    char jsonBuffer[256];
    serializeJson(doc, jsonBuffer);

    Serial.print("[HTTP POST] Mengirim: ");
    Serial.println(jsonBuffer);

    int httpCode = http.POST(jsonBuffer);
    Serial.printf("[HTTP POST] Response Code: %d\\n", httpCode);

    if (httpCode > 0) {
      String response = http.getString();
      Serial.println("[HTTP Server Response] " + response);
    } else {
      Serial.printf("[HTTP ERROR] %s\\n", http.errorToString(httpCode).c_str());
    }

    http.end();
  }
}`;

  // =========================================================================
  // 3. KODE ESP32 MQTT
  // =========================================================================
  const codeESP32MQTT = `#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>

// ========================================================
// 1. KONFIGURASI WI-FI & MQTT BROKER
// ========================================================
const char* WIFI_SSID     = "NAMA_WIFI_ANDA";
const char* WIFI_PASSWORD = "PASSWORD_WIFI_ANDA";

// Broker MQTT (Default VideaLink: test.mosquitto.org)
const char* MQTT_BROKER   = "test.mosquitto.org";
const int   MQTT_PORT     = 1883;

// Topik Bucket Anda di VideaLink
// Sesuaikan dengan MQTT Topic di menu Data Buckets
const char* MQTT_TOPIC    = "videalink/devices/esp32-01";

// Interval pengiriman data (ms)
const unsigned long SEND_INTERVAL = 5000; // Tiap 5 detik

// ========================================================
// 2. OBJEK KONEKSI & VARIABEL
// ========================================================
WiFiClient espClient;
PubSubClient mqttClient(espClient);
unsigned long lastMsgTime = 0;

void setupWiFi() {
  delay(10);
  Serial.println();
  Serial.print("[WiFi] Menghubungkan ke: ");
  Serial.println(WIFI_SSID);

  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("\\n[WiFi] Terhubung!");
  Serial.print("[WiFi] IP Address: ");
  Serial.println(WiFi.localIP());
}

void reconnectMQTT() {
  while (!mqttClient.connected()) {
    // Generate Client ID Unik berbasis MAC Address ESP32 (Standar Industri)
    String clientId = "VideaLink-ESP32-" + WiFi.macAddress();
    clientId.replace(":", "");

    Serial.print("[MQTT] Menghubungkan sebagai ");
    Serial.print(clientId);
    Serial.print("...");

    if (mqttClient.connect(clientId.c_str())) {
      Serial.println(" BERHASIL!");
    } else {
      Serial.print(" GAGAL (rc=");
      Serial.print(mqttClient.state());
      Serial.println("). Coba lagi dalam 5 detik...");
      delay(5000);
    }
  }
}

void setup() {
  Serial.begin(115200);
  setupWiFi();

  mqttClient.setServer(MQTT_BROKER, MQTT_PORT);
  mqttClient.setBufferSize(512); // Buffer untuk JSON
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) {
    setupWiFi();
  }
  if (!mqttClient.connected()) {
    reconnectMQTT();
  }
  mqttClient.loop();

  unsigned long now = millis();
  if (now - lastMsgTime > SEND_INTERVAL) {
    lastMsgTime = now;

    // Baca sensor fisik atau simulasi nilai
    float temperature = 26.5 + (random(0, 100) / 10.0); // 26.5 - 36.5 C
    float humidity    = 55.0 + (random(0, 250) / 10.0); // 55.0 - 80.0 %
    int   signalRssi  = WiFi.RSSI();

    // Format JSON Telemetri
    StaticJsonDocument<256> doc;
    doc["temperature"] = serialized(String(temperature, 2));
    doc["humidity"]    = serialized(String(humidity, 2));
    doc["rssi"]        = signalRssi;

    char jsonBuffer[256];
    serializeJson(doc, jsonBuffer);

    Serial.print("[MQTT] Kirim ke ");
    Serial.print(MQTT_TOPIC);
    Serial.print(" -> ");
    Serial.println(jsonBuffer);

    mqttClient.publish(MQTT_TOPIC, jsonBuffer);
  }
}`;

  // =========================================================================
  // 4. KODE ESP32 HTTP REST
  // =========================================================================
  const codeESP32HTTP = `#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// ========================================================
// 1. KONFIGURASI WI-FI & VIDEALINK HTTP REST API
// ========================================================
const char* WIFI_SSID     = "NAMA_WIFI_ANDA";
const char* WIFI_PASSWORD = "PASSWORD_WIFI_ANDA";

// Endpoint Telemetri Device Anda
// Ganti IP_HOST dengan IP komputer/server Anda (misal 192.168.1.100 atau domain)
// Ganti {1} dengan ID numerik device Anda di VideaLink
const char* API_URL       = "http://192.168.1.100/videalink/backend/public/api/v1/devices/1/telemetry";

// Token Autentikasi Device (didapat dari form Device di dashboard)
const char* DEVICE_TOKEN  = "YOUR_DEVICE_32_CHAR_CREDENTIALS";

const unsigned long SEND_INTERVAL = 5000;
unsigned long lastMsgTime = 0;

void setupWiFi() {
  Serial.begin(115200);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("[WiFi] Menghubungkan...");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\\n[WiFi] Terhubung!");
  Serial.print("[WiFi] IP Address: ");
  Serial.println(WiFi.localIP());
}

void setup() {
  setupWiFi();
}

void loop() {
  if (WiFi.status() == WL_CONNECTED && (millis() - lastMsgTime > SEND_INTERVAL)) {
    lastMsgTime = millis();

    HTTPClient http;
    http.begin(API_URL);
    http.addHeader("Content-Type", "application/json");
    http.addHeader("Authorization", String("Bearer ") + DEVICE_TOKEN);

    StaticJsonDocument<256> doc;
    doc["temperature"] = 28.5 + (random(0, 50) / 10.0);
    doc["humidity"]    = 65.2 + (random(0, 100) / 10.0);
    doc["rssi"]        = WiFi.RSSI();

    char jsonBuffer[256];
    serializeJson(doc, jsonBuffer);

    Serial.print("[HTTP POST] Mengirim: ");
    Serial.println(jsonBuffer);

    int httpCode = http.POST(jsonBuffer);
    Serial.printf("[HTTP] POST Response Code: %d\\n", httpCode);

    if (httpCode > 0) {
      String response = http.getString();
      Serial.println("[HTTP Response Body] " + response);
    } else {
      Serial.printf("[HTTP ERROR] %s\\n", http.errorToString(httpCode).c_str());
    }
    http.end();
  }
}`;

  // Daftar On This Page (TOC kanan) tergantung artikel aktif
  const tableOfContents = useMemo(() => {
    switch (activeArticle) {
      case 'install':
        return [
          { id: 'toc-intro', label: 'Apa itu VideaLink?' },
          { id: 'toc-prereq', label: 'Persyaratan Sistem' },
          { id: 'toc-quick-setup', label: 'Langkah Instalasi Cepat' },
        ];
      case 'quickstart':
        return [
          { id: 'toc-step-1', label: '1. Buat Device Baru' },
          { id: 'toc-step-2', label: '2. Setup Data Bucket' },
          { id: 'toc-step-3', label: '3. Start MQTT Listener' },
          { id: 'toc-step-4', label: '4. Upload Kode Firmware' },
        ];
      case 'architecture':
        return [
          { id: 'toc-arch-flow', label: 'Alur Data IoT Pipeline' },
          { id: 'toc-arch-broker', label: 'MQTT Broker & Webhook' },
          { id: 'toc-arch-ui', label: 'Web UI & State Sync' },
        ];
      case 'listener':
        return [
          { id: 'toc-daemon-what', label: 'Peran mqtt-listener.cjs' },
          { id: 'toc-daemon-run', label: 'Cara Menjalankan' },
          { id: 'toc-daemon-pm2', label: 'Mode Daemon Produksi' },
        ];
      case 'device-register':
        return [
          { id: 'toc-dev-add', label: 'Menambah Device' },
          { id: 'toc-dev-hardware', label: 'Pilihan Hardware' },
          { id: 'toc-dev-protocol', label: 'Protokol MQTT vs HTTP' },
        ];
      case 'device-auth':
        return [
          { id: 'toc-auth-token', label: 'Token 32-Karakter' },
          { id: 'toc-auth-header', label: 'Header Authorization' },
        ];
      case 'heartbeat':
        return [
          { id: 'toc-hb-logic', label: 'Mekanisme Heartbeat' },
          { id: 'toc-hb-timeout', label: 'Timeout 60 Detik' },
        ];
      case 'device-room':
        return [
          { id: 'toc-room-sync', label: 'Penyatuan Room & Lokasi' },
          { id: 'toc-room-auto', label: 'Sinkronisasi Otomatis' },
        ];
      case 'bucket-concept':
        return [
          { id: 'toc-bkt-intro', label: 'Prinsip Time-Series' },
          { id: 'toc-bkt-create', label: 'Membuat Bucket Baru' },
          { id: 'toc-bkt-topic', label: 'Format Topik MQTT' },
        ];
      case 'auto-discovery':
        return [
          { id: 'toc-ad-json', label: 'Payload Format JSON' },
          { id: 'toc-ad-extract', label: 'Ekstraksi Field Otomatis' },
        ];
      case 'charts-widgets':
        return [
          { id: 'toc-cw-line', label: 'Line Chart Realtime' },
          { id: 'toc-cw-gauge', label: 'Gauge & Metric Cards' },
        ];
      case 'data-export':
        return [
          { id: 'toc-exp-csv', label: 'Download Log CSV' },
          { id: 'toc-exp-retention', label: 'Retensi Data' },
        ];
      case 'rooms-management':
        return [
          { id: 'toc-rm-create', label: 'Membuat Ruangan' },
          { id: 'toc-rm-assign', label: 'Menetapkan Device' },
        ];
      case 'floor-plan':
        return [
          { id: 'toc-fp-view', label: 'Denah Interaktif' },
          { id: 'toc-fp-pin', label: 'Pinning Device' },
        ];
      case 'automations':
        return [
          { id: 'toc-auto-concept', label: 'Trigger & Action' },
          { id: 'toc-auto-examples', label: 'Contoh Skenario' },
        ];
      case 'webhook-setup':
        return [
          { id: 'toc-wh-http', label: 'HTTP POST Integration' },
          { id: 'toc-wh-payload', label: 'Format Payload Webhook' },
        ];
      case 'telegram-email':
        return [
          { id: 'toc-tg-bot', label: 'Konfigurasi Bot Telegram' },
          { id: 'toc-mail-alert', label: 'Notifikasi Email' },
        ];
      case 'esp8266-mqtt':
        return [
          { id: 'toc-firm-code', label: 'Kode Lengkap ESP8266 MQTT' },
          { id: 'toc-firm-mac', label: 'Client ID dari MAC Address' },
          { id: 'toc-firm-lib', label: 'Library PubSubClient' },
        ];
      case 'esp8266-http':
        return [
          { id: 'toc-firm-http-8266', label: 'Kode ESP8266 HTTP REST' },
          { id: 'toc-firm-http-header', label: 'Header Bearer Token' },
        ];
      case 'esp32-mqtt':
        return [
          { id: 'toc-firm-code-esp32', label: 'Kode Lengkap ESP32 MQTT' },
          { id: 'toc-firm-mac-esp32', label: 'MAC Address Unik ESP32' },
        ];
      case 'esp32-http':
        return [
          { id: 'toc-http-code', label: 'Kode Lengkap ESP32 REST' },
          { id: 'toc-http-bearer', label: 'Bearer Token Auth' },
        ];
      case 'arduino-libraries':
        return [
          { id: 'toc-lib-list', label: 'Daftar Library Wajib' },
          { id: 'toc-lib-install', label: 'Cara Install di IDE' },
        ];
      case 'theme-colors':
        return [
          { id: 'toc-th-palette', label: '5 Palet Warna Premium' },
          { id: 'toc-th-sync', label: 'Sinkronisasi ke Login Warp' },
        ];
      case 'timezone-config':
        return [
          { id: 'toc-tz-wib', label: 'Zona Waktu Indonesia' },
          { id: 'toc-tz-calc', label: 'Presisi Timestamp Grafik' },
        ];
      case 'user-access':
        return [
          { id: 'toc-usr-roles', label: 'Hak Akses Role' },
          { id: 'toc-usr-profile', label: 'Keamanan & Password' },
        ];
      case 'prod-pm2':
        return [
          { id: 'toc-pm2-intro', label: 'Mengapa PM2?' },
          { id: 'toc-pm2-cmd', label: 'Instalasi & Menjalankan' },
          { id: 'toc-pm2-auto', label: 'Auto-Start Server Boot' },
        ];
      case 'prod-nginx':
        return [
          { id: 'toc-nginx-conf', label: 'Konfigurasi VirtualHost' },
          { id: 'toc-nginx-ssl', label: 'SSL Gratis Certbot' },
        ];
      case 'prod-broker':
        return [
          { id: 'toc-brk-install', label: 'Self-Hosted Mosquitto' },
          { id: 'toc-brk-auth', label: 'Autentikasi User & Password' },
        ];
      case 'prod-hardening':
        return [
          { id: 'toc-hrd-wdt', label: 'Watchdog Timer (WDT)' },
          { id: 'toc-hrd-backoff', label: 'Exponential Backoff' },
          { id: 'toc-hrd-qos', label: 'Pemilihan QoS 0 vs 1' },
        ];
      default:
        return [
          { id: 'toc-overview', label: 'Overview' },
          { id: 'toc-usage', label: 'Penggunaan' },
        ];
    }
  }, [activeArticle]);

  return (
    <div className="min-h-screen text-slate-100 font-sans pb-16">
      
      {/* ── TOP DOCS SUB-NAVBAR (Vision UI Style) ── */}
      <div className="vision-card p-4 mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="vision-icon-box w-10 h-10 rounded-xl font-black text-white text-lg flex-shrink-0">
            V
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-slate-100 text-sm tracking-tight">VideaLink Docs</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-primary-500/15 text-primary-400 border border-primary-500/25 font-bold">
                v2.4 LTS
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Pusat Panduan & Dokumentasi Resmi Platform IoT</p>
          </div>
        </div>

        {/* Search Input Filter */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 text-slate-500" size={14} />
          <input
            type="text"
            placeholder="Cari dokumentasi (mis: esp32, esp8266, mqtt, http)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full vision-inner-box rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-primary-500/50 transition-colors"
          />
        </div>
      </div>

      {/* ── MAIN 3-COLUMN LAYOUT ALA BOOTSTRAP DOCS ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* ── LEFT SIDEBAR: DOCS NAVIGATION ── */}
        <aside className="lg:col-span-3 vision-card p-4 lg:sticky lg:top-4 max-h-[calc(100vh-2rem)] overflow-y-auto custom-scrollbar">
          
          {/* Header Role Info & Switcher (Hanya admin yang memiliki filter switcher) */}
          <div className="mb-4 space-y-2">
            <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-bold px-1 flex items-center justify-between">
              <span>{currentUser?.role === 'admin' ? 'Filter Tampilan' : 'Panduan Pengguna'}</span>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full uppercase font-bold ${
                currentUser?.role === 'admin' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
              }`}>
                Role: {currentUser?.role || 'user'}
              </span>
            </div>

            {currentUser?.role === 'admin' ? (
              <div className="grid grid-cols-3 gap-1 p-1 bg-slate-950/70 rounded-xl border border-slate-800 text-[11px] font-bold">
                <button
                  onClick={() => setRoleFilter('all')}
                  className={`py-1.5 rounded-lg transition-all ${
                    roleFilter === 'all'
                      ? 'bg-primary-500 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Semua (Full)
                </button>
                <button
                  onClick={() => setRoleFilter('user')}
                  className={`py-1.5 rounded-lg transition-all ${
                    roleFilter === 'user'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  User Saja
                </button>
                <button
                  onClick={() => setRoleFilter('admin')}
                  className={`py-1.5 rounded-lg transition-all ${
                    roleFilter === 'admin'
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Admin Saja
                </button>
              </div>
            ) : (
              <div className="p-2 rounded-xl bg-blue-950/20 border border-blue-900/30 text-[11px] text-blue-300">
                📘 Menampilkan panduan operasional perangkat & visualisasi untuk akun <b>User</b>.
              </div>
            )}
          </div>

          <div className="space-y-4 pt-2 border-t border-slate-800/70">
            {docSections.map((section) => {
              const SectionIcon = section.icon;
              const isAdmin = currentUser?.role === 'admin';

              // Jika section adminOnly dan user biasa yang login, sembunyikan total
              if (section.adminOnly && !isAdmin) return null;

              // Filter pencarian dan role
              const filteredItems = section.items.filter(it => {
                const matchSearch = it.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  it.tag.toLowerCase().includes(searchQuery.toLowerCase());
                
                // Jika user biasa login: HANYA izinkan item ber-role 'user'
                if (!isAdmin && it.role !== 'user') return false;

                // Jika admin login: saring sesuai tab roleFilter
                const matchRole = roleFilter === 'all' || it.role === roleFilter;
                return matchSearch && matchRole;
              });

              if (filteredItems.length === 0) return null;

              return (
                <div key={section.id} className="space-y-1">
                  <div className="flex items-center justify-between px-2 py-1 text-xs font-bold text-slate-300">
                    <div className="flex items-center gap-2">
                      <SectionIcon size={14} className="text-primary-400" />
                      <span>{section.title}</span>
                    </div>
                    {section.adminOnly && (
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-purple-950/60 text-purple-400 border border-purple-800/60 font-semibold uppercase">
                        Admin Only
                      </span>
                    )}
                  </div>

                  <div className="space-y-0.5 ml-2 pl-3 border-l border-slate-800">
                    {filteredItems.map((item) => {
                      const isSelected = activeArticle === item.id;
                      const isAdminItem = item.role === 'admin';
                      return (
                        <button
                          key={item.id}
                          onClick={() => selectArticle(section.id, item.id)}
                          className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-all flex items-center justify-between gap-1.5 ${
                            isSelected
                              ? 'bg-primary-500/10 text-primary-400 font-bold shadow-sm border border-primary-500/20'
                              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                          }`}
                        >
                          <span className="truncate flex-1">{item.label}</span>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            {isAdminItem ? (
                              <span className="text-[9px] px-1 py-0.2 rounded font-mono uppercase bg-purple-900/40 text-purple-300 border border-purple-700/40 font-bold">
                                Admin
                              </span>
                            ) : (
                              <span className="text-[9px] px-1 py-0.2 rounded font-mono uppercase bg-blue-900/30 text-blue-300 border border-blue-700/30">
                                User
                              </span>
                            )}
                            {item.tag && (
                              <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono uppercase ${
                                isSelected
                                  ? 'bg-primary-500/20 text-primary-300 font-semibold'
                                  : 'bg-slate-800 text-slate-500'
                              }`}>
                                {item.tag}
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </aside>

        {/* ── CENTER: ARTICLE CONTENT ── */}
        <main className="lg:col-span-7 space-y-8 vision-card p-6 sm:p-9">
          
          {/* ARTICLE: Pengenalan & Instalasi */}
          {activeArticle === 'install' && (
            <article className="space-y-6">
              <div className="border-b border-slate-800 pb-5">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-500/10 text-primary-400 text-xs font-mono mb-3 border border-primary-500/20">
                  <Compass size={13} /> Getting Started
                </div>
                <h1 className="text-3xl font-black text-slate-100 tracking-tight">
                  Pengenalan & Instalasi Platform
                </h1>
                <p className="mt-2 text-slate-400 text-sm leading-relaxed">
                  VideaLink adalah platform IoT terpadu berbasis web yang dirancang untuk mengontrol, menyimpan data telemetri, dan memvisualisasikan perangkat keras cerdas secara real-time.
                </p>
              </div>

              <section id="toc-intro" className="space-y-3 pt-2">
                <h2 className="text-lg font-bold text-slate-200 flex items-center gap-2">
                  <ChevronRight size={16} className="text-primary-400" />
                  Apa itu VideaLink?
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  Platform ini bertindak sebagai jembatan cerdas antara perangkat keras (seperti ESP8266, ESP32, Arduino, Raspberry Pi) dan antarmuka web modern. Mendukung dua protokol utama industri: <b>MQTT Broker</b> untuk pengiriman data ultra-cepat hemat daya dan <b>HTTP/REST API</b> untuk integrasi standar.
                </p>
              </section>

              <section id="toc-prereq" className="space-y-3 pt-4">
                <h2 className="text-lg font-bold text-slate-200 flex items-center gap-2">
                  <ChevronRight size={16} className="text-primary-400" />
                  Persyaratan Sistem
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-800">
                    <span className="font-bold text-slate-200 block mb-1">Backend & Server</span>
                    <span className="text-slate-400">PHP 8.2+, Composer, MySQL / MariaDB, Node.js 18+ (untuk daemon listener).</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-800">
                    <span className="font-bold text-slate-200 block mb-1">Hardware & Firmware</span>
                    <span className="text-slate-400">ESP8266 (NodeMCU/Wemos D1) atau ESP32, kabel data USB, Arduino IDE 2.x.</span>
                  </div>
                </div>
              </section>

              <section id="toc-quick-setup" className="space-y-3 pt-4">
                <h2 className="text-lg font-bold text-slate-200 flex items-center gap-2">
                  <ChevronRight size={16} className="text-primary-400" />
                  Langkah Instalasi Cepat
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  Untuk menjalankan listener MQTT yang menyalurkan data sensor dari broker ke dashboard web:
                </p>

                <div className="bg-[#0b1120] border border-slate-800 rounded-xl overflow-hidden shadow-inner">
                  <div className="bg-slate-900 px-4 py-2 border-b border-slate-800 flex items-center justify-between text-[11px] font-mono text-slate-400">
                    <span className="flex items-center gap-2">
                      <Terminal size={13} className="text-emerald-400" /> terminal (Powershell / Bash)
                    </span>
                    <button
                      onClick={() => copyToClipboard('node mqtt-listener.cjs', 'terminal-cmd')}
                      className="hover:text-slate-200 flex items-center gap-1 text-[11px]"
                    >
                      {copiedKey === 'terminal-cmd' ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                      {copiedKey === 'terminal-cmd' ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <div className="p-4 text-xs font-mono text-emerald-400">
                    <span className="text-slate-500"># Jalankan MQTT listener daemon di root project</span>
                    <br />
                    node mqtt-listener.cjs
                  </div>
                </div>
              </section>

              <div className="p-4 rounded-xl bg-cyan-950/30 border border-cyan-800/40 text-cyan-300 text-xs leading-relaxed flex items-start gap-3">
                <AlertCircle size={18} className="text-cyan-400 flex-shrink-0 mt-0.5" />
                <div>
                  <b className="font-bold">Tips Koneksi:</b> Pastikan komputer server atau laptop Anda terhubung ke internet saat menggunakan broker public <code className="bg-black/30 px-1 py-0.5 rounded text-cyan-200">test.mosquitto.org:1883</code>.
                </div>
              </div>
            </article>
          )}

          {/* ARTICLE: Alur Kerja Cepat */}
          {activeArticle === 'quickstart' && (
            <article className="space-y-6">
              <div className="border-b border-slate-800 pb-5">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-500/10 text-primary-400 text-xs font-mono mb-3 border border-primary-500/20">
                  <Zap size={13} /> Getting Started
                </div>
                <h1 className="text-3xl font-black text-slate-100 tracking-tight">
                  Alur Kerja Cepat (Quickstart)
                </h1>
                <p className="mt-2 text-slate-400 text-sm leading-relaxed">
                  Panduan langkah demi langkah menghubungkan sensor fisik ke web dalam waktu kurang dari 5 menit.
                </p>
              </div>

              <div className="space-y-6">
                <div id="toc-step-1" className="space-y-2">
                  <h3 className="text-base font-bold text-slate-200 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-primary-500/20 text-primary-400 text-xs font-mono flex items-center justify-center font-bold">1</span>
                    Buat Device Baru di Dashboard
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-400 leading-relaxed pl-8">
                    Masuk ke menu <b>Devices</b>, klik tombol <b>+ Add Device</b>. Masukkan nama device, pilih tipe hardware (ESP8266 / ESP32), dan pilih ruangan tempat perangkat berada.
                  </p>
                </div>

                <div id="toc-step-2" className="space-y-2">
                  <h3 className="text-base font-bold text-slate-200 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-primary-500/20 text-primary-400 text-xs font-mono flex items-center justify-center font-bold">2</span>
                    Buat Data Bucket
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-400 leading-relaxed pl-8">
                    Masuk ke menu <b>Data Buckets</b>, klik <b>+ Add Bucket</b>. Hubungkan ke device yang baru Anda buat, dan tentukan MQTT Topic (contoh: <code className="text-primary-300">videalink/devices/esp8266-01</code> atau <code className="text-primary-300">videalink/devices/esp32-01</code>).
                  </p>
                </div>

                <div id="toc-step-3" className="space-y-2">
                  <h3 className="text-base font-bold text-slate-200 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-primary-500/20 text-primary-400 text-xs font-mono flex items-center justify-center font-bold">3</span>
                    Jalankan MQTT Listener Daemon
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-400 leading-relaxed pl-8">
                    Daemon ini bertugas menangkap paket data yang dipublish oleh ESP8266/ESP32 dan menyimpannya langsung ke database Laravel secara background:
                    <br /><code className="text-xs font-mono bg-black/50 text-amber-400 px-2 py-1 rounded inline-block mt-2">node mqtt-listener.cjs</code>
                  </p>
                </div>

                <div id="toc-step-4" className="space-y-2">
                  <h3 className="text-base font-bold text-slate-200 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-primary-500/20 text-primary-400 text-xs font-mono flex items-center justify-center font-bold">4</span>
                    Upload Kodingan ke Mikrokontroler
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-400 leading-relaxed pl-8">
                    Gunakan kode siap pakai pada menu <b>Firmware & Code</b> di sidebar kiri. Ganti SSID & Password Wi-Fi Anda, lalu upload melalui Arduino IDE.
                  </p>
                </div>
              </div>
            </article>
          )}

          {/* ARTICLE: Arsitektur Platform */}
          {activeArticle === 'architecture' && (
            <article className="space-y-6">
              <div className="border-b border-slate-800 pb-5">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-500/10 text-primary-400 text-xs font-mono mb-3 border border-primary-500/20">
                  <Layers size={13} /> Architecture
                </div>
                <h1 className="text-3xl font-black text-slate-100 tracking-tight">
                  Arsitektur Sistem IoT VideaLink
                </h1>
                <p className="mt-2 text-slate-400 text-sm leading-relaxed">
                  Pemahaman alur data end-to-end: dari sensor fisik, broker protokol, pipeline ingestion, hingga visualisasi antarmuka web.
                </p>
              </div>

              <div id="toc-arch-flow" className="p-5 rounded-2xl bg-slate-800/40 border border-slate-700/60 space-y-4">
                <h3 className="text-sm font-bold text-slate-200">Diagram Pipeline Data IoT</h3>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-center text-xs">
                  <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1">
                    <span className="font-bold text-primary-400 block">1. Edge Device</span>
                    <span className="text-[11px] text-slate-400">ESP8266 / ESP32 membaca sensor dan mengemas JSON</span>
                  </div>
                  <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1">
                    <span className="font-bold text-emerald-400 block">2. MQTT Broker</span>
                    <span className="text-[11px] text-slate-400">Mosquitto (1883/8883) mendistribusikan topik telemetri</span>
                  </div>
                  <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1">
                    <span className="font-bold text-amber-400 block">3. Ingestion Daemon</span>
                    <span className="text-[11px] text-slate-400">mqtt-listener mem-parsing JSON & menulis ke DB</span>
                  </div>
                  <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1">
                    <span className="font-bold text-purple-400 block">4. Live Web Dashboard</span>
                    <span className="text-[11px] text-slate-400">Grafik time-series & otomasi bereaksi instan</span>
                  </div>
                </div>
              </div>

              <section id="toc-arch-broker" className="space-y-2">
                <h3 className="text-base font-bold text-slate-200">MQTT Broker vs HTTP Ingestion</h3>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  VideaLink mengutamakan MQTT untuk perangkat bertenaga baterai atau mikrokontroler ringan karena overhead paket sangat kecil (&lt;50 bytes) dibandingkan HTTP handshake. Namun HTTP REST tetap disediakan untuk kemudahan integrasi mikrokontroler tanpa library MQTT.
                </p>
              </section>
            </article>
          )}

          {/* ARTICLE: MQTT Listener Daemon */}
          {activeArticle === 'listener' && (
            <article className="space-y-6">
              <div className="border-b border-slate-800 pb-5">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 text-xs font-mono mb-3 border border-amber-500/20">
                  <Terminal size={13} /> Background Service
                </div>
                <h1 className="text-3xl font-black text-slate-100 tracking-tight">
                  MQTT Listener Daemon
                </h1>
                <p className="mt-2 text-slate-400 text-sm leading-relaxed">
                  Service background berbasis Node.js yang bertindak sebagai jembatan penangkap data MQTT broker ke REST endpoint backend.
                </p>
              </div>

              <section id="toc-daemon-what" className="space-y-3">
                <h3 className="text-base font-bold text-slate-200">Mengapa Listener Diperlukan?</h3>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  Aplikasi web browser berjalan di sisi client dan tidak bisa secara langsung membuka koneksi soket TCP raw ke port 1883. Script <code className="text-amber-400 font-mono">mqtt-listener.cjs</code> berjalan sebagai daemon server yang selalu siap menerima data dari mikrokontroler kapan pun alat mengirimkan telemetri.
                </p>
              </section>

              <section id="toc-daemon-run" className="space-y-3">
                <h3 className="text-base font-bold text-slate-200">Cara Menjalankan:</h3>
                <div className="p-4 rounded-xl bg-black/60 font-mono text-xs text-amber-300 border border-slate-800">
                  node mqtt-listener.cjs
                </div>
                <p className="text-xs text-slate-400">
                  Setelah dijalankan, Anda akan melihat log seperti: <code className="text-emerald-400 font-mono">[MQTT] Connected to broker test.mosquitto.org</code>.
                </p>
              </section>
            </article>
          )}

          {/* ARTICLE: Registrasi Device */}
          {activeArticle === 'device-register' && (
            <article className="space-y-6">
              <div className="border-b border-slate-800 pb-5">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-500/10 text-primary-400 text-xs font-mono mb-3 border border-primary-500/20">
                  <Cpu size={13} /> Devices
                </div>
                <h1 className="text-3xl font-black text-slate-100 tracking-tight">
                  Registrasi & Manajemen Perangkat
                </h1>
                <p className="mt-2 text-slate-400 text-sm leading-relaxed">
                  Menambahkan unit mikrokontroler baru, memilih profil hardware, dan mengaitkannya ke sistem.
                </p>
              </div>

              <div id="toc-dev-add" className="space-y-3">
                <h3 className="text-base font-bold text-slate-200">Langkah Menambahkan Device</h3>
                <ol className="list-decimal list-inside text-xs sm:text-sm text-slate-400 space-y-2 leading-relaxed">
                  <li>Buka menu <b>Devices</b> di sidebar navigasi.</li>
                  <li>Klik tombol <b>+ Add Device</b> pada sudut kanan atas.</li>
                  <li>Isi <b>Device Name</b> yang deskriptif (contoh: <i>ESP8266 Sensor Suhu</i> atau <i>ESP32 Ruang Tamu</i>).</li>
                  <li>Pilih <b>Hardware Type</b> (ESP32, ESP8266, Raspberry Pi, Arduino).</li>
                  <li>Pilih <b>Room (Ruangan)</b> tempat perangkat diletakkan. Lokasi akan otomatis terisi mengikuti nama ruangan.</li>
                  <li>Pilih protokol <b>MQTT</b> atau <b>HTTP</b>.</li>
                </ol>
              </div>
            </article>
          )}

          {/* ARTICLE: Heartbeat & Online Detection */}
          {activeArticle === 'heartbeat' && (
            <article className="space-y-6">
              <div className="border-b border-slate-800 pb-5">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-mono mb-3 border border-emerald-500/20">
                  <Activity size={13} /> Status Detection
                </div>
                <h1 className="text-3xl font-black text-slate-100 tracking-tight">
                  Heartbeat & Deteksi Online / Offline
                </h1>
                <p className="mt-2 text-slate-400 text-sm leading-relaxed">
                  Bagaimana platform mendeteksi apakah suatu perangkat masih hidup atau telah mati/kehilangan sinyal.
                </p>
              </div>

              <div id="toc-hb-logic" className="space-y-3">
                <h3 className="text-base font-bold text-slate-200">Mekanisme Heartbeat Otomatis</h3>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  Setiap kali perangkat mengirim data telemetri ke server, server memperbarui kolom <code className="text-primary-300">last_seen_at</code> dengan timestamp terkini dan mengubah status menjadi <span className="text-emerald-400 font-bold">ONLINE</span>.
                </p>
              </div>

              <div id="toc-hb-timeout" className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/60 space-y-2">
                <h4 className="font-bold text-slate-200 text-sm">Batas Timeout 60 Detik</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Jika tidak ada pesan telemetri yang diterima dalam kurun waktu <b>60 detik</b>, status perangkat akan otomatis beralih menjadi <span className="text-slate-400 font-bold">OFFLINE</span>.
                </p>
              </div>
            </article>
          )}

          {/* ARTICLE: Sinkronisasi Ruangan (Device-Room) */}
          {activeArticle === 'device-room' && (
            <article className="space-y-6">
              <div className="border-b border-slate-800 pb-5">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 text-purple-400 text-xs font-mono mb-3 border border-purple-500/20">
                  <Home size={13} /> Integration
                </div>
                <h1 className="text-3xl font-black text-slate-100 tracking-tight">
                  Sinkronisasi Ruangan (Room) & Lokasi
                </h1>
                <p className="mt-2 text-slate-400 text-sm leading-relaxed">
                  Penyatuan sistem relasi smart-home room dengan kolom lokasi perangkat.
                </p>
              </div>

              <div id="toc-room-sync" className="space-y-3">
                <h3 className="text-base font-bold text-slate-200">Satu Pilihan Terpusat</h3>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  Untuk menghindari kebingungan pengguna antara kolom <i>Location Zone</i> dan <i>Room</i>, VideaLink menggunakan sistem otomatis: saat Anda memilih <b>Room</b> di form Add/Edit Device, kolom lokasi otomatis tersinkronisasi mengikuti nama ruangan tersebut.
                </p>
              </div>
            </article>
          )}

          {/* ARTICLE: Data Buckets Concept & Auto-discovery */}
          {(activeArticle === 'bucket-concept' || activeArticle === 'auto-discovery') && (
            <article className="space-y-6">
              <div className="border-b border-slate-800 pb-5">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-mono mb-3 border border-emerald-500/20">
                  <Database size={13} /> Data Buckets
                </div>
                <h1 className="text-3xl font-black text-slate-100 tracking-tight">
                  Konsep Data Bucket & Auto-Discovery
                </h1>
                <p className="mt-2 text-slate-400 text-sm leading-relaxed">
                  Cara kerja penyimpanan data time-series cerdas tanpa perlu mendefinisikan skema database secara manual.
                </p>
              </div>

              <div className="space-y-4">
                <h3 className="text-base font-bold text-slate-200">Bagaimana Auto-Discovery Bekerja?</h3>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  Saat mikrokontroler Anda mengirimkan string JSON seperti:
                </p>

                <div className="p-4 rounded-xl bg-black/60 font-mono text-xs text-emerald-400 border border-slate-800">
                  {`{\n  "temperature": 29.4,\n  "humidity": 68.2,\n  "voltage": 3.28,\n  "gas_ppm": 120\n}`}
                </div>

                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  Backend VideaLink secara instan mem-parsing key-key tersebut dan otomatis mendaftarkannya sebagai field metrik: <code className="text-primary-300">temperature</code>, <code className="text-primary-300">humidity</code>, <code className="text-primary-300">voltage</code>, dan <code className="text-primary-300">gas_ppm</code>. Anda dapat langsung memilih field ini saat membuat widget grafik!
                </p>
              </div>
            </article>
          )}

          {/* ================================================================ */}
          {/* ARTICLE 1: ESP8266 via MQTT                                      */}
          {/* ================================================================ */}
          {activeArticle === 'esp8266-mqtt' && (
            <article className="space-y-6">
              <div className="border-b border-slate-800 pb-5">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-mono mb-3 border border-emerald-500/20">
                  <Radio size={13} /> ESP8266 • MQTT Protocol
                </div>
                <h1 className="text-3xl font-black text-slate-100 tracking-tight">
                  ESP8266 via MQTT Protocol
                </h1>
                <p className="mt-2 text-slate-400 text-sm leading-relaxed">
                  Panduan lengkap menghubungkan mikrokontroler ESP8266 (NodeMCU / Wemos D1 Mini) menggunakan protokol MQTT ke broker VideaLink.
                </p>
              </div>

              {/* Code Snippet Box */}
              <div id="toc-firm-code" className="bg-[#0b1120] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                <div className="bg-slate-900/90 px-4 py-2.5 border-b border-slate-800 flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-300 font-bold flex items-center gap-2">
                    <Radio size={14} className="text-emerald-400" /> VideaLink_ESP8266_MQTT.ino
                  </span>
                  <button
                    onClick={() => copyToClipboard(codeESP8266MQTT, 'esp8266-mqtt-full')}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
                  >
                    {copiedKey === 'esp8266-mqtt-full' ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                    {copiedKey === 'esp8266-mqtt-full' ? 'Tersalin!' : 'Copy'}
                  </button>
                </div>
                <div className="p-4 overflow-x-auto text-xs font-mono text-slate-300 leading-relaxed max-h-[500px] custom-scrollbar">
                  <pre><code>{codeESP8266MQTT}</code></pre>
                </div>
              </div>

              {/* Detail Client ID */}
              <div id="toc-firm-mac" className="p-5 rounded-2xl bg-slate-800/40 border border-slate-700/60 space-y-3">
                <h4 className="font-bold text-slate-200 text-sm flex items-center gap-2">
                  <HelpCircle size={16} className="text-primary-400" />
                  Client ID Otomatis Berbasis MAC Address
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Pada broker MQTT publik (<code className="text-primary-300">test.mosquitto.org</code>), jika dua perangkat memiliki Client ID yang sama, broker akan memutus koneksi salah satunya. Kode di atas secara otomatis mengekstrak <code className="text-emerald-400 font-mono">WiFi.macAddress()</code> hardware Anda untuk membentuk Client ID unik, contoh: <code className="text-primary-300">VideaLink-ESP8266-485519DA987A</code>.
                </p>
              </div>

              <div id="toc-firm-lib" className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-400">
                <b className="text-slate-200">Library Arduino yang Dibutuhkan:</b>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li><code className="text-emerald-400">PubSubClient</code> by Nick O'Leary</li>
                  <li><code className="text-emerald-400">ArduinoJson</code> by Benoit Blanchon (v6.x atau v7.x)</li>
                </ul>
              </div>
            </article>
          )}

          {/* ================================================================ */}
          {/* ARTICLE 2: ESP8266 via HTTP REST                                 */}
          {/* ================================================================ */}
          {activeArticle === 'esp8266-http' && (
            <article className="space-y-6">
              <div className="border-b border-slate-800 pb-5">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 text-xs font-mono mb-3 border border-cyan-500/20">
                  <Globe size={13} /> ESP8266 • HTTP REST API
                </div>
                <h1 className="text-3xl font-black text-slate-100 tracking-tight">
                  ESP8266 via HTTP REST API
                </h1>
                <p className="mt-2 text-slate-400 text-sm leading-relaxed">
                  Panduan mengirimkan telemetri langsung dari ESP8266 menggunakan HTTP POST JSON ke REST API Laravel VideaLink.
                </p>
              </div>

              <div id="toc-firm-http-8266" className="bg-[#0b1120] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                <div className="bg-slate-900/90 px-4 py-2.5 border-b border-slate-800 flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-300 font-bold flex items-center gap-2">
                    <Globe size={14} className="text-cyan-400" /> VideaLink_ESP8266_HTTP.ino
                  </span>
                  <button
                    onClick={() => copyToClipboard(codeESP8266HTTP, 'esp8266-http-full')}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
                  >
                    {copiedKey === 'esp8266-http-full' ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                    {copiedKey === 'esp8266-http-full' ? 'Tersalin!' : 'Copy'}
                  </button>
                </div>
                <div className="p-4 overflow-x-auto text-xs font-mono text-slate-300 leading-relaxed max-h-[500px] custom-scrollbar">
                  <pre><code>{codeESP8266HTTP}</code></pre>
                </div>
              </div>

              <div id="toc-firm-http-header" className="p-5 rounded-2xl bg-slate-800/40 border border-slate-700/60 space-y-3">
                <h4 className="font-bold text-slate-200 text-sm flex items-center gap-2">
                  <ShieldCheck size={16} className="text-primary-400" />
                  Otorisasi Bearer Token HTTP
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Setiap panggilan REST API wajib menyertakan token autentikasi device di HTTP Header:
                  <br /><code className="text-cyan-400 font-mono text-xs block bg-black/40 p-2 rounded mt-2">Authorization: Bearer YOUR_DEVICE_32_CHAR_CREDENTIALS</code>
                  Token ini didapatkan saat pertama kali mendaftarkan device di menu <b>Devices</b>.
                </p>
              </div>
            </article>
          )}

          {/* ================================================================ */}
          {/* ARTICLE 3: ESP32 via MQTT                                        */}
          {/* ================================================================ */}
          {activeArticle === 'esp32-mqtt' && (
            <article className="space-y-6">
              <div className="border-b border-slate-800 pb-5">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-mono mb-3 border border-emerald-500/20">
                  <Radio size={13} /> ESP32 • MQTT Protocol
                </div>
                <h1 className="text-3xl font-black text-slate-100 tracking-tight">
                  ESP32 via MQTT Protocol
                </h1>
                <p className="mt-2 text-slate-400 text-sm leading-relaxed">
                  Panduan lengkap menghubungkan modul ESP32 (DOIT DevKit, NodeMCU-32S, ESP32-WROOM) menggunakan library PubSubClient ke broker MQTT VideaLink.
                </p>
              </div>

              <div id="toc-firm-code-esp32" className="bg-[#0b1120] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                <div className="bg-slate-900/90 px-4 py-2.5 border-b border-slate-800 flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-300 font-bold flex items-center gap-2">
                    <Radio size={14} className="text-emerald-400" /> VideaLink_ESP32_MQTT.ino
                  </span>
                  <button
                    onClick={() => copyToClipboard(codeESP32MQTT, 'esp32-mqtt-full')}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
                  >
                    {copiedKey === 'esp32-mqtt-full' ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                    {copiedKey === 'esp32-mqtt-full' ? 'Tersalin!' : 'Copy'}
                  </button>
                </div>
                <div className="p-4 overflow-x-auto text-xs font-mono text-slate-300 leading-relaxed max-h-[500px] custom-scrollbar">
                  <pre><code>{codeESP32MQTT}</code></pre>
                </div>
              </div>

              <div id="toc-firm-mac-esp32" className="p-5 rounded-2xl bg-slate-800/40 border border-slate-700/60 space-y-3">
                <h4 className="font-bold text-slate-200 text-sm flex items-center gap-2">
                  <HelpCircle size={16} className="text-primary-400" />
                  Kelebihan ESP32 pada Protokol MQTT
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  ESP32 memiliki memori RAM lebih besar (520KB) dan dual-core, sangat handal untuk frekuensi pengiriman data tinggi (&lt;1 detik) atau koneksi TLS/SSL port 8883.
                </p>
              </div>
            </article>
          )}

          {/* ================================================================ */}
          {/* ARTICLE 4: ESP32 via HTTP REST                                   */}
          {/* ================================================================ */}
          {activeArticle === 'esp32-http' && (
            <article className="space-y-6">
              <div className="border-b border-slate-800 pb-5">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-mono mb-3 border border-blue-500/20">
                  <Globe size={13} /> ESP32 • HTTP REST API
                </div>
                <h1 className="text-3xl font-black text-slate-100 tracking-tight">
                  ESP32 via HTTP REST API
                </h1>
                <p className="mt-2 text-slate-400 text-sm leading-relaxed">
                  Panduan mengirimkan data sensor dari ESP32 menggunakan library bawaan <code className="text-blue-300 font-mono">HTTPClient.h</code> langsung ke endpoint REST API Laravel.
                </p>
              </div>

              <div id="toc-http-code" className="bg-[#0b1120] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                <div className="bg-slate-900/90 px-4 py-2.5 border-b border-slate-800 flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-300 font-bold flex items-center gap-2">
                    <Server size={14} className="text-blue-400" /> VideaLink_ESP32_HTTP.ino
                  </span>
                  <button
                    onClick={() => copyToClipboard(codeESP32HTTP, 'esp32-http-full')}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
                  >
                    {copiedKey === 'esp32-http-full' ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                    {copiedKey === 'esp32-http-full' ? 'Tersalin!' : 'Copy'}
                  </button>
                </div>
                <div className="p-4 overflow-x-auto text-xs font-mono text-slate-300 leading-relaxed max-h-[500px] custom-scrollbar">
                  <pre><code>{codeESP32HTTP}</code></pre>
                </div>
              </div>

              <div id="toc-http-bearer" className="p-5 rounded-2xl bg-slate-800/40 border border-slate-700/60 space-y-3">
                <h4 className="font-bold text-slate-200 text-sm flex items-center gap-2">
                  <Key size={16} className="text-primary-400" />
                  Format Payload JSON yang Diterima Server
                </h4>
                <div className="p-4 rounded-xl bg-black/60 font-mono text-xs text-blue-400 border border-slate-800">
                  {`{\n  "temperature": 28.5,\n  "humidity": 65.2,\n  "rssi": -65\n}`}
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Anda bisa menambahkan kunci sensor lain (misal: <code className="text-blue-300">pressure</code>, <code className="text-blue-300">lux</code>, <code className="text-blue-300">co2</code>) secara dinamis tanpa perlu mengubah struktur tabel di database!
                </p>
              </div>
            </article>
          )}

          {/* ARTICLE: Library Arduino IDE */}
          {activeArticle === 'arduino-libraries' && (
            <article className="space-y-6">
              <div className="border-b border-slate-800 pb-5">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 text-purple-400 text-xs font-mono mb-3 border border-purple-500/20">
                  <Code2 size={13} /> Arduino IDE Setup
                </div>
                <h1 className="text-3xl font-black text-slate-100 tracking-tight">
                  Library Arduino IDE yang Wajib Di-install
                </h1>
                <p className="mt-2 text-slate-400 text-sm leading-relaxed">
                  Daftar dependensi pustaka open-source yang perlu ditambahkan via Arduino Library Manager (Ctrl + Shift + I).
                </p>
              </div>

              <div id="toc-lib-list" className="space-y-3">
                <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/60 space-y-2">
                  <h4 className="font-bold text-slate-200 text-sm">1. PubSubClient (by Nick O'Leary)</h4>
                  <p className="text-xs text-slate-400">Library klien MQTT standar industri untuk ESP8266 dan ESP32.</p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/60 space-y-2">
                  <h4 className="font-bold text-slate-200 text-sm">2. ArduinoJson (by Benoit Blanchon)</h4>
                  <p className="text-xs text-slate-400">Library parser dan serializer JSON tercepat dan hemat memori untuk mikrokontroler.</p>
                </div>
              </div>
            </article>
          )}

          {/* ARTICLE: Tema & Timezone */}
          {(activeArticle === 'theme-colors' || activeArticle === 'timezone-config') && (
            <article className="space-y-6">
              <div className="border-b border-slate-800 pb-5">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-500/10 text-primary-400 text-xs font-mono mb-3 border border-primary-500/20">
                  <Sliders size={13} /> Settings
                </div>
                <h1 className="text-3xl font-black text-slate-100 tracking-tight">
                  Pengaturan Platform & Personalisasi UI
                </h1>
                <p className="mt-2 text-slate-400 text-sm leading-relaxed">
                  Kustomisasi warna tema platform, zona waktu lokal, dan keamanan otentikasi.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div id="toc-th-palette" className="p-5 rounded-2xl vision-inner-box space-y-2">
                  <h4 className="font-bold text-slate-100 text-sm flex items-center gap-2">
                    <Palette size={16} className="text-primary-400" />
                    6 Tema Antarmuka & Custom Hex
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Pilih dari 6 kartu pratinjau tema (<b>Orange Mechanic</b>, <b>Purple Disco</b>, <b>Blue Powder</b>, <b>Vision Royal</b>, <b>Emerald Matrix</b>, atau <b>Crimson Pulse</b>), atau masukkan kode warna Hex kustom (<code className="text-primary-300">#B2F96F</code>) beserta fitur <b>Transparent Sidebar</b>.
                  </p>
                </div>

                <div id="toc-tz-wib" className="p-5 rounded-2xl bg-slate-800/40 border border-slate-700/60 space-y-2">
                  <h4 className="font-bold text-slate-200 text-sm flex items-center gap-2">
                    <Clock size={16} className="text-primary-400" />
                    Zona Waktu (Timezone)
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Mendukung <code className="text-primary-300">Asia/Jakarta (WIB)</code>, WITA, WIT, dan UTC. Timestamp grafik telemetri akan selalu akurat sesuai jam lokal Anda.
                  </p>
                </div>
              </div>
            </article>
          )}

          {/* ARTICLE: Production PM2 Daemon */}
          {activeArticle === 'prod-pm2' && (
            <article className="space-y-6">
              <div className="border-b border-slate-800 pb-5">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-mono mb-3 border border-emerald-500/20">
                  <Server size={13} /> Production • 24/7 Service
                </div>
                <h1 className="text-3xl font-black text-slate-100 tracking-tight">
                  Menjalankan MQTT Listener via PM2
                </h1>
                <p className="mt-2 text-slate-400 text-sm leading-relaxed">
                  Cara menjaga service MQTT listener tetap hidup 24/7 di server VPS / Linux tanpa terputus saat sesi terminal ditutup.
                </p>
              </div>

              <div id="toc-pm2-intro" className="p-5 rounded-2xl bg-slate-800/40 border border-slate-700/60 space-y-3">
                <h4 className="font-bold text-slate-200 text-sm">Mengapa Harus Menggunakan PM2?</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Menjalankan <code className="text-amber-300 font-mono">node mqtt-listener.cjs</code> langsung di terminal Linux akan mati begitu koneksi SSH ditutup atau server kehabisan memori. PM2 menjamin auto-restart seketika saat terjadi error dan otomatis hidup kembali saat server reboot.
                </p>
              </div>

              <div id="toc-pm2-cmd" className="space-y-3">
                <h3 className="text-base font-bold text-slate-200">Perintah Menjalankan PM2 di Server</h3>
                <div className="bg-[#0b1120] border border-slate-800 rounded-xl overflow-hidden font-mono text-xs">
                  <div className="bg-slate-900 px-4 py-2 text-slate-400 border-b border-slate-800 flex justify-between">
                    <span>bash (terminal VPS)</span>
                    <button onClick={() => copyToClipboard('npm install -g pm2 && pm2 start ecosystem.config.cjs --env production && pm2 save', 'pm2-cmd')} className="hover:text-white">
                      {copiedKey === 'pm2-cmd' ? 'Tersalin!' : 'Copy'}
                    </button>
                  </div>
                  <div className="p-4 text-emerald-400 space-y-1">
                    <p className="text-slate-500"># 1. Install PM2 secara global</p>
                    <p>npm install -g pm2</p>
                    <p className="text-slate-500 mt-2"># 2. Jalankan daemon menggunakan file konfigurasi yang sudah disediakan</p>
                    <p>pm2 start ecosystem.config.cjs --env production</p>
                    <p className="text-slate-500 mt-2"># 3. Kunci proses agar auto-start saat VPS booting</p>
                    <p>pm2 save</p>
                    <p>pm2 startup</p>
                  </div>
                </div>
              </div>

              <div id="toc-pm2-auto" className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-800/30 border border-slate-800">
                  <span className="font-bold text-slate-200 block mb-1">Cek Status Service</span>
                  <code className="text-primary-300 font-mono">pm2 status</code>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-800/30 border border-slate-800">
                  <span className="font-bold text-slate-200 block mb-1">Live Telemetri Log</span>
                  <code className="text-primary-300 font-mono">pm2 logs videalink-mqtt-listener</code>
                </div>
              </div>
            </article>
          )}

          {/* ARTICLE: Production NGINX */}
          {activeArticle === 'prod-nginx' && (
            <article className="space-y-6">
              <div className="border-b border-slate-800 pb-5">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-mono mb-3 border border-blue-500/20">
                  <Globe size={13} /> Web Server • Reverse Proxy
                </div>
                <h1 className="text-3xl font-black text-slate-100 tracking-tight">
                  Deploy Web & NGINX Reverse Proxy
                </h1>
                <p className="mt-2 text-slate-400 text-sm leading-relaxed">
                  Menyajikan Single Page Application (SPA) frontend dan mengamankan backend API dengan HTTPS SSL Let's Encrypt.
                </p>
              </div>

              <div id="toc-nginx-conf" className="space-y-3">
                <h3 className="text-base font-bold text-slate-200">1. Build Frontend Bundle</h3>
                <div className="bg-[#0b1120] border border-slate-800 rounded-xl p-4 font-mono text-xs text-emerald-400">
                  npm run build
                </div>
                <p className="text-xs text-slate-400">
                  File statis siap saji akan dibuat di folder <code className="text-slate-300 font-mono">dist/</code>.
                </p>
              </div>

              <div id="toc-nginx-ssl" className="p-5 rounded-2xl bg-slate-800/40 border border-slate-700/60 space-y-3">
                <h4 className="font-bold text-slate-200 text-sm">2. Pasang Sertifikat SSL Gratis</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Gunakan Certbot untuk mengaktifkan HTTPS secara otomatis:
                  <br /><code className="text-cyan-400 font-mono text-xs block bg-black/40 p-2 rounded mt-2">sudo certbot --nginx -d iot.domainanda.com</code>
                </p>
              </div>
            </article>
          )}

          {/* ARTICLE: Private Broker Mosquitto */}
          {activeArticle === 'prod-broker' && (
            <article className="space-y-6">
              <div className="border-b border-slate-800 pb-5">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 text-xs font-mono mb-3 border border-amber-500/20">
                  <ShieldCheck size={13} /> MQTT Security
                </div>
                <h1 className="text-3xl font-black text-slate-100 tracking-tight">
                  Self-Hosted Private Mosquitto Broker
                </h1>
                <p className="mt-2 text-slate-400 text-sm leading-relaxed">
                  Mengganti broker publik dengan broker MQTT pribadi di VPS untuk privasi 100% dan perlindungan otentikasi kata sandi.
                </p>
              </div>

              <div id="toc-brk-install" className="space-y-3">
                <h3 className="text-base font-bold text-slate-200">Instalasi Mosquitto di Ubuntu / Debian</h3>
                <div className="bg-[#0b1120] border border-slate-800 rounded-xl p-4 font-mono text-xs text-amber-300">
                  sudo apt update && sudo apt install -y mosquitto mosquitto-clients
                </div>
              </div>

              <div id="toc-brk-auth" className="p-5 rounded-2xl bg-slate-800/40 border border-slate-700/60 space-y-3">
                <h4 className="font-bold text-slate-200 text-sm">Kunci dengan Password (Non-Anonymous)</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Tambahkan baris berikut di file <code className="text-slate-300 font-mono">/etc/mosquitto/mosquitto.conf</code>:
                </p>
                <div className="p-3 bg-black/50 font-mono text-xs text-slate-300 rounded-lg">
                  listener 1883<br />
                  allow_anonymous false<br />
                  password_file /etc/mosquitto/passwd
                </div>
                <p className="text-xs text-slate-400">
                  Lalu generate user: <code className="text-amber-400 font-mono">sudo mosquitto_passwd -c /etc/mosquitto/passwd videalink_user</code>.
                </p>
              </div>
            </article>
          )}

          {/* ARTICLE: Hardware Hardening */}
          {activeArticle === 'prod-hardening' && (
            <article className="space-y-6">
              <div className="border-b border-slate-800 pb-5">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 text-rose-400 text-xs font-mono mb-3 border border-rose-500/20">
                  <Cpu size={13} /> Hardware Reliability
                </div>
                <h1 className="text-3xl font-black text-slate-100 tracking-tight">
                  Standardisasi Hardware di Lapangan
                </h1>
                <p className="mt-2 text-slate-400 text-sm leading-relaxed">
                  Best practice firmware level industri agar mikrokontroler tidak pernah freeze atau membebani router di lapangan.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div id="toc-hrd-wdt" className="p-5 rounded-2xl bg-slate-800/40 border border-slate-700/60 space-y-2">
                  <h4 className="font-bold text-slate-200 text-sm">1. Watchdog Timer (WDT)</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Aktifkan hardware watchdog timer di ESP8266/ESP32. Jika mikrokontroler hang/macet lebih dari 8 detik, modul otomatis restart sendiri tanpa perlu didatangi teknisi.
                  </p>
                </div>

                <div id="toc-hrd-backoff" className="p-5 rounded-2xl bg-slate-800/40 border border-slate-700/60 space-y-2">
                  <h4 className="font-bold text-slate-200 text-sm">2. Exponential Backoff</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Jangan mencoba reconnect setiap 100ms saat Wi-Fi putus karena akan menghabiskan baterai. Berikan jeda bertahap (5s, 15s, 30s, 60s).
                  </p>
                </div>

                <div id="toc-hrd-qos" className="p-5 rounded-2xl bg-slate-800/40 border border-slate-700/60 space-y-2">
                  <h4 className="font-bold text-slate-200 text-sm">3. Pemilihan QoS 0 vs 1</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Gunakan <b>QoS 0</b> untuk telemetri suhu/kelembapan rutin tiap 5 detik (hemat bandwidth), dan <b>QoS 1</b> untuk alert kebocoran gas/alarm bahaya.
                  </p>
                </div>
              </div>
            </article>
          )}

          {/* ARTICLE FALLBACK / GENERIC */}
          {!['install', 'quickstart', 'architecture', 'listener', 'device-register', 'heartbeat', 'device-room', 'esp8266-mqtt', 'esp8266-http', 'esp32-mqtt', 'esp32-http', 'arduino-libraries', 'bucket-concept', 'auto-discovery', 'theme-colors', 'timezone-config', 'prod-pm2', 'prod-nginx', 'prod-broker', 'prod-hardening'].includes(activeArticle) && (
            <article className="space-y-6">
              <div className="border-b border-slate-800 pb-5">
                <h1 className="text-3xl font-black text-slate-100 tracking-tight capitalize">
                  {activeArticle.replace(/-/g, ' ')}
                </h1>
                <p className="mt-2 text-slate-400 text-sm leading-relaxed">
                  Dokumentasi teknis untuk modul {activeArticle.replace(/-/g, ' ')} pada platform VideaLink IoT.
                </p>
              </div>
              <div className="p-6 rounded-2xl bg-slate-800/30 border border-slate-800 space-y-3">
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Modul ini telah terintegrasi penuh ke dalam sistem backend dan frontend VideaLink. Silakan gunakan navigasi di sebelah kiri atau daftar isi di sebelah kanan untuk melihat panduan terkait lainnya.
                </p>
              </div>
            </article>
          )}

          {/* ── PREVIOUS & NEXT ARTICLE NAVIGATION DENGAN NAMA BAB OTOMATIS ALA BOOTSTRAP ── */}
          <div className="border-t border-slate-800 pt-6 mt-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
            {prevArticle ? (
              <button
                onClick={() => selectArticle(prevArticle.sectionId, prevArticle.articleId)}
                className="group flex flex-col items-start px-4 py-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-slate-300 transition-all text-left"
              >
                <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider flex items-center gap-1">
                  <ChevronLeft size={12} /> Halaman Sebelumnya
                </span>
                <span className="font-bold text-slate-200 group-hover:text-primary-400 transition-colors mt-0.5">
                  {prevArticle.label}
                </span>
              </button>
            ) : <div />}

            {nextArticle ? (
              <button
                onClick={() => selectArticle(nextArticle.sectionId, nextArticle.articleId)}
                className="group flex flex-col items-end px-4 py-2.5 rounded-xl bg-primary-500/10 hover:bg-primary-500/20 border border-primary-500/30 text-primary-300 transition-all text-right ml-auto"
              >
                <span className="text-[10px] text-primary-400 font-mono uppercase tracking-wider flex items-center gap-1">
                  Halaman Berikutnya <ChevronRight size={12} />
                </span>
                <span className="font-bold text-primary-200 group-hover:text-white transition-colors mt-0.5">
                  {nextArticle.label}
                </span>
              </button>
            ) : <div />}
          </div>

        </main>

        {/* ── RIGHT SIDEBAR: "ON THIS PAGE" TABLE OF CONTENTS ALA BOOTSTRAP ── */}
        <aside className="hidden lg:block lg:col-span-2 text-xs lg:sticky lg:top-4 space-y-4">
          <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1.5">
            <ListTree size={13} className="text-primary-400" />
            On this page
          </div>

          <nav className="space-y-1.5 border-l border-slate-800 pl-3">
            {tableOfContents.map((toc) => (
              <a
                key={toc.id}
                href={`#${toc.id}`}
                className="block text-slate-400 hover:text-primary-400 py-1 transition-colors leading-snug truncate"
              >
                {toc.label}
              </a>
            ))}
          </nav>

          {/* Quick Support Badge */}
          <div className="pt-6 border-t border-slate-800/60 space-y-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 block">Community & Info</span>
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
              <span className="text-[11px] text-slate-300 font-bold block">Butuh bantuan firmware?</span>
              <p className="text-[10px] text-slate-500 leading-relaxed">
                Tanyakan langsung melalui prompt untuk contoh sensor DHT11, relay, atau LCD I2C.
              </p>
            </div>
          </div>
        </aside>

      </div>
    </div>
  );
}
