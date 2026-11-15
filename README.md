# Grab Online — Quận 1 TP.HCM (Phiên bản Single-File 3D)

Tựa game web 3D mô phỏng giao hàng **Grab Online** lấy bối cảnh trung tâm **Quận 1, TP. Hồ Chí Minh** (tỷ lệ thu nhỏ ~1:10), đóng gói hoàn chỉnh trong **1 file HTML duy nhất** (`index.html` / `public/index.html`) sử dụng **Three.js r160**, **Tailwind CSS** và **Web Audio API**, không cần bước build.

## Tính năng chính đã nâng cấp

1. **Va chạm vật lý nghiêm ngặt (Strict AABB & Circle Collision)**
   - Toàn bộ các block nhà phố, công trình biểu tượng, bờ kè Sông Sài Gòn (33 hộp AABB) và đảo bùng binh / đài phun nước (3 vùng tròn) đều đăng ký vùng va chạm.
   - Hàm `resolveVehicleMovement(dx, dz)` kiểm tra trục `X`/`Z` trước khi cập nhật tọa độ, chặn đi xuyên nhà, trượt mượt dọc theo tường khi va chéo, bật nhẹ (bounce) kèm rung camera và hiệu ứng âm thanh va chạm.

2. **Bố cục đường phố Quận 1 chuẩn Google Maps (tỷ lệ 1:10)**
   - Trục chữ T/L đặc trưng: **Đại lộ Lê Lợi** nối **Bùng binh Chợ Bến Thành** tới **Phố đi bộ Nguyễn Huệ** và hướng ra **Đường Tôn Đức Thắng / Bến Bạch Đằng** ven **Sông Sài Gòn**.
   - Các tuyến đường xương cá & vòng xoay chính: **Nguyễn Thị Minh Khai**, **Lê Duẩn**, **Lê Thánh Tôn**, **Hàm Nghi**, **Nam Kỳ Khởi Nghĩa**, **Pasteur**, **Đồng Khởi**, **Hai Bà Trưng** và **Vòng xoay Hồ Con Rùa**.

3. **Kiến trúc 3D Procedural & Vật liệu CanvasTexture**
   - Tòa nhà văn phòng kính có lưới cửa sổ phát sáng ban đêm (`emissiveMap`), nhà phố shophouse kèm mái hiên sọc và biển hiệu Neon.
   - Các công trình nhận diện: **Chợ Bến Thành** (tháp đồng hồ 4 mặt), **Tháp Bitexco Financial Tower** (cùng sân đỗ trực thăng tầng 52), **Nhà thờ Đức Bà** (2 tháp chuông nhọn đối xứng), **Dinh Độc Lập**, **UBND TP.HCM** và **HDBank 25bis Nguyễn Thị Minh Khai**.
   - Hỗ trợ chuyển đổi 3 thời điểm ánh sáng: **Hoàng hôn**, **Đêm Neon** và **Ban ngày**.

4. **Kinh tế & Cửa hàng nâng cấp 4 cấp xe (Garage)**
   - Thu nhập VNĐ và thưởng giao đúng giờ được lưu tự động vào `localStorage` (`grab_q1_singlefile_v1`).
   - 4 cấp phương tiện nâng cấp & đổi xe trực tiếp trên đường:
     1. **Xe số phổ thông (Wave / Dream)** — `0đ` (Mặc định)
     2. **Xe tay ga (AirBlade / Vision)** — `150.000đ` (`+25% Tốc độ`)
     3. **Xe tay ga cao cấp (SH / Vespa độ)** — `400.000đ` (`+20% Tiền Tip`)
     4. **Mô tô Phân khối lớn (Sportbike Grab)** — `1.000.000đ` (`Tốc độ x2`, bô đôi mạ crom, vệt sáng Neon)

5. **Mini-map phong cách Google Maps & Giao thông AI**
   - Mini-map 2D hiển thị khối phố, công viên, sông Sài Gòn, nhãn địa danh, tuyến GPS xanh dương, vị trí tài xế và **15 tài xế ảo** di chuyển dọc theo đồ thị `WAYPOINTS` ngoài lòng đường.

## Cách chạy

### Cách 1: Mở qua Live Server / HTTP Static Server (Khuyên dùng)
Do dùng `<script type="importmap">`, cần mở qua HTTP thay vì `file://`:

```bash
npm install
npm start
```

Hoặc chạy bằng Bun:

```bash
bun server.js
```

Sau đó mở trình duyệt tại `http://localhost:3000`.

### Cách 2: Mở file standalone
File `index.html` ở thư mục gốc hoàn toàn giống `public/index.html`, bạn có thể chạy trực tiếp bằng VS Code **Live Server** hoặc bất kỳ static host nào (`npx serve`, Cloudflare Pages, GitHub Pages, Vercel).

## Điều khiển

| Phím / Thao tác | Chức năng |
| :--- | :--- |
| `W A S D` / `Mũi tên` | Lái xe tiến / lùi / rẽ trái / rẽ phải |
| `Shift` | Tăng tốc / Nitro |
| `Space` | Phanh gấp |
| `Kéo chuột` / `Lăn chuột` | Xoay góc nhìn camera / Zoom gần xa |
| `E` | Nhận đơn / Chốt giao đơn khi vào vòng sáng |
| `G` | Mở / đóng Cửa hàng nâng cấp xe (Garage) |
| `H` | Bấm còi xe |
| Điện thoại | Hỗ trợ joystick cảm ứng & nút **NHẬN / XÁC NHẬN** trên màn hình |
