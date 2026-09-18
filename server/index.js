import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: "25mb" }));

const PORT = process.env.PORT || 3001;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const MODEL_NAME = process.env.GEMINI_MODEL || "gemini-3.6-flash";
const APPS_SCRIPT_URL = process.env.APPS_SCRIPT_URL;
const SHEETS_SECRET = process.env.SHEETS_SECRET || "";

const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;

const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    is_soil_photo: { type: "boolean" },
    soil_type: { type: "string" },
    color_texture_observations: { type: "array", items: { type: "string" } },
    health_assessment: { type: "string" },
    health_score: { type: "integer" },
    concerns: { type: "array", items: { type: "string" } },
    recommendations: { type: "array", items: { type: "string" } },
    suggested_additional_inputs: { type: "array", items: { type: "string" } },
    suitable_crops: { type: "array", items: { type: "string" } },
    confidence_note: { type: "string" },
  },
  required: [
    "is_soil_photo",
    "soil_type",
    "color_texture_observations",
    "health_assessment",
    "health_score",
    "concerns",
    "recommendations",
    "suggested_additional_inputs",
    "confidence_note",
  ],
};

function buildPrompt({ location, notes }) {
  return `Bạn là một chuyên gia nông nghiệp và thổ nhưỡng học. Hãy phân tích (các) hình ảnh được cung cấp.

Thông tin bổ sung do người dùng cung cấp:
- Vị trí / khu vực: ${location || "không cung cấp"}
- Ghi chú thêm: ${notes || "không có"}

Đầu tiên, xác định is_soil_photo: true nếu (các) ảnh thực sự chụp đất/mặt đất/luống đất canh tác, false nếu ảnh không liên quan đến đất (ví dụ: người, đồ vật, ảnh mờ/lỗi, cây cối chụp toàn cảnh không thấy đất, v.v).

Nếu is_soil_photo là false: vẫn điền đủ các trường theo schema nhưng health_score = 0, các trường khác ghi ngắn gọn giải thích lý do (ví dụ soil_type = "Không xác định", confidence_note giải thích ảnh không phải đất).

Nếu is_soil_photo là true: dựa vào màu sắc, kết cấu (texture), độ ẩm nhìn thấy được, dấu hiệu xói mòn, sự hiện diện của chất hữu cơ, rễ cây, sinh vật đất, và các dấu hiệu trực quan khác trong ảnh để đánh giá chi tiết. Đây là đánh giá sơ bộ qua hình ảnh, không thay thế xét nghiệm đất trong phòng thí nghiệm.

Trả lời CHỈ bằng JSON hợp lệ theo đúng schema đã cung cấp, viết bằng tiếng Việt cho tất cả các trường văn bản. health_score là số nguyên từ 0-100 thể hiện sức khỏe tổng thể của đất ước tính qua hình ảnh. suggested_additional_inputs phải liệt kê cụ thể những thông tin/xét nghiệm người dùng nên bổ sung để có đánh giá chính xác hơn (ví dụ: đo pH đất, xét nghiệm NPK, kiểm tra khả năng thoát nước, lịch sử canh tác, lượng mưa khu vực, ánh sáng mặt trời, kiểm tra bằng phương pháp lọ thủy tinh - jar test, v.v).`;
}

function fileToGenerativePart(base64Data, mimeType) {
  const cleaned = base64Data.includes(",") ? base64Data.split(",")[1] : base64Data;
  return {
    inlineData: {
      data: cleaned,
      mimeType,
    },
  };
}

async function resolveLocation(locationText) {
  if (!locationText || !locationText.trim()) return null;

  const coordMatch = locationText.trim().match(/^(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)$/);
  if (coordMatch) {
    const lat = parseFloat(coordMatch[1]);
    const lng = parseFloat(coordMatch[2]);
    if (Math.abs(lat) <= 90 && Math.abs(lng) <= 180) return { lat, lng };
  }

  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(locationText)}`;
    const res = await fetch(url, {
      headers: { "User-Agent": "SoilScan/1.0 (community soil map)" },
    });
    if (!res.ok) return null;
    const results = await res.json();
    if (results?.[0]) {
      return { lat: parseFloat(results[0].lat), lng: parseFloat(results[0].lon) };
    }
  } catch (err) {
    console.error("Geocoding error:", err.message);
  }
  return null;
}

async function logToCommunityMap({ lat, lng, locationLabel, analysis }) {
  if (!APPS_SCRIPT_URL) return;
  try {
    await fetch(APPS_SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        secret: SHEETS_SECRET,
        timestamp: new Date().toISOString(),
        lat,
        lng,
        location_label: locationLabel,
        soil_type: analysis.soil_type,
        health_score: analysis.health_score,
        summary: analysis.health_assessment,
      }),
    });
  } catch (err) {
    console.error("Community map logging error:", err.message);
  }
}

app.get("/api/health", (req, res) => {
  res.json({ ok: true, configured: Boolean(GEMINI_API_KEY), mapEnabled: Boolean(APPS_SCRIPT_URL) });
});

app.get("/api/map-points", async (req, res) => {
  if (!APPS_SCRIPT_URL) {
    return res.json({ points: [] });
  }
  try {
    const response = await fetch(`${APPS_SCRIPT_URL}?action=list`);
    if (!response.ok) throw new Error(`Apps Script trả về ${response.status}`);
    const points = await response.json();
    res.json({ points });
  } catch (err) {
    console.error("Map points fetch error:", err.message);
    res.status(502).json({ error: "Không tải được dữ liệu bản đồ cộng đồng." });
  }
});

app.post("/api/analyze", async (req, res) => {
  try {
    if (!genAI) {
      return res.status(500).json({
        error: "Server chưa được cấu hình GEMINI_API_KEY. Xem README để biết cách lấy API key miễn phí.",
      });
    }

    const { images, location, notes } = req.body;

    if (!Array.isArray(images) || images.length === 0) {
      return res.status(400).json({ error: "Cần ít nhất một ảnh đất." });
    }
    if (images.length > 6) {
      return res.status(400).json({ error: "Tối đa 6 ảnh mỗi lần phân tích." });
    }

    const model = genAI.getGenerativeModel({
      model: MODEL_NAME,
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA,
      },
    });

    const imageParts = images.map((img) => fileToGenerativePart(img.data, img.mimeType || "image/jpeg"));
    const prompt = buildPrompt({ location, notes });

    const result = await model.generateContent([prompt, ...imageParts]);
    const text = result.response.text();
    const parsed = JSON.parse(text);

    res.json({ result: parsed });

    if (parsed.is_soil_photo && location) {
      const coords = await resolveLocation(location);
      if (coords) {
        await logToCommunityMap({ ...coords, locationLabel: location, analysis: parsed });
      }
    }
  } catch (err) {
    console.error("Analyze error:", err);
    if (!res.headersSent) {
      res.status(500).json({ error: "Có lỗi khi phân tích ảnh. Vui lòng thử lại." });
    }
  }
});

app.listen(PORT, () => {
  console.log(`SoilScan API listening on port ${PORT}`);
  if (!GEMINI_API_KEY) {
    console.warn("Warning: GEMINI_API_KEY chưa được thiết lập. Xem file .env.example.");
  }
});
