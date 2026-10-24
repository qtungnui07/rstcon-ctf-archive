# New Money — Writeup

> **Category:** Web / Crypto-lite (danh mục on-site)
> **Points:** 300
> **Provided:** `bottlecap.jpg` (ảnh badge hội nghị)

## Mô tả

> Vault-Tec's Caps Lotto-Matic takes your bottlecaps and promises a fortune. The odds are terrible and the jackpot never seems to land -- almost like the wheels were decided before you ever pulled the lever.
>
> The photo attached seems old, but leads to to something new

## Flag

```
rstcon{th3_wh33ls_w3r3_n3v3r_r4nd0m}
```

## Bước 1: OSINT từ tấm ảnh — QR code trên badge

File JPEG được kiểm tra kỹ (walk toàn bộ JPEG segments, tìm EXIF/trailing data/strings) — **hoàn toàn sạch**, không steganography. Manh mối là chính nội dung bức ảnh: một **badge điện tử của ResetCon 2025** (hội nghị "cũ" — đúng hint *"seems old"*) in dòng chữ `BADGES BADGES BADGES .COM` và một **QR code**.

Decode QR bằng OpenCV:

```python
import cv2
img = cv2.imread('bottlecap.jpg')
print(cv2.QRCodeDetector().detectAndDecode(img)[0])
# → https://rstcon.org/bottle-cap        ← "something new"
```

Trỏ tới **Caps Lotto-Matic** — máy slot 3 bánh chủ đề Fallout: nạp 5 bottlecap/spin, hạ 3 biểu tượng cap để nhận "winning ticket serial", nhập serial vào form Redeem để mở Grand Prize.

## Bước 2: Đọc "ruột" máy — RNG client-side bị lộ

Toàn bộ game nằm trong một inline script trên trang (không bundle, không obfuscate). Ba mảnh quan trọng:

### a) Bộ sinh số ngẫu nhiên là LCG với seed cứng

```js
var e = {
    A: 1664525, C: 1013904223, M: 4294967296,   // LCG "Numerical Recipes"
    SEED: 3405691582,
    POOL: [0,1,1,2,2,2,3,3,3,3,4,4,4,4,4,5,5,5,5,5,5],
    IV: "Ap89oAD+nv/sLj5m",
    CT: "M8KK2DP+IYuYMvu3PgAT581HZkdj5F62u2rmdu7z6ld32sZWuboj096hbO5n0q/mK1RH3A=="
};
var t = e.SEED;

function S() {
    t = (e.A * t + e.C) % e.M;          // state 32-bit
    return e.POOL[t % e.POOL.length];   // → index biểu tượng
}
```

Kết quả mỗi lần rút là `POOL[t mod 21]` — ánh xạ sang 6 biểu tượng (`o[]`): **0 = cap, 1 = rad ☢, 2 = atom ⚛, 3 = seven 7, 4 = star ★, 5 = skull ☠**. Chỉ số 0 (cap) chiếm đúng **1/21** phần tử POOL.

### b) Logic spin và jackpot

```js
var e_reels = [S(), S(), S()];   // 3 lần rút mỗi spin
n = t;                           // ← SERIAL = state LCG sau 3 lần rút
```

- Jackpot (3 cap, trả 250 cap) chỉ xảy ra khi **cả 3 lần rút đều có `t mod 21 == 0`** → xác suất (1/21)³ ≈ **0.011% mỗi spin**. Với 100 cap khởi đầu (20 spin) cộng "Scavenge" 25 cap mỗi lần hết tiền, chơi tay là vô vọng — *"the odds are terrible"*.
- Vì seed cố định, vị trí spin trúng jackpot là **hằng số** — quyết định sẵn từ trước, đúng như tên đề và hint *"the wheels were decided before you ever pulled the lever"*.

### c) Redeem = giải mã AES-GCM

```js
// hàm G(serial):
key  = SHA-256( TextEncoder.encode(serial) )     // serial dạng chuỗi thập phân
pt   = AES-GCM.decrypt(iv = base64(IV), ct = base64(CT), key)
// decrypt fail (sai serial → GCM tag không khớp) → "the vault stays sealed"
```

Serial đúng chính là khóa dẫn xuất đúng — xác thực hoàn toàn nằm ở AES-GCM tag, không cần tương tác server gì thêm.

## Bước 3: Mô phỏng offline — không kéo cần nào cả

Vì LCG + seed đã biết, mô phỏng trực tiếp trong Python để dò spin trúng 3 cap:

```python
A, C, M = 1664525, 1013904223, 2**32
POOL = [0,1,1,2,2,2,3,3,3,3,4,4,4,4,4,5,5,5,5,5,5]
t = 3405691582

def draw():
    global t
    t = (A*t + C) % M
    return POOL[t % 21]

spin = 0
while True:
    spin += 1
    if draw() == 0 and draw() == 0 and draw() == 0:
        print("JACKPOT at spin", spin, "serial =", t)
        break
# → JACKPOT at spin 32472  serial = 680287398
```

Spin **32.472** — nếu chơi tay (5 cap/spin, scavenge 25 cap mỗi khi broke) phải nhấn nút hơn ba mươi nghìn lần.

Giải mã với serial tìm được:

```python
import base64, hashlib
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

IV = base64.b64decode("Ap89oAD+nv/sLj5m")
CT = base64.b64decode("M8KK2DP+...RH3A==")
key = hashlib.sha256(b"680287398").digest()
print(AESGCM(key).decrypt(IV, CT, None))
```

Kết quả:

```
rstcon{th3_wh33ls_w3r3_n3v3r_r4nd0m}
```

Flag chốt bài học: *"the wheels were never random"*.

## Tóm tắt

| Bước | Nội dung |
|------|----------|
| 1 | JPEG sạch → manh mối là nội dung ảnh: badge ResetCon 2025 + QR → `rstcon.org/bottle-cap` |
| 2 | Đọc inline JS: LCG Numerical Recipes seed cứng, POOL 21 phần tử, serial = state LCG sau 3 rút, redeem = SHA-256(serial) → AES-GCM |
| 3 | Mô phỏng LCG offline: jackpot ở spin 32.472, serial 680287398 → decrypt → flag |

## Bài học

- **Mọi "random" trong game đều đáng nghi**: PRNG seed cứng (hoặc seed từ thời gian đoán được) + kết quả có thể đọc từ client = trò chơi định đoạt trước. LCG tuyến tính đồng nhất (LCG với hằng số công khai) thì chuỗi xuất hoàn toàn tái tạo được chỉ cần biết một state.
- **Khóa mã hóa không nên sinh từ giá trị đoán được**: ở đây AES-GCM an toàn về mặt thuật toán, nhưng key = SHA-256(serial) mà serial là hàm xác định của RNG yếu → toàn bộ "vault" mở bằng mô phỏng.
- Ở khía cạnh CTF: khi thấy một trang game client-side, việc đầu tiên là **đọc inline script** — thường chứa cả seed, thuật toán, và cờ mã hóa sẵn.
