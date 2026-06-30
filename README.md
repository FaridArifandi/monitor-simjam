# SimJam Barang 📦

Sistem Informasi Monitoring Peminjaman Barang Kantor berbasis web yang responsif dengan fitur Light/Dark Mode, pelacakan inventaris, log transaksi, dan bukti foto (**PAP - Post a Picture**) saat peminjaman maupun pengembalian.

Didesain khusus dengan interface modern (Glassmorphism & Clean Typography) menggunakan **React + Vite** dan terintegrasi dengan **Supabase** sebagai database + file storage gratis.

---

## 🌟 Fitur Utama

- **Dashboard Real-time**: Statistik visual total barang, sedang dipinjam, tersedia, dan maintenance beserta feed aktivitas terbaru.
- **Manajemen Inventaris (CRUD)**: Kelola data barang dengan kategori, lokasi penyimpanan, deskripsi, dan foto barang.
- **Peminjaman & Pengembalian Terintegrasi**: Form interaktif untuk meminjam barang dan konfirmasi pengembalian barang.
- **Bukti PAP (Foto Bukti)**: Fitur wajib upload foto kondisi barang saat dipinjam maupun dikembalikan untuk transparansi.
- **Theme Toggle**: Dukungan Dark Mode dan Light Mode yang nyaman di mata dengan transisi halus.
- **Responsive Layout**: Optimal digunakan di perangkat mobile (smartphone) maupun desktop.
- **Graceful Demo Fallback**: Aplikasi tetap berjalan dengan data simulasi (mock) lokal jika database Supabase belum terhubung.

---

## 🚀 Memulai (Lokal)

### 1. Kloning Repositori
```bash
git clone https://github.com/FaridArifandi/monitor-simjam.git
cd monitor-simjam
```

### 2. Install Dependensi
```bash
npm install
```

### 3. Jalankan Mode Development
```bash
npm run dev
```
Buka browser di [http://localhost:5173](http://localhost:5173). Aplikasi akan berjalan menggunakan data dummy bawaan secara otomatis.

---

## 💾 Menghubungkan Supabase (Database Gratis)

Untuk mengaktifkan database real-time dan penyimpanan foto bukti:

1. Buat akun dan buat project baru secara gratis di [Supabase](https://supabase.com).
2. Di **SQL Editor** Supabase, jalankan query berikut untuk membuat tabel:

```sql
-- Tabel Pengguna (Anggota BPS)
CREATE TABLE office_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  division TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabel Barang
CREATE TABLE items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  status TEXT DEFAULT 'tersedia' CHECK (status IN ('tersedia', 'dipinjam', 'maintenance')),
  location TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabel Peminjaman
CREATE TABLE borrowings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id UUID REFERENCES items(id) ON DELETE CASCADE,
  borrower_name TEXT NOT NULL,
  borrower_division TEXT,
  borrow_date TIMESTAMPTZ DEFAULT NOW(),
  expected_return_date TIMESTAMPTZ,
  actual_return_date TIMESTAMPTZ,
  status TEXT DEFAULT 'dipinjam' CHECK (status IN ('dipinjam', 'dikembalikan', 'terlambat')),
  borrow_photo_url TEXT,
  return_photo_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

3. Pergi ke bagian **Storage** di dashboard Supabase, buat bucket baru bernama **`photos`** dan atur aksesnya menjadi **Public** (agar foto bukti bisa diakses via URL).
4. Buat file `.env` di direktori utama proyek, lalu masukkan API URL dan Anon Key dari Supabase:
```env
VITE_SUPABASE_URL=https://xxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```
5. Restart server local dev (`npm run dev`). Aplikasi kini terhubung langsung dengan Supabase secara real-time!

---

## 🌐 Mendeploy ke Vercel

Aplikasi ini sudah dikonfigurasi (`vercel.json`) untuk dideploy langsung ke **Vercel**:

1. Hubungkan akun GitHub Anda ke Vercel.
2. Buat project baru di Vercel dan pilih repositori `monitor-simjam`.
3. Di bagian **Environment Variables** Vercel, tambahkan:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Klik **Deploy**. Selesai! Aplikasi Anda aktif secara online.
