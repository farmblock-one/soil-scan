import { useState } from "react";

interface Props {
  apiKey: string;
  onSave: (key: string) => void;
}

export function ApiKeySettings({ apiKey, onSave }: Props) {
  const [open, setOpen] = useState(!apiKey);
  const [draft, setDraft] = useState(apiKey);

  function handleSave() {
    onSave(draft.trim());
    setOpen(false);
  }

  if (!open) {
    return (
      <div className="flex items-center justify-between rounded-lg bg-stone-50 px-3 py-2 text-xs text-stone-500">
        <span>API key: {apiKey ? `••••${apiKey.slice(-4)}` : "chưa thiết lập"}</span>
        <button type="button" onClick={() => setOpen(true)} className="font-medium text-green-700 hover:underline">
          Đổi key
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2 rounded-lg border border-amber-200 bg-amber-50 p-3">
      <p className="text-sm font-medium text-stone-800">Nhập Gemini API key của bạn</p>
      <p className="text-xs text-stone-600">
        Lấy API key miễn phí tại{" "}
        <a
          href="https://aistudio.google.com/app/apikey"
          target="_blank"
          rel="noreferrer"
          className="font-medium text-green-700 underline"
        >
          Google AI Studio
        </a>
        . Key chỉ được lưu trong trình duyệt của bạn (localStorage) và gửi thẳng từ trình duyệt đến Google — không đi qua máy chủ nào khác. Không chia sẻ key này cho người khác.
      </p>
      <div className="flex gap-2">
        <input
          type="password"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Dán API key vào đây"
          className="flex-1 rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-green-600 focus:outline-none"
        />
        <button
          type="button"
          onClick={handleSave}
          disabled={!draft.trim()}
          className="rounded-lg bg-green-700 px-4 py-2 text-sm font-semibold text-white hover:bg-green-800 disabled:opacity-50"
        >
          Lưu
        </button>
      </div>
    </div>
  );
}
