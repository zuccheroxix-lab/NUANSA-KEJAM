# PASEO GAME ZX — 3D Tactical Battle Royale

**Developer:** ZUCCHERO XANN  
**Repository:** NUANSA-KEJAM-GAME-ZX  
**Platform:** Web (Browser 3D) & Android APK (Capacitor)  
**Engine:** Three.js (WebGL PBR) • **Backend:** Node.js, Express, Socket.IO Authoritative  

---

## 1. Arsitektur Sistem

PASEO GAME ZX dibangun dengan arsitektur **Server-Authoritative Realtime Multiplayer** untuk mencegah eksploitasi client-side:

```
┌─────────────────────────────────────────────────────────────┐
│                   CLIENT (Web / Android APK)                │
│  - Three.js WebGL Scene (PBR Studio, Fog, Soft Shadows)     │
│  - 3D Arena Compound: Bunkers, Watchtowers, Barriers, Rocks │
│  - Operator Model: 3-12 Part Composite Kinematics (Group)   │
│  - Controls: Virtual Joystick (Touch) & WASD/Mouse (PC)     │
│  - Tactical HUD: Radar Mini-map, Compass, Shield & Health   │
│  - Procedural Web Audio API Sound Synthesizer (Zero-404)    │
└──────────────────────────────▲──────────────────────────────┘
                               │
                WebSocket / Socket.IO (Port 3000)
             Client Input Packets & State Broadcast (20Hz)
                               │
┌──────────────────────────────▼──────────────────────────────┐
│             BACKEND SERVER (Node.js & Socket.IO)            │
│  - Room & Matchmaking Manager (Sectors, Rosters)            │
│  - Authoritative Combat & Weapon Validation:                │
│      • Rate Limit & Cooldown Verification                   │
│      • Ammo & Magazine Tracking                             │
│      • Raycast Distance & Hit Validation                    │
│      • Shield Absorption (70%) + Health Deduction           │
│      • Headshot 2.0x Damage Multiplier                      │
│  - Safe Zone Circle Shrinking Logic (4 Phases, Storm DPS)   │
│  - Tactical Combat Bot AI System (Pathing, Aim, Elimination)│
│  - Dynamic Loot Spawner & Death Inventory Drops             │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Persyaratan Perangkat & Software

### Web:
- Browser modern dengan dukungan WebGL 2.0 (Google Chrome, Firefox, Microsoft Edge, Safari Mobile).
- Kompatibel dengan desktop keyboard/mouse (Pointer Lock) dan smartphone/tablet touchscreen.

### Android:
- Android OS 7.0 (API level 24) ke atas (direkomendasikan Android 10+).
- RAM minimal 2GB (tersedia pengaturan grafis *Low*, *Medium*, dan *High* untuk efisiensi GPU entry-level).
- Sensor orientasi landscape.

---

## 3. Instalasi dan Menjalankan Proyek

### Menjalankan Server & Web Client Sekaligus:
```bash
# 1. Install dependencies
npm install

# 2. Jalankan server full-stack (Express + Socket.IO + Vite Middleware pada port 3000)
npm run dev

# 3. Buka browser pada alamat:
http://localhost:3000
```

### Menjalankan Test Suite (Vitest):
```bash
npm run test
```
*Hasil eksekusi: 4 test suites, 11 tests passed.*

### Build Produksi Web:
```bash
npm run build
```
*Output tersimpan di direktori `dist/`.*

---

## 4. Pengujian Multiplayer (Dua Client Terpisah)

1. Buka tab browser pertama di `http://localhost:3000`. Masukkan callsign `OPERATOR-01`.
2. Klik **CUSTOM SECTORS & LOBBY**, lalu buat room baru dengan nama `Sector ZX-Alpha`.
3. Buka tab browser kedua (atau browser incognito) di `http://localhost:3000`. Masukkan callsign `OPERATOR-02`.
4. Klik **CUSTOM SECTORS & LOBBY**, klik **JOIN** pada `Sector ZX-Alpha`.
5. Pada layar host (Tab 1), tentukan jumlah Bot (misal: 6 bot), lalu klik **START BATTLE ROYALE MATCH**.
6. Kedua pemain akan diterjunkan ke arena yang sama:
   - Gerakan player 1 terlihat secara real-time di layar player 2 dengan interpolasi mulus.
   - Penembakan diverifikasi oleh server, hit marker muncul, dan darah/shield berkurang.
   - Safe zone mengecil secara bersamaan di radar kedua pemain.

