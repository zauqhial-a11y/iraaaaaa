AISYARAH SHARED - FIXED VERSION

Perbaikan:
1. Icon tombol/navigation diperjelas dan tetap tampil di HP.
2. Tampilan mobile dibuat dengan bottom navigation.
3. Mood, surat, kenangan, dan rencana memakai Firebase Realtime Database.
4. Data tersimpan online di path:
   aisyarah_space/moods
   aisyarah_space/notes
   aisyarah_space/memories
   aisyarah_space/plans

SEBELUM UPLOAD:
- Buat Firebase Web App.
- Aktifkan Authentication > Anonymous.
- Buat Realtime Database.
- Tempel firebaseConfig dari Firebase ke app.js.
- Untuk pengujian awal, Rules bisa:
{
  "rules": {
    ".read": "auth != null",
    ".write": "auth != null"
  }
}

PENTING:
Jangan membagikan service account/private key. firebaseConfig Web App boleh berada di frontend; keamanan data tetap bergantung pada Firebase Authentication dan Database Rules.

SETELAH ITU:
Upload index.html, style.css, app.js ke GitHub Pages.
Buka link yang sama di HP Zauqhi dan Aisyarah.
Pilih nama masing-masing.
Data yang disimpan akan masuk ke database yang sama.
