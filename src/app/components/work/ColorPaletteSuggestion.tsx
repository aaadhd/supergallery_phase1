import { useState, useEffect } from 'react';
import { Palette } from 'lucide-react';
import { extractColorPalette, ColorPaletteResult } from '../../utils/colorPalette';
import { Button } from '../ui/button';

interface ColorPaletteSuggestionProps {
  imageUrl: string;
  workTitle: string;
  onSelectBackground?: (bgValue: string) => void;
  className?: string;
}

export function ColorPaletteSuggestion({
  imageUrl,
  workTitle,
  onSelectBackground,
  className = '',
}: ColorPaletteSuggestionProps) {
  const [result, setResult] = useState<ColorPaletteResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    extractColorPalette(imageUrl)
      .then((res) => {
        if (!cancelled) {
          setResult(res);
        }
      })
      .catch(() => {
        if (!cancelled) setResult(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [imageUrl]);

  if (loading || !result) return null;

  return (
    <div className={`rounded-xl border border-white/10 bg-black/40 backdrop-blur-sm overflow-hidden ${className}`}>
      <Button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 text-left lg:hover:bg-white/5 transition-colors"
      >
        <span className="flex items-center gap-2 text-white text-sm font-medium">
          <Palette className="h-4 w-4 text-cyan-400" />
          작품 색상 팔레트
        </span>
        <span className="text-white/60 text-xs">
          {expanded ? '접기' : '펼치기'}
        </span>
      </Button>
      {expanded && (
        <div className="px-4 pb-4 space-y-4">
          {/* 추출된 색상 */}
          <div>
            <p className="text-white/70 text-xs mb-2">작품에서 추출한 색상</p>
            <div className="flex flex-wrap gap-2">
              {result.colors.map((color, i) => (
                <div
                  key={i}
                  className="w-8 h-8 rounded-lg border border-white/20 shadow-lg"
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          </div>
          {/* 배경 제안 */}
          <div>
            <p className="text-white/70 text-xs mb-2">추천 전시 배경</p>
            <div className="grid grid-cols-4 gap-2">
              {result.suggestedBackgrounds.map((bg) => (
                <Button
                  key={bg.id}
                  onClick={() => onSelectBackground?.(bg.bgValue)}
                  className="group flex flex-col items-center gap-1.5 p-2 rounded-lg border border-white/10 lg:hover:border-cyan-500/50 lg:hover:bg-white/5 transition-all"
                >
                  <div
                    className="w-full aspect-square rounded-md border border-white/20"
                    style={{ backgroundColor: bg.bgValue }}
                  />
                  <span className="text-xs text-white/80 lg:group-hover:text-white truncate max-w-full">
                    {bg.label}
                  </span>
                </Button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
