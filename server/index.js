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
const MODEL_NAME = process.env.GEMINI_MODEL || "gemini-2.0-flash";

const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;

const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
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
  return `Bạn là một chuyên gia nông nghiệp và thổ nhưỡng học. Hãy phân tích (các) hình ảnh đất được cung cấp và đưa ra đánh giá chi tiết.

Thông tin bổ sung do người dùng cung cấp:
- Vị trí / khu vực: ${location || "không cung cấp"}
- Ghi chú thêm: ${notes || "không có"}

Hãy dựa vào màu sắc, kết cấu (texture), độ ẩm nhìn thấy được, dấu hiệu xói mòn, sự hiện diện của chất hữu cơ, rễ cây, sinh vật đất, và các dấu hiệu trực quan khác trong ảnh để đánh giá. Lưu ý rằng đây là đánh giá sơ bộ qua hình ảnh, không thay thế xét nghiệm đất trong phòng thí nghiệm.

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

app.get("/api/health", (req, res) => {
  res.json({ ok: true, configured: Boolean(GEMINI_API_KEY) });
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
  } catch (err) {
    console.error("Analyze error:", err);
    res.status(500).json({ error: "Có lỗi khi phân tích ảnh. Vui lòng thử lại." });
  }
});

app.listen(PORT, () => {
  console.log(`SoilScan API listening on port ${PORT}`);
  if (!GEMINI_API_KEY) {
    console.warn("Warning: GEMINI_API_KEY chưa được thiết lập. Xem file .env.example.");
  }
});
