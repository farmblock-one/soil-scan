# SoilScan 🌱

Ứng dụng web cho phép người dùng chụp/tải lên ảnh đất, nhập vị trí, và nhận đánh giá + kiến nghị cải tạo đất từ AI (Google Gemini Vision). Kết quả có vị trí sẽ được gom vào **bản đồ sức khỏe đất cộng đồng** (dạng như Google Reviews, xem mục 6).

**Web app:** https://farmblock-one.github.io/soil-scan/ (frontend, tĩnh trên GitHub Pages)
**Backend API:** deploy trên Render.com — xem hướng dẫn bên dưới.

## Kiến trúc

- `client/` — React + Vite + TypeScript + Tailwind CSS. Deploy tĩnh lên **GitHub Pages**.
- `server/` — Express API, nhận ảnh (base64) + vị trí + ghi chú, gọi Google Gemini Vision API bằng key giữ ở server, trả JSON đã phân tích. Deploy lên **Render.com** (free tier). Frontend gọi tới backend qua URL cấu hình trong biến môi trường `VITE_API_URL` lúc build.

API key Gemini **chỉ nằm trên server**, không xuất hiện trong code frontend hay bị lộ cho người dùng — đúng như thiết kế ban đầu.

## 1. Lấy API key Gemini miễn phí

1. Vào https://aistudio.google.com/app/apikey
2. Đăng nhập bằng tài khoản Google, tạo API key mới (không cần thẻ tín dụng).
3. Xem hạn mức free tier mới nhất tại https://ai.google.dev/pricing.

## 2. Deploy backend lên Render (một lần)

1. Vào https://render.com, đăng ký tài khoản miễn phí (không cần thẻ).
2. Chọn **New → Blueprint**, kết nối GitHub và chọn repo `farmblock-one/soil-scan`. Render sẽ tự đọc file `render.yaml` ở gốc repo và tạo sẵn service `soil-scan-api`.
3. Khi được hỏi biến môi trường `GEMINI_API_KEY`, dán API key Gemini của bạn vào (Render lưu kín, không public).
4. Bấm **Apply/Deploy**. Sau khi build xong, Render cho bạn 1 URL dạng `https://soil-scan-api-xxxx.onrender.com`.
5. Kiểm tra: mở `https://soil-scan-api-xxxx.onrender.com/api/health` — thấy `{"ok":true,"configured":true}` là backend đã sẵn sàng.

> Lưu ý: gói free của Render sẽ "ngủ" sau ~15 phút không có request, lần gọi đầu tiên sau đó có thể mất 30–60 giây để backend khởi động lại — đây là giới hạn của free tier, không phải lỗi.

## 3. Trỏ frontend vào backend đã deploy

Sau khi có URL backend ở bước trên, build frontend với biến môi trường `VITE_API_URL` trỏ tới URL đó:

```bash
cd client
VITE_API_URL=https://soil-scan-api-xxxx.onrender.com npm run build
```

Sau đó publish thư mục `dist/` lên nhánh `gh-pages` (đã được cấu hình sẵn cho repo này). Nếu bạn nhờ Claude làm bước deploy, chỉ cần gửi Claude URL backend từ bước 2 để cập nhật và publish lại.

## 4. Chạy ở máy local (để phát triển)

```bash
# Terminal 1: backend
cd server
npm install
cp .env.example .env   # dán GEMINI_API_KEY vào
npm run dev             # chạy tại http://localhost:3001

# Terminal 2: frontend
cd client
npm install
npm run dev              # chạy tại http://localhost:5173, tự proxy /api sang cổng 3001
```

## 5. Sử dụng

1. Chụp hoặc tải lên 1–6 ảnh đất (nên chụp nhiều góc: bề mặt, mặt cắt nếu có, khu vực xung quanh).
2. (Tùy chọn) Nhập vị trí bằng GPS hoặc gõ tên khu vực.
3. (Tùy chọn) Ghi chú thêm: cây trồng dự định, mùa vụ, lịch sử canh tác...
4. Nhấn "Phân tích đất" để nhận:
   - Loại đất ước tính, điểm sức khỏe đất (0–100)
   - Quan sát về màu sắc/kết cấu
   - Vấn đề cần lưu ý
   - Kiến nghị hành động cải tạo
   - **Các thông tin/xét nghiệm nên bổ sung** (đo pH, NPK, jar test, lượng mưa...) để có đánh giá chính xác hơn
   - Gợi ý cây trồng phù hợp (nếu có vị trí)

Lưu ý: Đây là đánh giá sơ bộ qua hình ảnh bằng AI, mang tính tham khảo — không thay thế xét nghiệm đất chuyên nghiệp trong phòng thí nghiệm.

## 6. Bản đồ cộng đồng (tùy chọn)

Mỗi khi ai đó phân tích đất kèm vị trí, và ảnh được AI xác nhận đúng là ảnh đất (không phải ảnh linh tinh), kết quả (loại đất, điểm sức khỏe, tóm tắt — **không kèm ảnh**) sẽ được ghi vào 1 Google Sheet và hiển thị thành điểm trên bản đồ ở tab "Bản đồ cộng đồng". Dữ liệu gom qua **Google Apps Script** (miễn phí, không cần Google Cloud Console):

1. Tạo 1 Google Sheet mới (trống).
2. Vào **Extensions → Apps Script**, xóa code mẫu, dán toàn bộ nội dung file [`apps-script/Code.gs`](apps-script/Code.gs) trong repo này vào.
3. Trong code vừa dán, đổi dòng `const SECRET = "REPLACE_WITH_YOUR_SHEETS_SECRET";` thành một chuỗi bí mật tự chọn (bất kỳ, dùng để chặn người lạ gửi rác vào Sheet).
4. Bấm **Deploy → New deployment** → chọn loại **Web app** → Execute as: **Me**, Who has access: **Anyone** → Deploy. Cấp quyền khi được hỏi.
5. Copy **URL Web app** (dạng `https://script.google.com/macros/s/xxxxx/exec`).
6. Vào Render → service `soil-scan-api` → **Environment**, thêm 2 biến:
   - `APPS_SCRIPT_URL` = URL vừa copy
   - `SHEETS_SECRET` = đúng chuỗi bí mật đã đặt ở bước 3
7. Render tự deploy lại. Kiểm tra: `GET https://soil-scan-api-xxxx.onrender.com/api/health` phải thấy `"mapEnabled":true`.

Nếu không thiết lập bước này, tab "Bản đồ cộng đồng" vẫn hiển thị bình thường nhưng luôn rỗng — không có gì lỗi.

## Cấu trúc thư mục

```
soil-scan/
├── render.yaml       # Render Blueprint để deploy server/ bằng 1 click
├── apps-script/
│   └── Code.gs        # dán vào Google Apps Script để làm backend cho Sheet (bản đồ cộng đồng)
├── client/           # React frontend (deploy lên GitHub Pages)
│   └── src/
│       ├── components/
│       │   └── CommunityMap.tsx   # tab bản đồ, dùng Leaflet + OpenStreetMap (miễn phí)
│       ├── App.tsx
│       ├── config.ts     # đọc VITE_API_URL để biết gọi backend ở đâu
│       ├── history.ts
│       └── types.ts
└── server/           # Express backend (deploy lên Render, giữ GEMINI_API_KEY)
    └── index.js       # /api/analyze, /api/map-points, ghi vào Sheet qua Apps Script
```
