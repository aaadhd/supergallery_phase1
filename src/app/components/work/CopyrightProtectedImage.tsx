import React, { useCallback } from 'react';
import { ImageWithFallback } from '../figma/ImageWithFallback';

interface CopyrightProtectedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  /** 우클릭 방지 여부 */
  preventRightClick?: boolean;
  /** 드래그 방지 여부 */
  preventDrag?: boolean;
}

export function CopyrightProtectedImage({
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


    </div>
  );
}