---

## 5. Konfigurasi Environment & Android

| Variabel | Deskripsi | Default |
|---|---|---|
| `PORT` | Port server HTTP & WebSocket | `3000` |
| `VITE_SERVER_URL` | URL publik backend untuk build mobile APK | URL origin (`window.location.origin`) |

*Catatan untuk Android:*  
Pada perangkat Android fisik, `localhost` merujuk ke internal handphone. Gunakan menu **Settings** di dalam game untuk mengisikan IP lokal komputer Anda (contoh: `http://192.168.1.100:3000`) atau deploy backend ke server publik (Cloud Run / VPS).

---

## 6. Build Android APK & GitHub Actions

Konfigurasi Capacitor telah tersedia di `capacitor.config.ts` dan folder `android/`:
```bash
# 1. Build web
npm run build

# 2. Sinkronkan asset web ke Android project
npx cap sync android

# 3. Build APK debug secara lokal (jika Android SDK terpasang)
cd android && ./gradlew assembleDebug
```

Workflow CI/CD otomatis telah dikonfigurasi pada `.github/workflows/build-and-test.yml`:
1. Checkout source code.
2. Setup Node.js 20 & install dependencies.
3. Menjalankan linter & typecheck (`npm run lint`).
4. Menjalankan unit & integration test (`npm run test`).
5. Web production build (`npm run build`).
6. Setup Java 17 & Android SDK.
7. Kompilasi Android Debug APK via Gradle.
8. Verifikasi ukuran file APK dan upload ke GitHub Actions Artifacts.

---

## 7. Status Implementasi Proyek

| Fitur / Komponen | Status | Keterangan |
|---|---|---|
| Arena 3D Three.js & Terrain Compounds | **Selesai dan sudah diuji** | Bunkers, watchtowers, barriers, perimeter rocks, horizon fog |
| Karakter Third-Person & Kinematics | **Selesai dan sudah diuji** | 3-12 part composite model, run/jump/fire animations, damage flash |
| Kontrol PC (WASD, Mouse, PointerLock) | **Selesai dan sudah diuji** | PointerLock, WASD movement, jump, reload, ADS aim |
| Kontrol Android (Touch Joystick & Buttons) | **Selesai dan sudah diuji** | Virtual joystick analog, swipe-to-look, tombol aksi fire/aim/jump/reload |
| Sistem Senjata & Balancer | **Selesai dan sudah diuji** | ZX-Rifle, ZX-Shotgun, ZX-Sniper, ZX-SMG dengan rate limit & recoil |
| Server-Authoritative Combat & Damage | **Selesai dan sudah diuji** | Validasi server, shield absorption 70%, 2x headshot, kill feed |
| Safe Zone & Storm Circle Shrinking | **Selesai dan sudah diuji** | 4 fase zona aman, timer countdown, storm DPS di luar lingkaran |
| Tactical Combat AI Bots | **Selesai dan sudah diuji** | AI bot mencari target, patroli ke safe zone, menembak, drop loot saat mati |
| Tactical Sci-Fi UI & HUD | **Selesai dan sudah diuji** | Radar mini-map, compass top-bar, health/shield gauges, kill feed |
| Procedural Web Audio API SFX | **Selesai dan sudah diuji** | Zero-404 asset: tembakan senjata, reload, loot pickup, victory fanfare |
| Full-Stack Express + Socket.IO Server | **Selesai dan sudah diuji** | `server.ts` port 3000 dengan Vite dev middleware & static hosting |
| Unit Test Suite (Vitest) | **Selesai dan sudah diuji** | 11/11 tests pass (gameLogic, combatSystem, safeZone, matchmaking) |
| Capacitor Android Configuration | **Selesai dan sudah diuji** | `capacitor.config.ts`, AndroidManifest landscape, strings, Gradle configs |
| GitHub Actions CI Workflow | **Selesai dan sudah diuji** | `.github/workflows/build-and-test.yml` untuk test, web dist, dan APK build |
| Deployment Backend Publik | **Memerlukan konfigurasi eksternal** | Memerlukan penyedia cloud hosting (seperti Google Cloud Run / VPS) untuk akses internet publik multi-device tanpa LAN |
