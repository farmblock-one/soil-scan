# SoilScan 🌱

Ứng dụng web cho phép người dùng chụp/tải lên ảnh đất, nhập vị trí, và nhận đánh giá + kiến nghị cải tạo đất từ AI (Google Gemini Vision).

## Kiến trúc

- `client/` — React + Vite + TypeScript + Tailwind CSS. Giao diện chụp/tải nhiều ảnh, nhập vị trí (GPS hoặc thủ công), ghi chú, hiển thị kết quả phân tích, lưu lịch sử trong `localStorage`.
- `server/` — Express API nhỏ, nhận ảnh (base64) + vị trí + ghi chú, gọi Google Gemini Vision API, trả về JSON có cấu trúc. API key được giữ ở backend, không lộ ra frontend.

## 1. Lấy API key Gemini miễn phí

1. Vào https://aistudio.google.com/app/apikey
2. Đăng nhập bằng tài khoản Google, tạo API key mới (không cần thẻ tín dụng).
3. Gemini có free tier với hạn mức yêu cầu/phút và /ngày — đủ dùng để thử nghiệm và dùng cá nhân. Xem hạn mức mới nhất tại https://ai.google.dev/pricing.

## 2. Cài đặt & chạy backend

```bash
cd server
npm install
cp .env.example .env
# Mở .env và dán GEMINI_API_KEY vừa tạo vào
npm run dev
```

Backend chạy tại `http://localhost:3001`. Kiểm tra: `curl http://localhost:3001/api/health`.

## 3. Cài đặt & chạy frontend

```bash
cd client
npm install
npm run dev
```

Mở trình duyệt tại địa chỉ Vite in ra (mặc định `http://localhost:5173`). Frontend tự động proxy các request `/api/*` sang backend ở cổng 3001 (cấu hình trong `vite.config.ts`).

## 4. Sử dụng

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

## Triển khai (deploy) miễn phí (gợi ý)

- Backend: Render.com / Fly.io free tier (nhớ set biến môi trường `GEMINI_API_KEY`).
- Frontend: Vercel / Netlify / Cloudflare Pages (build lệnh `npm run build`, thư mục output `dist`), trỏ `/api` sang URL backend đã deploy.

## Cấu trúc thư mục

```
soil-scan/
├── client/          # React frontend
│   └── src/
│       ├── components/
│       ├── App.tsx
│       ├── history.ts
│       └── types.ts
└── server/          # Express backend
    └── index.js
```
