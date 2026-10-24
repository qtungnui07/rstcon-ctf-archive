# Shallow Exponent — Writeup

> **Category:** Crypto
> **Points:** 240
> **Provided:** `shallow-exponent.txt`

## Mô tả

> We intercepted the RSA handshake off an RST Hydro telemetry link. Somebody rolled their own RSA.

File đề cho bộ ba RSA công khai:

```
n = 1798833870873869284849918845620860538643880165022986742114642813661312853315304820782679618029532208957490095534130436612379372009999529099477747067768691526264177407415393442030762679500180205561694238201499359974897638676308345557663717049176534190057523522294384352445526791295392361693622465896436707
e = 3
c = 2327530519918477406206611427021204828261125512460673959207517503179638080356935424394665845069203565812949721743509027944983080555335276025128649854048470750403183372527635554979736435865413380593355053898690963586326808006858109846817125
```

## Flag

```
rstcon{cube_root_a_tiny_exponent}
```

## Nhận diện lỗ hổng

Điểm bất thường nhìn thấy ngay: **`c` nhỏ hơn nhiều so với `n`**.

```
n.bit_length() = 1008
c.bit_length() =  789
```

Với RSA textbook: `c = m^e mod n`. Nếu `m^e < n` thì phép mod **không xảy ra wrap** — `c` chính là `m^e` dưới dạng số nguyên. Ở đây `e = 3` (public exponent quá nhỏ — "shallow exponent" như tên đề), và thông điệp `m` là chuỗi flag ngắn (~32 byte ≈ 260 bit), nên:

```
m³ ≈ 260 × 3 = 780 bit < 1008 bit = n
```

→ `c = m³` nguyên văn, không liên quan gì tới cấu trúc số học của `n` (không cần phân tích `n` thành thừa số nguyên tố). Chỉ cần **khai căn bậc 3**.

Đây là tấn công kinh điển *"RSA with small exponent, no padding"* — một trong những lỗi phổ biến nhất khi người ta "tự chế" RSA thay vì dùng thư viện chuẩn.

## Khai thác

Khai căn bậc 3 nguyên bằng phương pháp Newton (thuần Python, không cần gmpy2):

```python
def iroot(x, k):
    """Căn bậc k nguyên của x, trả về (r, exact)."""
    r = 1 << ((x.bit_length() + k - 1) // k)   # ước ban đầu từ trên
    while True:
        # bước Newton: r' = ((k-1)*r + x/r^(k-1)) / k
        nr = ((k - 1) * r + x // r ** (k - 1)) // k
        if nr >= r:
            break
        r = nr
    # hiệu chỉnh sai số chênh lệch 1 đơn vị
    for cand in (r - 1, r, r + 1):
        if cand ** k == x:
            return cand, True
    return r, False

m, exact = iroot(c, 3)
print(exact)                                    # True — căn chính xác!
print(m.to_bytes((m.bit_length() + 7) // 8, 'big'))
```

Kết quả:

```
True
b'rstcon{cube_root_a_tiny_exponent}'
```

Việc `iroot` trả về `exact = True` xác nhận giả thuyết: `m³ = c` đúng từng bit, phép modulo chưa bao giờ được thực hiện.

*(Ghi chú: nếu `m³` có wrap qua `n` một vài lần, biến thể là khai căn trên `c + k·n` với k = 0, 1, 2, … — brute force số lần wrap. Ở đây không cần vì c < n.)*

## Vì sao đây là lỗi nghiêm trọng

RSA an toàn **không phải** chỉ nhờ khó phân tích `n`. Ba điều kiện bắt buộc:

1. **Public exponent đủ lớn** (`e = 65537` là chuẩn) — với `e = 3`, bất kỳ message nào ngắn hơn `n^(1/3)` đều bị khai căn trực tiếp.
2. **Padding chuẩn (OAEP)** — biến message thành giá trị ngẫu nhiên lớn, đảm bảo `m^e` luôn lớn hơn `n` và loại bỏ tính tất định của mã hoá.
3. **Không bao giờ tự implement** — "rolled their own RSA" trong đề chính là lời cảnh báo: đã có hàng chục cách sai tinh vi hơn thế này (CRT sai, prime generation yếu, blinding thiếu…).

Flag tự chốt lại bài học: `cube_root_a_tiny_exponent`.

## Tóm tắt

| Bước | Nội dung |
|------|----------|
| 1 | So sánh độ dài bit: `c` (789 bit) < `n` (1008 bit) → nghi không wrap |
| 2 | `e = 3` + message ngắn → `m³ < n` → `c = m³` nguyên văn |
| 3 | Khai căn bậc 3 nguyên (Newton) → flag hiện ra, không cần đụng tới `n` |
