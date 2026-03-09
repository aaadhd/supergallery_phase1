import React, { useCallback } from 'react';
import { ImageWithFallback } from '../figma/ImageWithFallback';

interface CopyrightProtectedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  /** 저작권자/작품 정보 (워터마크 텍스트) */
  watermarkText?: string;
  /** 워터마크 표시 여부 */
  showWatermark?: boolean;
  /** 우클릭 방지 여부 */
  preventRightClick?: boolean;
  /** 드래그 방지 여부 */
  preventDrag?: boolean;
}

export function CopyrightProtectedImage({
  watermarkText,
  showWatermark = true,
  preventRightClick = true,
  preventDrag = true,
  className = '',
  ...imgProps
}: CopyrightProtectedImageProps) {
  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      if (preventRightClick) {
        e.preventDefault();
      }
    },
    [preventRightClick]
  );

  const handleDragStart = useCallback(
    (e: React.DragEvent) => {
      if (preventDrag) {
        e.preventDefault();
      }
    },
    [preventDrag]
  );

  return (
    <div className="relative inline-block select-none" style={{ userSelect: preventDrag ? 'none' : undefined }}>
      <div
        onContextMenu={handleContextMenu}
        onDragStart={handleDragStart}
        className="relative"
        style={{
          WebkitUserSelect: preventDrag ? 'none' : undefined,
        }}
      >
        <ImageWithFallback className={className} {...imgProps} draggable={!preventDrag} />
      </div>

      {/* 워터마크 오버레이 */}
      {showWatermark && watermarkText && (
        <div
          className="absolute inset-0 pointer-events-none flex items-center justify-center"
          aria-hidden
        >
          <div
            className="text-white/10 text-[11px] font-medium tracking-widest whitespace-nowrap"
            style={{
              transform: 'rotate(-25deg)',
              textShadow: '0 1px 2px rgba(0,0,0,0.3)',
            }}
          >
            {watermarkText}
          </div>
        </div>
      )}
    </div>
  );
}
