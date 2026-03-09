import { useState, useRef, useEffect } from 'react';
import { Play, Pause, RotateCcw, Maximize2 } from 'lucide-react';

interface TimelapsePlayerProps {
  /** 타임랩스 영상 URL (미구현 시 빈 문자열) */
  src?: string;
  /** 제목 */
  title?: string;
  /** 아티스트명 */
  artistName?: string;
  className?: string;
}

export function TimelapsePlayer({
  src = '',
  title = '작업 과정',
  artistName,
  className = '',
}: TimelapsePlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [speed, setSpeed] = useState(1);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handlePlayPause = () => {
    if (isPlaying) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = null;
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
      intervalRef.current = setInterval(() => {
        setProgress((p) => {
          if (p >= 100) {
            if (intervalRef.current) clearInterval(intervalRef.current);
            setIsPlaying(false);
            return 0;
          }
          return p + 0.5 * speed;
        });
      }, 50);
    }
  };

  const handleReset = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
    setIsPlaying(false);
    setProgress(0);
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    setProgress(value);
  };

  return (
    <div
      className={`rounded-xl border border-white/10 bg-black/60 backdrop-blur-sm overflow-hidden ${className}`}
    >
      {/* 헤더 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <div>
          <h4 className="text-white text-[14px] font-semibold">{title}</h4>
          {artistName && (
            <p className="text-white/60 text-[12px]">{artistName}</p>
          )}
        </div>
        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-cyan-500/20 text-cyan-300">
          SGF 연동
        </span>
      </div>

      {/* 플레이어 영역 - UI만 (실제 비디오 없음) */}
      <div className="relative aspect-video bg-black/80 flex items-center justify-center">
        {src ? (
          <video
            src={src}
            className="w-full h-full object-contain"
            controls={false}
            ref={(el) => {
              if (!el) return;
              // 실제 연동 시 여기서 제어
            }}
          />
        ) : (
          /* 플레이스홀더 - 실제 타임랩스 미연동 시 */
          <div className="flex flex-col items-center gap-4 text-white/50">
            <div className="w-20 h-20 rounded-full border-2 border-dashed border-white/30 flex items-center justify-center">
              <Play className="h-10 w-10 ml-1" />
            </div>
            <p className="text-[13px]">SGF 드로잉 툴에서 제작한 작품은</p>
            <p className="text-[13px]">작업 과정 타임랩스를 감상할 수 있습니다</p>
          </div>
        )}

        {/* 프로그레스 바 오버레이 */}
        <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
          <input
            type="range"
            min={0}
            max={100}
            value={progress}
            onChange={handleSeek}
            className="w-full h-1.5 accent-cyan-500 cursor-pointer"
          />
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-2">
              <button
                onClick={handlePlayPause}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                {isPlaying ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4 ml-0.5" />
                )}
              </button>
              <button
                onClick={handleReset}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
              <select
                value={speed}
                onChange={(e) => setSpeed(Number(e.target.value))}
                className="h-7 px-2 rounded bg-white/10 text-white text-[12px] border-none focus:ring-1 focus:ring-cyan-500"
              >
                <option value={0.5}>0.5x</option>
                <option value={1}>1x</option>
                <option value={1.5}>1.5x</option>
                <option value={2}>2x</option>
              </select>
            </div>
            <span className="text-white/70 text-[12px]">
              {Math.floor(progress / 100 * 2)}:{(Math.floor(progress % 100) * 0.6).toFixed(0).padStart(2, '0')} / 2:00
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
