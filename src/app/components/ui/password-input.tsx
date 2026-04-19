import { forwardRef, useState, type InputHTMLAttributes } from 'react';
import { Eye, EyeOff } from 'lucide-react';

type PasswordInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  /** 토글 버튼 접근성 라벨 (국제화 문자열) */
  toggleAriaLabel?: string;
};

/**
 * 비밀번호 입력 + 보기/숨김 토글.
 * 기존 <input type="password" .../>의 드롭인 교체용.
 */
export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(function PasswordInput(
  { className = '', toggleAriaLabel, ...rest },
  ref,
) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <input
        ref={ref}
        type={visible ? 'text' : 'password'}
        className={`${className} pr-12`}
        {...rest}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={toggleAriaLabel ?? (visible ? '비밀번호 숨기기' : '비밀번호 표시')}
        aria-pressed={visible}
        className="absolute right-1 top-1/2 -translate-y-1/2 flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-md text-muted-foreground lg:hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {visible ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
      </button>
    </div>
  );
});
