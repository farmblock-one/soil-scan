import type { SoilAnalysisResult } from "../types";

function healthColor(score: number) {
  if (score >= 70) return "text-brand-dark bg-brand-lighter/60";
  if (score >= 40) return "text-amber-700 bg-amber-100";
  return "text-red-700 bg-red-100";
}

function Section({ title, items }: { title: string; items?: string[] }) {
  if (!items || items.length === 0) return null;
  return (
    <div>
      <h3 className="mb-2 font-display text-sm font-semibold text-brand-darkest">{title}</h3>
      <ul className="list-disc space-y-1 pl-5 text-sm text-brand-darkest/90">
        {items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

export function ResultCard({ result }: { result: SoilAnalysisResult }) {
  return (
    <div className="space-y-5 rounded-xl border border-brand-line bg-brand-surface p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-brand-muted">Loại đất ước tính</p>
          <p className="font-display text-lg font-semibold text-brand-darkest">{result.soil_type}</p>
        </div>
        <div className={`flex flex-col items-center rounded-lg px-4 py-2 ${healthColor(result.health_score)}`}>
          <span className="font-display text-2xl font-bold">{result.health_score}</span>
          <span className="text-[10px] font-medium">/ 100 sức khỏe</span>
        </div>
      </div>

      <p className="text-sm leading-relaxed text-brand-darkest/90">{result.health_assessment}</p>

      <Section title="Quan sát về màu sắc & kết cấu" items={result.color_texture_observations} />
      <Section title="Vấn đề cần lưu ý" items={result.concerns} />
      <Section title="Kiến nghị hành động" items={result.recommendations} />
      <Section
        title="Nên bổ sung thông tin/xét nghiệm sau để đánh giá chính xác hơn"
        items={result.suggested_additional_inputs}
      />
      <Section title="Cây trồng phù hợp gợi ý" items={result.suitable_crops} />

      <p className="rounded-lg bg-brand-bg p-3 text-xs italic text-brand-muted">{result.confidence_note}</p>
    </div>
  );
}
