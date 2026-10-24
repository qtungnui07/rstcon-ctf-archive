# Universal Suffering Begins (USB) — Writeup

> **Category:** Forensics / Hardware
> **Points:** 470
> **Author:** Veryyes
> **Provided:** `data.pcap.gz` (~437 MB nén → **1.9 GB**, 104.6 triệu packets)

## Mô tả

> IN DATA1 ACK IN DATA1 ACK IN NACK IN NACK

Tên challenge và câu mô tả là các **gói tin mức USB vật lý**: token IN, gói dữ liệu DATA1, handshake ACK/NAK. Đây là capture toàn bộ bus USB — và "Universal Suffering Begins" viết tắt đúng ra **USB**. Nhiệm vụ: reassemble dữ liệu từ 104 triệu gói tin USB thô để tìm lại dữ liệu đã truyền.

## Flag

```
rstcon{UR3_1t_0r_l0s3_1t}
```

("USE it or lose it" — chơi chữ **URF**, Universal Raster Format)

> ⚠️ **Cạm bẫy submit**: `l0s3` dùng chữ **L thường**, hai chỗ `_1t` dùng số **1**. Trên font UI, `l` và `1` trông gần giống nhau — submit nhầm `10s3` sẽ bị Incorrect. Xác minh bằng phân tích glyph ở 600dpi: `1` có cờ chéo góc trên-trái + chân ngang dưới, còn `l` là thanh đứng trơn — hai bitmap pixel khác hẳn nhau.

## Quy trình giải

### 1. Nhận diện format pcap

File `.pcap` nhưng magic lạ. Đọc 24 byte đầu:

- Magic `a1 b2 3c 4d` = pcap **big-endian nanosecond** (không phải LE chuẩn `d4 c3 b2 a1` — parse LE sẽ ra linktype rác)
- `linktype 288` = USB (USBPcap)
- **104.600.973 packets** trong ~160 giây

Không có `tshark` trên máy, và scapy đọc từng packet quá chậm với 104 triệu gói → viết parser pcap thuần Python đọc theo **chunk 16 MB**, chỉ unpack header 16 byte/gói rồi skip data.

### 2. Phân loại gói USB thô

Mỗi "packet" trong pcap là một gói USB mức giao dịch (PID byte đầu, nibble thấp là loại, nibble cao là bù):

| PID | Số lượng | Ý nghĩa |
|---|---|---|
| NAK | 51.1M | device không có dữ liệu (polling vô ích) |
| PING/SPLIT (3B) | 50.2M | flow-control high-speed |
| SOF | 1.29M | Start of Frame |
| IN token | 1.26M | host yêu cầu dữ liệu |
| DATA0/DATA1 | ~15k | **dữ liệu thật sự** |
| ACK | 17.3k | |

Điểm mấu chốt: chỉ ~15k gói DATA là có nội dung — phần còn lại là nhiễu handshake, đúng như mô tả đề "IN DATA1 ACK ... IN NACK IN NACK".

### 3. Reassembly theo endpoint + data toggle

Hai quy tắc USB kinh điển:

1. **Gán dữ liệu**: gói DATA thuộc về token IN/OUT đứng ngay trước nó → tách thành stream độc lập theo (addr, endpoint, hướng).
2. **Bỏ retransmission**: DATA0/DATA1 phải **luân phiên**; hai DATA cùng loại liên tiếp trên một endpoint = gói gửi lại → bỏ bản trùng.

Kết quả 7 streams, trong đó 2 luồng bulk OUT lớn (addr 7, ep 3 và ep 10, ~3 MB mỗi luồng) chứa HTTP **IPP** (Internet Printing Protocol):

```
POST /ipp/print HTTP/1.1
Host: localhost:60000
User-Agent: CUPS/2.4.1 (Linux 6.2.6-76060206-generic; x86_64) IPP/2.0
```

### 4. Tách HTTP + IPP

Mỗi luồng là nhiều request nối tiếp (keep-alive), trộn cả `Content-Length` lẫn `Transfer-Encoding: chunked`. Parse tuần tự cả hai kiểu, tách từng request IPP (opcode ở byte 2-3):

