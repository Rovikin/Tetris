# 🎮 Tetris

Game ringan berbasis terminal yang ditulis dalam Python dan C++.
Silakan pilih salah satu versi sesuai kenyamanan anda.

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

Gunakan kursor keyboard anda:

| Tombol | Fungsi            |
|--------|-------------------|
| ↑      | Rotasi blok       |
| ↓      | Hard drop         |
| ← / →  | Geser kiri / kanan|
| Spasi  | Hard drop         |
| P      | Pause / Unpause   |
| Q      | Keluar dari game  |


## 🚀 Credits

Made by [Rovikin](https://github.com/Rovikin)
