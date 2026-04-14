import { useState, useCallback, useRef, useEffect } from 'react';
import { MapPin, X } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { pinCommentStore, PinComment } from '../../store/pinCommentStore';
import { artists } from '../../data';
import { Button } from '../ui/button';
import { useI18n } from '../../i18n/I18nProvider';

interface PinCommentLayerProps {
  workId: string;
  imageIndex: number;
  /** 컨테이너 ref 또는 ref 배열 + 인덱스 (여러 이미지일 때) */
  imageRef?: React.RefObject<HTMLDivElement>;
  containerRefs?: React.MutableRefObject<(HTMLDivElement | null)[]>;
  containerIndex?: number;
  /** 핀 추가 모드 (클릭으로 핀 배치) */
  addMode?: boolean;
  onAddModeChange?: (enabled: boolean) => void;
  /** 현재 사용자 (댓글 작성자) */
  currentUser?: { id: string; name: string; avatar?: string };
  className?: string;
}

export function PinCommentLayer({
  workId,
  imageIndex,
  imageRef,
  containerRefs,
  containerIndex = 0,
  addMode = false,
  onAddModeChange,
  currentUser = artists[0],
  className = '',
}: PinCommentLayerProps) {
  const [pins, setPins] = useState<PinComment[]>(() =>
    pinCommentStore.getPins(workId, imageIndex)
  );
  const { t } = useI18n();
  const [editingPin, setEditingPin] = useState<{ x: number; y: number } | null>(null);
  const [newComment, setNewComment] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsub = pinCommentStore.subscribe(() => {
      setPins(pinCommentStore.getPins(workId, imageIndex));
    });
    return unsub;
  }, [workId, imageIndex]);

  const handleImageClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!addMode) return;
      const container = containerRefs?.current?.[containerIndex] ?? imageRef?.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      setEditingPin({ x, y });
      setNewComment('');
      setTimeout(() => inputRef.current?.focus(), 50);
    },
    [addMode, containerRefs, containerIndex, imageRef]
  );

  const handleSubmitPin = useCallback(() => {
    if (!editingPin || !newComment.trim()) return;
    pinCommentStore.addPin({
      workId,
      imageIndex,
      x: editingPin.x,
      y: editingPin.y,
      content: newComment.trim(),
      userId: currentUser.id,
      userName: currentUser.name,
      userAvatar: currentUser.avatar,
    });
    setEditingPin(null);
    setNewComment('');
    onAddModeChange?.(false);
  }, [editingPin, newComment, workId, imageIndex, currentUser, onAddModeChange]);

  const handleRemovePin = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    pinCommentStore.removePin(id);
  }, []);

  return (
    <div
      className={`absolute inset-0 ${addMode ? 'cursor-crosshair' : ''} ${className}`}
      onClick={handleImageClick}
    >
      {/* 기존 핀들 */}
      {pins.map((pin) => (
        <PinMarker
          key={pin.id}
          pin={pin}
          onRemove={(e) => handleRemovePin(pin.id, e)}
        />
      ))}

      {/* 새 핀 입력 중 */}
      {editingPin && (
        <div
          className="absolute z-20 transform -translate-x-1/2 -translate-y-full"
          style={{ left: `${editingPin.x}%`, top: `${editingPin.y}%` }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex flex-col items-center gap-2">
            <div className="relative">
              <MapPin className="h-8 w-8 text-primary fill-cyan-400 drop-shadow-lg" />
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-primary" />
            </div>
            <div className="flex items-center gap-2 bg-black/90 rounded-lg px-3 py-2 border border-white/20 min-w-[200px]">
              <input
                ref={inputRef}
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSubmitPin();
                  if (e.key === 'Escape') {
                    setEditingPin(null);
                    setNewComment('');
                  }
                }}
                placeholder={t('pinComment.placeholder')}
                className="flex-1 bg-transparent text-white text-xs outline-none placeholder:text-white/50"
              />
              <Button
                onClick={() => setEditingPin(null)}
                className="text-white/60 lg:hover:text-white p-0.5"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <Button
              onClick={handleSubmitPin}
              disabled={!newComment.trim()}
              className="px-4 py-1.5 bg-primary text-white text-xs font-medium rounded-full lg:hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t('pinComment.save')}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function PinMarker({
  pin,
  onRemove,
}: {
  pin: PinComment;
  onRemove: (e: React.MouseEvent) => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="absolute z-10 transform -translate-x-1/2 -translate-y-full group"
      style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <MapPin className="h-6 w-6 text-primary fill-cyan-400/80 drop-shadow cursor-pointer lg:hover:scale-110 transition-transform" />
      {hovered && (
        <div className="absolute left-1/2 -translate-x-1/2 top-full mt-1 w-56 bg-black/95 rounded-lg border border-white/20 p-3 shadow-xl">
          <div className="flex items-start gap-2">
            <Avatar className="h-6 w-6 flex-shrink-0">
              <AvatarImage src={pin.userAvatar} />
              <AvatarFallback className="text-xs">{pin.userName[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-white/80 text-xs font-medium">{pin.userName}</p>
              <p className="text-white text-xs mt-0.5">{pin.content}</p>
            </div>
            <Button
              onClick={onRemove}
              className="text-white/50 lg:hover:text-red-400 p-0.5 flex-shrink-0"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
