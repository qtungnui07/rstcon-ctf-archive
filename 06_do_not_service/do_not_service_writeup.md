# Do Not Service (Odd Transmission) — Writeup

> **Category:** Forensics / Network
> **Points:** 400
> **Author:** Veryyes
> **Provided:** `odd_transmission.pcapng.gz` (~46 MB nén, ~51 MB giải nén)

## Mô tả

> The new IT guy said not to use this computer, I used it anyways.

Tên challenge "Do Not Service" là chơi chữ của **DNS — Domain Name Service** → gợi ý ngay rằng dữ liệu bị rò rỉ qua kênh DNS. Câu chuyện "IT nói đừng dùng máy này mà vẫn dùng" cho thấy có người đã dùng máy để **exfiltrate dữ liệu ra ngoài qua DNS tunneling** — kỹ thuật rất được ưa chuộng vì query DNS trông vô hại và hòa lẫn vào traffic bình thường.

## Flag

```
rstcon{d0main_n@m3_EXPansi0n}
```

## Quy trình giải

### 1. Giải nén và khảo sát tổng quan

```bash
$ gunzip -k odd_transmission.pcapng.gz   # → odd_transmission.pcapng, 51,242,036 bytes
```

Máy không có `tshark` nên dùng **scapy** (`PcapReader`) để duyệt gói tin. Tổng cộng **62,887 packets**.

Thống kê theo port/protocol cho thấy đây là một bản capture traffic "thật" với rất nhiều nhiễu:

| Traffic | Packets | Ghi chú |
|---|---|---|
| TCP/UDP 443 | ~23,500 | HTTPS, QUIC — không đọc được nội dung |
| mDNS (5353) | 1,000 | Spotify Connect, AirPlay, HomeKit... |
| UDP 53 | 559 | **DNS — đúng hướng hint** |
| Còn lại | hàng chục port hiệu suất cao | streaming, telemetry, ads... |

### 2. Lọc DNS query tìm dấu exfiltration

Hint "Do Not Service" + đặc trưng của DNS exfil là **subdomain dài, chứa dữ liệu encoded** (base32/base64/hex) trước một domain thật. Lấy toàn bộ **296 query duy nhất**, lọc những query có label dài hơn 30 ký tự:

```python
from scapy.all import PcapReader, DNSQR

seen = set()
with PcapReader('odd_transmission.pcapng') as pr:
    for pkt in pr:
        if DNSQR in pkt:
            seen.add(pkt[DNSQR].qname.decode(errors='replace').rstrip('.'))

susp = [q for q in seen if any(len(l) > 30 for l in q.split('.'))]
for q in susp:
    print(q)
```

Kết quả 5 query khớp, trong đó 4 cái là hostname hợp lệ (Google safeframe hash, ELB AWS, mDNS):

```
7fc752a93d3746678e4379bbcb0d8881.safeframe.googlesyndication.com   ← hash MD5 thật của Google
privacycollector-production-457481513.us-east-1.elb.amazonaws.com   ← ELB thật
ef7de0ebf711a349919b5c27ef2fa4e0._cros_p2p._tcp.local              ← mDNS ChromeOS
www.AB1yc3Rjb257ZDBtYWluX25AbTNfRVhQYW5zaTBufQ==.com               ← 🎯 lạ nhất: có padding "=="
```

`www.AB1yc3Rjb257ZDBtYWluX25AbTNfRVhQYW5zaTBufQ==.com` là query khả nghi nhất:
- Subdomain chứa **padding `==` đặc trưng base64** — không domain thật nào làm vậy.
- Domain gốc `.com` đứng trước là `www.` — vỏ bọc để trông giống truy cập web bình thường.

### 3. Decode

```python
import base64
print(base64.b64decode("AB1yc3Rjb257ZDBtYWluX25AbTNfRVhQYW5zaTBufQ=="))
# b'\x00\x1drstcon{d0main_n@m3_EXPansi0n}'
```

Flag nằm trọn trong một query duy nhất. Hai byte đầu `\x00\x1d` là **2-byte big-endian length header** — `0x001d = 29` đúng bằng độ dài của `rstcon{d0main_n@m3_EXPansi0n}` (29 ký tự). Đây là cách nhiều tool DNS exfil đóng gói chunk (độ dài + payload), xác nhận đây là dữ liệu exfiltrate chứ không phải trùng hợp.

```
rstcon{d0main_n@m3_EXPansi0n}
```

Tên flag cũng tự trúng đề: *domain name expansion* — nhét payload vào phần mở rộng của tên miền.

## Bài học

- **DNS exfil detection**: với traffic thật có nhiễu, cách lọc hiệu quả nhất là tìm query có **label dài bất thường** hoặc chứa ký tự base64/base32 (padding `=`, chữ hoa thường lẫn lộn, số). Chỉ cần một dòng list-comprehension là tách được khỏi hàng trăm hostname thật.
- Hash 32-hex của Google safeframe hay tên ELB dài của AWS là **đánh lừa phổ biến** — chúng cũng "dài và lạ" nhưng là hostname hợp lệ; padding `==` mới là manh mối phân biệt thật.
- Tool chỉ cần scapy, không cần tshark/Wireshark GUI — PcapReader đọc streaming nên 51MB pcap vẫn nhanh.
