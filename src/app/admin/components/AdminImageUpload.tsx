import { useRef, useState } from 'react';
import { ImageWithFallback } from '../../components/ImageWithFallback';

interface AdminImageUploadProps {
  value: string;
  onChange: (dataUrl: string) => void;
  label: string;
  required?: boolean;
}

async function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const MAX = 1200;
      let { width, height } = img;
      if (width > MAX || height > MAX) {
        if (width > height) { height = Math.round((height / width) * MAX); width = MAX; }
        else { width = Math.round((width / height) * MAX); height = MAX; }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) { reject(new Error('canvas context unavailable')); return; }
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = reject;
    img.src = objectUrl;
  });
}

export function AdminImageUpload({ value, onChange, label, required }: AdminImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) return;
    setLoading(true);
    try {
      const dataUrl = await compressImage(file);
      onChange(dataUrl);
    } finally {
      setLoading(false);
    }
  };

  const open = () => {
    if (loading) return;
    inputRef.current?.click();
  };

  return (
    <div>
      <p className="text-xs text-muted-foreground mb-1">
        {label}{required && <span className="text-destructive ml-0.5">*</span>}
      </p>
      <div className="flex gap-3 items-start">
        {value && (
          <div className="w-24 h-16 rounded-lg overflow-hidden border border-border shrink-0 bg-muted">
            <ImageWithFallback src={value} alt="" className="w-full h-full object-cover" />
          </div>
        )}
        <div className="flex flex-col gap-1.5">
          <button
            type="button"
            onClick={open}
            disabled={loading}
            className="text-sm px-3 py-1.5 rounded-lg border border-border bg-white text-foreground lg:hover:bg-muted/40 disabled:opacity-50 w-fit"
          >
            {loading ? '처리 중…' : value ? '이미지 변경' : '이미지 선택'}
          </button>
          {value && (
            <button
              type="button"
              onClick={() => onChange('')}
              className="text-xs text-muted-foreground lg:hover:text-destructive w-fit"
            >
              제거
            </button>
          )}
        </div>
      </div>
      {/* sr-only: display:none 아님 — 브라우저 보안 제한 없이 .click() 동작 */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }}
      />
    </div>
  );
}
