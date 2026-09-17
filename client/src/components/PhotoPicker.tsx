import { useRef } from "react";
import type { SoilPhoto } from "../types";

const MAX_PHOTOS = 6;

interface Props {
  photos: SoilPhoto[];
  onChange: (photos: SoilPhoto[]) => void;
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function PhotoPicker({ photos, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    const remainingSlots = MAX_PHOTOS - photos.length;
    const files = Array.from(fileList).slice(0, remainingSlots);

    const newPhotos: SoilPhoto[] = await Promise.all(
      files.map(async (file) => ({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        dataUrl: await readFileAsDataUrl(file),
        mimeType: file.type || "image/jpeg",
      }))
    );

    onChange([...photos, ...newPhotos]);
    if (inputRef.current) inputRef.current.value = "";
  }

  function removePhoto(id: string) {
    onChange(photos.filter((p) => p.id !== id));
  }

  return (
    <div>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
        {photos.map((photo) => (
          <div key={photo.id} className="relative aspect-square overflow-hidden rounded-lg border border-stone-200">
            <img src={photo.dataUrl} alt="Ảnh đất" className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => removePhoto(photo.id)}
              className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-sm text-white hover:bg-black/80"
              aria-label="Xóa ảnh"
            >
              ×
            </button>
          </div>
        ))}

        {photos.length < MAX_PHOTOS && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex aspect-square flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-stone-300 text-stone-500 hover:border-green-600 hover:text-green-700"
          >
            <span className="text-2xl">+</span>
            <span className="text-xs">Thêm ảnh</span>
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      <p className="mt-2 text-xs text-stone-500">
        Đã chọn {photos.length}/{MAX_PHOTOS} ảnh. Chụp nhiều góc (bề mặt, cắt lớp đất nếu có, khu vực xung quanh) để có đánh giá chính xác hơn.
      </p>
    </div>
  );
}
