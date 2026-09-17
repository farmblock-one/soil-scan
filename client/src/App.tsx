import { useState } from "react";
import { PhotoPicker } from "./components/PhotoPicker";
import { LocationInput } from "./components/LocationInput";
import { ResultCard } from "./components/ResultCard";
import { loadHistory, saveHistoryEntry } from "./history";
import type { HistoryEntry, SoilAnalysisResult, SoilPhoto } from "./types";

function App() {
  const [photos, setPhotos] = useState<SoilPhoto[]>([]);
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SoilAnalysisResult | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>(() => loadHistory());

  async function handleAnalyze() {
    if (photos.length === 0) {
      setError("Vui lòng chụp hoặc tải lên ít nhất một ảnh đất.");
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          images: photos.map((p) => ({ data: p.dataUrl, mimeType: p.mimeType })),
          location,
          notes,
        }),
      });

      const body = await response.json();
      if (!response.ok) {
        throw new Error(body.error || "Có lỗi xảy ra khi phân tích.");
      }

      const analysis = body.result as SoilAnalysisResult;
      setResult(analysis);

      const entry: HistoryEntry = {
        id: `${Date.now()}`,
        createdAt: new Date().toISOString(),
        location,
        notes,
        thumbnail: photos[0].dataUrl,
        result: analysis,
      };
      setHistory(saveHistoryEntry(entry));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Có lỗi không xác định.");
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setPhotos([]);
    setLocation("");
    setNotes("");
    setResult(null);
    setError(null);
  }

  return (
    <div className="min-h-screen bg-stone-100">
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto max-w-3xl px-4 py-4">
          <h1 className="text-xl font-bold text-green-800">🌱 SoilScan</h1>
          <p className="text-sm text-stone-500">Chụp ảnh đất — AI đánh giá & gợi ý cải tạo</p>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-6 px-4 py-6">
        <section className="space-y-4 rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
          <div>
            <label className="mb-1 block text-sm font-medium text-stone-700">Ảnh đất</label>
            <PhotoPicker photos={photos} onChange={setPhotos} />
          </div>

          <LocationInput value={location} onChange={setLocation} />

          <div>
            <label className="mb-1 block text-sm font-medium text-stone-700">Ghi chú thêm (tùy chọn)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="VD: cây trồng dự định, mùa vụ, lịch sử canh tác, tình trạng thoát nước..."
              rows={3}
              className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-green-600 focus:outline-none"
            />
          </div>

          {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleAnalyze}
              disabled={loading}
              className="flex-1 rounded-lg bg-green-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-800 disabled:opacity-50"
            >
              {loading ? "Đang phân tích..." : "Phân tích đất"}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="rounded-lg border border-stone-300 px-4 py-2.5 text-sm text-stone-700 hover:bg-stone-100"
            >
              Làm mới
            </button>
          </div>
        </section>

        {result && <ResultCard result={result} />}

        {history.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-stone-700">Lịch sử phân tích</h2>
            <div className="space-y-2">
              {history.map((entry) => (
                <details key={entry.id} className="rounded-lg border border-stone-200 bg-white p-3">
                  <summary className="flex cursor-pointer items-center gap-3 text-sm">
                    <img src={entry.thumbnail} alt="" className="h-10 w-10 rounded object-cover" />
                    <span className="flex-1 truncate text-stone-700">
                      {entry.result.soil_type} {entry.location && `· ${entry.location}`}
                    </span>
                    <span className="text-xs text-stone-400">
                      {new Date(entry.createdAt).toLocaleString("vi-VN")}
                    </span>
                  </summary>
                  <div className="mt-3">
                    <ResultCard result={entry.result} />
                  </div>
                </details>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export default App;
