import type { SoilAnalysisResult, SoilPhoto } from "./types";

const API_KEY_STORAGE = "soilscan_gemini_api_key";
const DEFAULT_MODEL = "gemini-3.6-flash";

export function loadApiKey(): string {
  try {
    return localStorage.getItem(API_KEY_STORAGE) || "";
  } catch {
    return "";
  }
}

export function saveApiKey(key: string): void {
  try {
    if (key) localStorage.setItem(API_KEY_STORAGE, key);
    else localStorage.removeItem(API_KEY_STORAGE);
  } catch {
    // localStorage unavailable; key just won't persist across reloads.
  }
}

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

function buildPrompt(location: string, notes: string) {
  return `Bạn là một chuyên gia nông nghiệp và thổ nhưỡng học. Hãy phân tích (các) hình ảnh đất được cung cấp và đưa ra đánh giá chi tiết.

Thông tin bổ sung do người dùng cung cấp:
- Vị trí / khu vực: ${location || "không cung cấp"}
- Ghi chú thêm: ${notes || "không có"}

Hãy dựa vào màu sắc, kết cấu (texture), độ ẩm nhìn thấy được, dấu hiệu xói mòn, sự hiện diện của chất hữu cơ, rễ cây, sinh vật đất, và các dấu hiệu trực quan khác trong ảnh để đánh giá. Lưu ý rằng đây là đánh giá sơ bộ qua hình ảnh, không thay thế xét nghiệm đất trong phòng thí nghiệm.

Trả lời CHỈ bằng JSON hợp lệ theo đúng schema đã cung cấp, viết bằng tiếng Việt cho tất cả các trường văn bản. health_score là số nguyên từ 0-100 thể hiện sức khỏe tổng thể của đất ước tính qua hình ảnh. suggested_additional_inputs phải liệt kê cụ thể những thông tin/xét nghiệm người dùng nên bổ sung để có đánh giá chính xác hơn (ví dụ: đo pH đất, xét nghiệm NPK, kiểm tra khả năng thoát nước, lịch sử canh tác, lượng mưa khu vực, ánh sáng mặt trời, kiểm tra bằng phương pháp lọ thủy tinh - jar test, v.v).`;
}

export async function analyzeSoil(
  photos: SoilPhoto[],
  location: string,
  notes: string,
  apiKey: string
): Promise<SoilAnalysisResult> {
  const parts: unknown[] = [
    { text: buildPrompt(location, notes) },
    ...photos.map((p) => ({
      inlineData: {
        mimeType: p.mimeType,
        data: p.dataUrl.includes(",") ? p.dataUrl.split(",")[1] : p.dataUrl,
      },
    })),
  ];

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${DEFAULT_MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: RESPONSE_SCHEMA,
        },
      }),
    }
  );

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const message = body?.error?.message || `Lỗi ${response.status} khi gọi Gemini API.`;
    throw new Error(message);
  }

  const body = await response.json();
  const text = body?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error("Gemini không trả về kết quả hợp lệ. Vui lòng thử lại.");
  }

  return JSON.parse(text) as SoilAnalysisResult;
}
