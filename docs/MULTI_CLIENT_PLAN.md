# Multi-Client Plan

Tujuan: mengubah web undangan dari model single-client menjadi platform yang bisa melayani banyak client tanpa perlu duplikasi repo per pasangan.

## Keputusan Awal

Mulai dari multi-client berbasis `clientSlug`, bukan langsung subdomain.

Contoh URL tahap awal:

```text
https://domain-kamu.com/dina-alfian
https://domain-kamu.com/rina-bagus
https://domain-kamu.com/dina-alfian?to=Bapak%20Andi
```

Alasan:

- Tidak wajib langsung punya domain sendiri.
- Lebih mudah diuji di Vercel.
- Struktur data backend bisa disiapkan dulu.
- Nanti tetap bisa upgrade ke subdomain seperti `dina-alfian.domainkamu.com`.

## Status Saat Ini

Project masih single-client:

- Satu config aktif di Sheet `Config`.
- Tamu dan RSVP belum dipisah per client.
- Admin panel belum punya pemilih client.
- URL undangan belum membawa identitas client.

## Target Arsitektur

Setiap client punya `clientSlug`, misalnya:

```text
dina-alfian
rina-bagus
```

Data yang perlu dipisah per client:

- Config undangan
- Daftar tamu
- RSVP dan ucapan
- Galeri/foto
- Musik
- Rekening/e-wallet gift
- Link share metadata

## Perubahan Data Backend

### Sheet Config

Ubah dari satu baris config menjadi banyak baris berdasarkan `clientSlug`.

Kolom baru minimum:

```text
clientSlug
clientName
status
createdAt
updatedAt
...kolom config existing
```

Aturan:

- `clientSlug` wajib unik.
- Public hanya membaca config dengan `status=active`.
- Config lama dimigrasikan ke slug default, misalnya `default`.

### Sheet Guests

Tambah kolom:

```text
ClientSlug
```

Semua import/list/update/delete tamu wajib filter by `clientSlug`.

### Sheet RSVP

Tambah kolom:

```text
ClientSlug
```

RSVP personal dan group wajib tersimpan sesuai client.

## Perubahan Frontend Public

Tambahkan resolver client:

1. Ambil slug dari path: `/dina-alfian`
2. Fallback dari query: `?client=dina-alfian`
3. Fallback terakhir: `default`

Request config:

```text
GET AppsScript?action=config&client=dina-alfian
```

Submit RSVP:

```json
{
  "clientSlug": "dina-alfian",
  "nama": "...",
  "jumlah": 2,
  "kehadiran": "Hadir"
}
```

## Perubahan Admin

Tahap pertama admin cukup pakai input/select client:

- Pilih client aktif
- Buat client baru
- Edit config client terpilih
- Import tamu untuk client terpilih
- Generate link berdasarkan client terpilih

Contoh link tamu:

```text
https://domain-kamu.com/dina-alfian?to=Bapak%20Andi&guest=abc123
```

## Perubahan Vercel

`api/share.js` perlu membaca client dari path/query agar metadata share sesuai client.

Contoh:

```text
/dina-alfian
/?client=dina-alfian
```

`vercel.json` perlu rewrite agar slug client tetap menuju share handler/public frontend.

## Subdomain dan Domain

### Tanpa Domain Sendiri

Bisa pakai path:

```text
undangan-kamu.vercel.app/dina-alfian
```

Ini cukup untuk MVP multi-client.

### Dengan Domain Sendiri

Bisa pakai path:

```text
domainkamu.com/dina-alfian
```

Lebih profesional dan tetap sederhana.

### Dengan Wildcard Subdomain

Bisa pakai:

```text
dina-alfian.domainkamu.com
rina-bagus.domainkamu.com
```

Syarat:

- Punya domain sendiri.
- DNS mendukung wildcard record `*.domainkamu.com`.
- Vercel/domain hosting diset untuk wildcard domain.
- Aplikasi bisa membaca host/subdomain sebagai `clientSlug`.

Rekomendasi: lakukan setelah path-based multi-client stabil.

## Tahapan Implementasi

### Phase 1: Foundation

- Tambah helper `clientSlug` di frontend public.
- Tambah `clientSlug` di payload RSVP.
- Tambah query `client` saat load config dan wishes.
- Backend tetap backward-compatible dengan client `default`.

### Phase 2: Backend Multi-Client

- Tambah kolom `clientSlug` di Config, Guests, RSVP.
- Update `getSavedConfig_`, `saveConfig_`, `listGuests_`, `importGuests_`, `saveRsvp_`, `listWishes_`, `listRsvps_`.
- Tambah migrasi data lama ke `default`.

### Phase 3: Admin Client Management

- Tambah dropdown/picker client di admin.
- Tambah form buat client baru.
- Generate link undangan dengan slug client.
- Pastikan preview admin memakai client yang sedang aktif.

### Phase 4: Routing dan Share Preview

- Update `vercel.json` untuk route `/:clientSlug`.
- Update `api/share.js` supaya fetch config berdasarkan client.
- Pastikan redirect tetap membawa `to`, `guest`, dan `type`.

### Phase 5: Hardening

- Batasi slug dengan format aman: lowercase, angka, hyphen.
- Tambah validasi duplikat slug.
- Tambah status client: `draft`, `active`, `archived`.
- Tambah export data per client.
- Tambah backup/import per client.

### Phase 6: Optional Subdomain

- Tambah resolver client dari hostname.
- Setup wildcard domain di DNS dan Vercel.
- Tetap support path-based URL sebagai fallback.

## Risiko

- Apps Script bisa makin berat kalau semua client dalam satu spreadsheet besar.
- Upload foto/musik perlu folder Drive per client agar aset rapi.
- Admin auth satu `ADMIN_KEY` cukup untuk awal, tapi nanti perlu role/user kalau bisnis membesar.
- Migrasi data lama harus hati-hati supaya RSVP existing tidak hilang.

## Rekomendasi Teknis

Untuk MVP, gunakan:

```text
domain.com/{clientSlug}
```

Jangan mulai dari subdomain dulu. Subdomain bagus untuk branding, tapi menambah kompleksitas DNS dan routing.

## Catatan Kerja

- `backend-gas/Code.gs` tetap dikelola manual dan tidak ikut GitHub.
- `.codex/` tetap lokal dan tidak ikut GitHub.
- Jika phase multi-client mulai dikerjakan, update `AGENTS.md` dan skill `wedding-invitation-workflow`.

