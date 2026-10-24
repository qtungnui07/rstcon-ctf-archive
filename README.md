# RSTCON 2026 CTF Archive

Archive các challenge đã làm tại RSTCON 2026 (on-site), author chính: **Veryyes**. Mỗi folder một challenge, chứa writeup + artifact + script/screenshot.

| # | Challenge | Điểm | Category | Flag | Writeup |
|---|-----------|------|----------|------|---------|
| 01 | Template Tide | 10 | Web — SSTI | `rstcon{ssti_rolls_in_with_the_t1de}` | ✅ |
| 02 | Carbon Noneoxide | 10 | Pwn / Firmware (QEMU Cortex-M3) | `rstcon{y0ur_Q_my_Q}` | ✅ |
| 03 | Leaky Logger | 10 | Pwn — Format String | *(xem writeup)* | ✅ |
| 04 | Dow is Up 50k | 10 | Web — Next.js/React Flight proto pollution → RCE | `rstcon{pr0t0typ3_p0llut10n_m3ets_r34ct_fl1ght}` | ✅ |
| 05 | Bad Medicine | 10 | Web — OSINT + SQLi (MedVault) | `rstcon{p@ss_teh_hydrocod0n3_brah}` | ✅ |
| 06 | Do Not Service | 400 | Forensics — DNS exfil trong pcap | `rstcon{d0main_n@m3_EXPansi0n}` | ✅ |
| 07 | Universal Suffering Begins (USB) | 370 | Forensics — USB bus capture → IPP/URF in ấn | `rstcon{UR3_1t_0r_l0s3_1t}` | ✅ |
| 08 | Reassemble Me! | 450 | Forensics — ghép mảnh (chưa xong) | — | — |
| 09 | outlet | ? | Pwn — ARM aarch64 static ELF (chưa giải) | — | — |
| 10 | Eight Valves | 280 | Esolang / Rev (`valves.bf`) | *(xem writeup)* | ✅ |
| 11 | New Money | 300 | Web / Crypto — Caps Lotto-Matic | *(xem writeup)* | ✅ |
| 12 | Shallow Exponent | 240 | Crypto — RSA mũ nhỏ | *(xem writeup)* | ✅ |
| 13 | Truck-kun | 10 | Rev — Game Godot | `rstcon{reborn-in-another-world-but-im-playing-ctfs}` | ✅ |
| 14 | thought_slop | ? | Pwn — Format string qua output LLM (llama.cpp) | `rstcon{nice_flag_bro}` | ✅ |
| 15 | carry | ? | Pwn — aarch64 ELF (chưa giải) | — | — |
| 16 | CAN bus | ? | Forensics — candump.log (chưa giải) | — | — |

## Ghi chú dung lượng

Các file capture quá lớn vượt giới hạn GitHub **không được push**, vẫn giữ trên máy (`D:\ctf`):

- `07_universal_suffering_usb/data.pcap` (1.9 GB) và `data.pcap.gz` (437 MB) — capture USB gốc
- `06_do_not_service/odd_transmission.pcapng` (51 MB) — bản giải nén (bản `.gz` 47 MB có trên repo)

Mọi artifact nhỏ (ảnh URF render, stream đã tách, script phân tích) đều có trên repo.
