# RSTCON 2026 CTF Archive

Archive các challenge đã làm tại RSTCON 2026 (on-site), author chính: **Veryyes**. Mỗi folder một challenge, chứa writeup + artifact + script/screenshot.

| # | Challenge | Điểm | Category | Flag | Writeup |
|---|-----------|------|----------|------|---------|
| 01 | Template Tide | 10 | Web — SSTI | `rstcon{ssti_rolls_in_with_the_t1de}` | [✅](01_template_tide/template-tide-writeup.md) |
| 02 | Carbon Noneoxide | 10 | Pwn / Firmware (QEMU Cortex-M3) | `rstcon{y0ur_Q_my_Q}` | [✅](02_carbon_noneoxide/carbon_noneoxide_writeup.md) |
| 03 | Leaky Logger | 10 | Pwn — Format String | *(xem writeup)* | [✅](03_leaky_logger/logger_writeup.md) |
| 04 | Dow is Up 50k | 10 | Web — Next.js/React Flight proto pollution → RCE | `rstcon{pr0t0typ3_p0llut10n_m3ets_r34ct_fl1ght}` | [✅](04_dow_is_up_50k/dow_is_up_50k_writeup.md) |
| 05 | Bad Medicine | 10 | Web — OSINT + SQLi (MedVault) | `rstcon{p@ss_teh_hydrocod0n3_brah}` | [✅](05_bad_medicine/bad-medicine-writeup.md) |
| 06 | Do Not Service | 400 | Forensics — DNS exfil trong pcap | `rstcon{d0main_n@m3_EXPansi0n}` | [✅](06_do_not_service/do_not_service_writeup.md) |
| 07 | Universal Suffering Begins (USB) | 370 | Forensics — USB bus capture → IPP/URF in ấn | `rstcon{UR3_1t_0r_l0s3_1t}` | [✅](07_universal_suffering_usb/universal_suffering_usb_writeup.md) |
| 08 | Reassemble Me! | 450 | Forensics — ghép mảnh (chưa xong) | — | — |
| 09 | outlet | ? | Pwn — ARM aarch64 static ELF (chưa giải) | — | — |
| 10 | Eight Valves | 280 | Esolang / Rev (`valves.bf`) | *(xem writeup)* | [✅](10_eight_valves/eight_valves_writeup.md) |
| 11 | New Money | 300 | Web / Crypto — Caps Lotto-Matic | *(xem writeup)* | [✅](11_new_money/new_money_writeup.md) |
| 12 | Shallow Exponent | 240 | Crypto — RSA mũ nhỏ | *(xem writeup)* | [✅](12_shallow_exponent/shallow_exponent_writeup.md) |
| 13 | Truck-kun | 10 | Rev — Game Godot | `rstcon{reborn-in-another-world-but-im-playing-ctfs}` | [✅](13_truck_kun/truck-kun-writeup.md) |
| 14 | thought_slop | ? | Pwn — Format string qua output LLM (llama.cpp) | `rstcon{nice_flag_bro}` | [✅](14_thought_slop/thought_slop_writeup.md) |
| 15 | carry | ? | Pwn — aarch64 ELF (chưa giải) | — | — |
| 16 | CAN bus | ? | Forensics — candump.log (chưa giải) | — | — |

## Ghi chú dung lượng

Các file capture quá lớn vượt giới hạn GitHub **không được push**, vẫn giữ trên máy (`D:\ctf`):

- `07_universal_suffering_usb/data.pcap` (1.9 GB) và `data.pcap.gz` (437 MB) — capture USB gốc
- `06_do_not_service/odd_transmission.pcapng` (51 MB) — bản giải nén (bản `.gz` 47 MB có trên repo)

Mọi artifact nhỏ (ảnh URF render, stream đã tách, script phân tích) đều có trên repo.
