# SoilScan 🌱

Ứng dụng web cho phép người dùng chụp/tải lên ảnh đất, nhập vị trí, và nhận đánh giá + kiến nghị cải tạo đất từ AI (Google Gemini Vision).

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

## Cấu trúc thư mục

```
soil-scan/
├── render.yaml       # Render Blueprint để deploy server/ bằng 1 click
├── client/           # React frontend (deploy lên GitHub Pages)
│   └── src/
│       ├── components/
│       ├── App.tsx
│       ├── config.ts     # đọc VITE_API_URL để biết gọi backend ở đâu
│       ├── history.ts
│       └── types.ts
└── server/           # Express backend (deploy lên Render, giữ GEMINI_API_KEY)
    └── index.js
```