- Phần lớn là `Get-Printer-Attributes` (0x000b) / `Get-Jobs` (0x0009) — nhiễu
- **4 request `Send-Document` (0x0006)** mang document thật: attribute `document-format = image/urf`, dữ liệu nằm ngay sau tag end-of-attributes `\x03`, body gửi kiểu chunked

### 5. Decode URF (UNIRAST)

Document bắt đầu bằng magic `UNIRAST\0` — raster format của AirPrint. Spec (tham khảo [urf2image](https://github.com/mbevand/urf2image)):

- File header: `UNIRAST\0` + page_count (u32 BE, đôi khi = 0 → đọc tới EOF)
- Page header 32 byte: bpp, colorspace, duplex, quality, width, height, dpi (BE) → **5100×6600 @ 600 dpi** (khổ Letter), bpp=24
- Dữ liệu dòng: **byte line-repeat** (số dòng lặp = byte+1, tối đa 256) rồi tới RLE kiểu PackBits **ngược so với tưởng tượng**:
  - `0x00–0x7F`: **repeat** — pixel kế tiếp lặp (b+1) lần
  - `0x80`: fill `0xFF` (trắng) hết dòng
  - `0x81–0xFF`: **literal** — (256−b)+1 pixel liên tiếp

Cái bẫy khiến tôi mất vài vòng: gesture quen thuộc của PackBits là "0x80+ = repeat", nhưng URF **đảo ngược** — và nếu bỏ quên byte line-repeat thì mọi dòng đều lệch. Khi đúng spec, cả 4 document đều decode **khớp tuyệt đối: 6600/6600 dòng, 0 byte thừa**.

### 6. Render và đọc flag

Render 4 trang bằng PIL → 3 trang đầu là hồ sơ y tế "MedVault" bồi bản (form đăng ký, EOB bảo hiểm), một trang troll chẩn đoán *"Lack of a rsutcon) flag lmao"*. Trang cuối — **Medical Records Request Form** — có banner (sau khi sửa BGR→RGB khi render) chứa flag lặp hai lần, kèm chữ `CONFIDENTIAL`:

```
rstcon{UR3_1t_0r_l0s3_1t}
```

### 7. Các mồi đánh lạc hướng trên bus (đã loại trừ)

Ngoài máy in (addr 7), bus còn 2 thiết bị khác — toàn bộ là realism/mồi, không chứa flag:

- **addr 6 — USB flash drive (Mass Storage, chữ ký CBW `USBC`/CSW `USBS`)**: có lệnh READ/WRITE(10) SCSI. Luồng ghi chứa một file **.docx** (zip `word/document.xml` — nội dung là báo cáo y khoa về bệnh Alzheimer, không có flag) và một **PNG screenshot** app "MedVault Health" lộ credentials `brandon`/`dQnw4G` (chỉ là câu chuyện). Luồng đọc chứa boot disk Rufus/GPT/NTFS với các MFT record stub — không có dữ liệu resident.
- **addr 5 — thiết bị nhỏ (7KB)**: các bản ghi nhị phân 8 byte, không phải ASCII.

Điểm kiểm chứng khi loại trừ: mọi nguồn đều được carve/extract thật (zip streaming-extract bằng `zlib.decompressobj`, PNG carve đến `IEND`) — không đoán mò theo tên file.

## Bài học

- **Capture USB khổng lồ**: không cần Wireshark — walk pcap bằng chunk reader thuần Python nhanh hơn PcapReader của scapy hàng chục lần; quan trọng là nhận ra endianness của magic trước khi parse bất kỳ field nào.
- **Reassembly đúng chuẩn USB**: attribution theo token đứng trước + dedupe bằng DATA0/DATA1 toggle là hai bước bắt buộc, thừa/thiếu một bytes thì cả chuỗi HTTP sau đó vỡ.
- **Đọc spec trước khi đoán mò format**: tôi mất 3 lần thử semantics RLE sai trước khi tra [urf2image](https://github.com/mbevand/urf2image) — đặc biệt URF đảo ngược quy ước PackBits quen thuộc và có byte line-repeat mà các format khác không có. Điểm kiểm chứng format đúng: decode phải consume document vừa khớp ở ranh giới dòng cuối.
- Dữ liệu nhạy cảm nhất trên bus USB thường không mã hóa — jobs in (IPP/URF) là kênh lộ tài liệu rất thật ngoài đời.
