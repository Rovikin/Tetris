# 🎮 Blockdrop

Game ringan berbasis terminal yang ditulis dalam Python dan C++.
Silakan pilih salah satu versi sesuai kenyamanan anda.

Mainkan Blockdrop langsung di Browser kesayangan anda. Sambil bernostalgia masa kecil anda 😁.

[👉👉👉 Blockdrop Mobile Version](
https://rovikin.github.io/blockdrop/)

[👉👉👉 [Blockdrop Desktop Version]()
---

## 🧪 Instalasi

### ▶️ Python
```bash
pkg update && pkg upgrade -y
pkg install python git
git clone https://github.com/Rovikin/blockdrop.git
cd blockdrop/py/
python blockdrop.py
```

### 💻 C++
```bash
pkg update && pkg upgrade -y
pkg install git clang make ncurses
git clone https://github.com/Rovikin/blockdrop.git
cd blockdrop/cpp/
g++ blockdrop.cpp -o blockdrop -lncurses
./blockdrop
```

### Jalankan Offline

#### python

```
pkg update && pkg upgrade -y
pkg install git python
git clone https://github.com/Rovikin/blockdrop.git
cd blockdrop
python -m http.server 8089
```

#### NodeJS

```
pkg update && pkg upgrade -y
pkg install git nodejs
git clone https://github.com/Rovikin/blockdrop.git
npm install -g http-server
http-server
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
