import { useState } from "react";

interface Props {
  value: string;
  onChange: (value: string) => void;
}

export function LocationInput({ value, onChange }: Props) {
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function useCurrentLocation() {
    if (!navigator.geolocation) {
      setError("Trình duyệt không hỗ trợ định vị GPS.");
      return;
    }
    setLocating(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        onChange(`${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
        setLocating(false);
      },
      () => {
        setError("Không thể lấy vị trí. Vui lòng nhập thủ công.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-brand-darkest">Vị trí / khu vực (tùy chọn)</label>
      <div className="flex gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="VD: Đắk Lắk hoặc tọa độ GPS"
          className="flex-1 rounded-lg border border-brand-line px-3 py-2 text-sm focus:border-brand-primary focus:outline-none"
        />
        <button
          type="button"
          onClick={useCurrentLocation}
          disabled={locating}
          className="whitespace-nowrap rounded-lg border border-brand-line px-3 py-2 text-sm text-brand-darkest hover:bg-brand-bg disabled:opacity-50"
        >
          {locating ? "Đang định vị..." : "Dùng GPS"}
        </button>
      </div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
