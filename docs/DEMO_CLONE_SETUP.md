# Demo Clone Setup

Panduan ini untuk membuat demo baru dari repo yang sama dengan akun GitHub/Vercel/Apps Script baru.

## Tujuan

Clone baru harus langsung bisa menampilkan website undangan demo tanpa backend aktif. Setelah itu backend Apps Script dan Vercel bisa disambungkan bertahap.

## Status Demo Code

`frontend/config.js` sudah dibuat demo-ready:

- `RSVP_API_URL` kosong agar URL GAS cukup diambil dari Vercel env.
- Runtime config dibaca dari `/api/runtime-config`.
- `WEDDING_CONFIG` sudah berisi data demo lengkap.
- Theme default demo memakai `rose`.
- Gift, galeri, love story, acara, SEO, dan musik demo sudah terisi.

## Clone Repo

```bash
git clone https://github.com/USERNAME/REPO-DEMO.git
cd REPO-DEMO
```

Jika memakai repo lama sebagai sumber, buat repo GitHub baru lalu push ke repo baru.

## Setup Vercel Baru

1. Import repo ke Vercel.
2. Deploy default branch.
3. Setelah deploy, salin URL Vercel.
4. Set environment variable di Vercel:

```text
INVITATION_BASE_URL=https://url-vercel-baru.vercel.app/
```

5. Jika belum ada Apps Script, jangan isi `RSVP_API_URL` dulu.

Dengan kondisi ini, halaman public tetap tampil dari data demo lokal, tetapi RSVP/admin server belum aktif.

## Setup Apps Script Baru

`backend-gas/Code.gs` dikelola manual. Jika file tersedia di lokal, copy isinya ke Apps Script baru.

Langkah:

1. Buka `script.new`.
2. Paste isi `backend-gas/Code.gs`.
3. Buat Google Sheet baru dan hubungkan Apps Script dari Sheet tersebut, atau buat script dari menu `Extensions > Apps Script`.
4. Set Script Properties:

```text
ADMIN_KEY=isi_secret_admin_baru
DRIVE_FOLDER_ID=opsional_id_folder_drive
```

5. Deploy sebagai Web App:

```text
Execute as: Me
Who has access: Anyone
```

6. Salin URL `/exec`.
7. Di Vercel, set environment variable:

```text
RSVP_API_URL=PASTE_URL_APPS_SCRIPT_BARU
INVITATION_BASE_URL=https://url-vercel-baru.vercel.app/
```

8. Redeploy Vercel.

## Setup Admin Demo

Buka:

```text
https://url-vercel-baru.vercel.app/admin
```

Lalu:

1. Masukkan `ADMIN_KEY`.
2. Klik `Muat dari Server`.
3. Kalau backend masih kosong, halaman public tetap punya fallback demo.
4. Setelah backend aktif, isi/edit data lewat admin.
5. Klik `Simpan Konfigurasi`.

## Catatan Git

- `backend-gas/Code.gs` jangan dipush kalau backend dikelola manual.
- `.codex/` jangan dipush karena itu skill lokal Codex.
- `undangan digital.zip` jangan ikut commit.

## Checklist Demo Baru

- [ ] Repo baru sudah dibuat.
- [ ] Vercel project baru sudah deploy.
- [ ] `INVITATION_BASE_URL` di Vercel sudah diisi.
- [ ] Apps Script baru sudah dibuat.
- [ ] `ADMIN_KEY` baru sudah diset.
- [ ] Environment `RSVP_API_URL` di Vercel sudah diset.
- [ ] Admin bisa simpan config.
- [ ] Public page bisa load config dari server.
- [ ] RSVP masuk ke Sheet baru.
