# 🎮 Tetris

Game ringan berbasis terminal yang ditulis dalam Python dan C++.
Silakan pilih salah satu versi sesuai kenyamanan lu.

---

## 🧪 Instalasi

### ▶️ Python
```bash
pkg update && pkg upgrade -y
pkg install python git
git clone https://github.com/Rovikin/Tetris.git
cd Tetris
python tetris.py
```

### 💻 C++
```bash
pkg update && pkg upgrade -y
pkg install git clang make ncurses
git clone https://github.com/Rovikin/Tetris.git
cd Tetris
g++ tetris.cpp -o tetris -lncurses
./tetris
```

---

## 🎮 Panduan Kontrol

Gunakan kursor keyboard lu:

| Tombol | Fungsi            |
|--------|-------------------|
| ↑      | Rotasi blok       |
| ↓      | Hard drop         |
| ← / →  | Geser kiri / kanan|
| Spasi  | Hard drop         |
| P      | Pause / Unpause   |
| Q      | Keluar dari game  |

---

## 📜 Lisensi

Proyek ini menggunakan lisensi **MIT** (opsional, tapi disarankan).  
Feel free buat pakai, modif, atau kontribusi balik ✨

---

## 📂 Struktur File

```
Tetris/
├── tetris.py    # Versi Python
├── tetris.cpp   # Versi C++
└── README.md    # File ini
```

---

## 🚀 Credits

Made with ❤️ by [Rovikin](https://github.com/Rovikin)