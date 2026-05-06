import React, { useState } from 'react';

export function ImageWithFallback(props: React.ImgHTMLAttributes<HTMLImageElement>) {
  const [didError, setDidError] = useState(false);

  const handleError = () => {
    setDidError(true);
  };

  const { src, alt, style, className, loading, decoding, ...rest } = props;
  // 기본 lazy-load. 히어로·above-the-fold는 호출부에서 loading="eager"로 덮어쓰기 가능.
  const imgLoading = loading ?? 'lazy';
  const imgDecoding = decoding ?? 'async';

  return didError ? (
    <div
      className={`flex items-center justify-center ${className ?? ''}`}
      style={style}
      data-original-url={src}
      aria-label={alt}
    >
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
        <rect x="6" y="6" width="28" height="28" rx="3" stroke="currentColor" strokeWidth="1.5" className="text-muted-foreground/25" />
        <circle cx="14.5" cy="15.5" r="2.5" fill="currentColor" className="text-muted-foreground/25" />
        <path d="M6 26l8-9 6 7 4-5 10 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground/25" />
      </svg>
    </div>
  ) : (
    <img
      src={src}
      alt={alt}
      className={className}
      style={style}
      loading={imgLoading}
      decoding={imgDecoding}
      {...rest}
      onError={handleError}
    />
  );
}
