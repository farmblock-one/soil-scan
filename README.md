# SoilScan 🌱

Ứng dụng web cho phép người dùng chụp/tải lên ảnh đất, nhập vị trí, và nhận đánh giá + kiến nghị cải tạo đất từ AI (Google Gemini Vision).

**Dùng thử ngay:** https://farmblock-one.github.io/soil-scan/ (cần tự nhập Gemini API key miễn phí của bạn — xem hướng dẫn bên dưới)

## Kiến trúc

- `client/` — React + Vite + TypeScript + Tailwind CSS. Đây là toàn bộ app: chụp/tải nhiều ảnh, nhập vị trí (GPS hoặc thủ công), ghi chú, gọi thẳng Gemini API từ trình duyệt, hiển thị kết quả, lưu lịch sử trong `localStorage`. Được deploy tĩnh lên **GitHub Pages** — không cần server.
- `server/` — Express API tùy chọn (không bắt buộc). Nếu bạn muốn giấu API key ở phía server thay vì để người dùng tự nhập, có thể tự host backend này và trỏ frontend gọi qua đó thay vì gọi thẳng Gemini. Không được dùng bởi bản GitHub Pages.

### Vì sao client gọi thẳng Gemini thay vì qua backend?

GitHub Pages chỉ host được file tĩnh (HTML/CSS/JS), không chạy được server Node để giấu API key. Vì vậy bản deploy trên GitHub Pages cho mỗi người dùng tự nhập API key Gemini của họ — key chỉ lưu trong `localStorage` của trình duyệt người dùng đó và được gửi thẳng từ trình duyệt tới Google, không đi qua máy chủ nào của dự án này, không nằm trong mã nguồn public. Nếu bạn muốn giấu key hẳn (ví dụ deploy nội bộ cho một nhóm dùng chung 1 key), dùng `server/` và deploy backend riêng (xem phần "Chạy với backend" bên dưới).

## 1. Lấy API key Gemini miễn phí

1. Vào https://aistudio.google.com/app/apikey
2. Đăng nhập bằng tài khoản Google, tạo API key mới (không cần thẻ tín dụng).
3. Gemini có free tier với hạn mức yêu cầu/phút và /ngày — đủ dùng để thử nghiệm và dùng cá nhân. Xem hạn mức mới nhất tại https://ai.google.dev/pricing.

## 2. Dùng ngay trên GitHub Pages

1. Mở https://farmblock-one.github.io/soil-scan/
2. Dán API key Gemini của bạn vào ô "Nhập Gemini API key" (chỉ cần làm 1 lần, trình duyệt sẽ nhớ).
3. Chụp/tải ảnh đất, nhập vị trí (tùy chọn), nhấn "Phân tích đất".

## 3. Chạy ở máy local (để phát triển)

```bash
cd client
npm install
npm run dev
```

Mở địa chỉ Vite in ra (mặc định `http://localhost:5173`), nhập API key trong app như trên.

## 4. Chạy với backend (tùy chọn, để giấu API key)

```bash
cd server
npm install
cp .env.example .env
# Mở .env và dán GEMINI_API_KEY vào
npm run dev
```

Backend chạy tại `http://localhost:3001`, có endpoint `POST /api/analyze` nhận `{ images, location, notes }` và trả JSON phân tích — tự nối vào frontend của bạn nếu muốn dùng theo hướng này thay vì nhập key trực tiếp trong trình duyệt.

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
├── client/          # React frontend (deploy lên GitHub Pages)
│   └── src/
│       ├── components/
│       ├── App.tsx
│       ├── gemini.ts    # gọi Gemini API trực tiếp từ trình duyệt
│       ├── history.ts
│       └── types.ts
└── server/          # Express backend tùy chọn (không dùng cho bản GitHub Pages)
    └── index.js
```
