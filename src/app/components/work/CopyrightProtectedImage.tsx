import React, { useCallback } from 'react';
import { ImageWithFallback } from '../ImageWithFallback';

interface CopyrightProtectedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  /** 우클릭 방지 여부 */
  preventRightClick?: boolean;
  /** 드래그 방지 여부 */
  preventDrag?: boolean;
  /** 외부 래퍼 div에 추가할 클래스 */
  wrapperClassName?: string;
  /** 래퍼가 부모를 꽉 채우게 함 (w-full h-full block) */
  fill?: boolean;
}

export function CopyrightProtectedImage({
  preventRightClick = true,
  preventDrag = true,
  className = '',
  wrapperClassName = '',
  fill = false,
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
    <div
      className={`relative select-none ${fill ? 'block w-full h-full' : 'inline-block'} ${wrapperClassName}`}
      style={{
        userSelect: preventDrag ? 'none' : undefined,
        // Policy §26.1: 모바일 길게 누르기 시스템 메뉴(이미지 저장 등) 차단.
        WebkitTouchCallout: preventDrag ? 'none' : undefined,
      }}
    >
      <div
        onContextMenu={handleContextMenu}
        onDragStart={handleDragStart}
        className={`relative ${fill ? 'w-full h-full' : ''}`}
        style={{
          WebkitUserSelect: preventDrag ? 'none' : undefined,
          WebkitTouchCallout: preventDrag ? 'none' : undefined,
        }}
      >
        <ImageWithFallback className={className} {...imgProps} draggable={!preventDrag} />
      </div>


    </div>
  );
}
