import { useEffect, useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';
import { useI18n } from '../i18n/I18nProvider';

/**
 * 브라우저 네이티브 confirm()을 대체하는 프로미스 기반 확인 다이얼로그.
 * 사용: `if (!(await openConfirm({ title: '삭제할까요?' }))) return;`
 * 최상위에 <ConfirmDialogRoot />가 마운트되어 있어야 동작.
 */

export type ConfirmOptions = {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** 복구 불가 작업(삭제 등) — 확인 버튼을 destructive 색으로 */
  destructive?: boolean;
};

type State = { open: boolean; opts: ConfirmOptions | null };

let resolveRef: ((value: boolean) => void) | null = null;
let setStateRef: ((state: State) => void) | null = null;

export function openConfirm(opts: ConfirmOptions): Promise<boolean> {
  return new Promise((resolve) => {
    // 이전 다이얼로그가 열린 상태면 false로 취소 처리
    if (resolveRef) resolveRef(false);
    resolveRef = resolve;
    setStateRef?.({ open: true, opts });
  });
}

export function ConfirmDialogRoot() {
  const [state, setState] = useState<State>({ open: false, opts: null });
  const { t } = useI18n();

  useEffect(() => {
    setStateRef = setState;
    return () => {
      setStateRef = null;
    };
  }, []);

  const close = (result: boolean) => {
    const r = resolveRef;
    resolveRef = null;
    setState((s) => ({ open: false, opts: s.opts }));
    r?.(result);
  };

  const opts = state.opts;

  return (
    <AlertDialog open={state.open} onOpenChange={(next) => { if (!next) close(false); }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{opts?.title ?? ''}</AlertDialogTitle>
          {opts?.description && (
            <AlertDialogDescription>{opts.description}</AlertDialogDescription>
          )}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => close(false)}>
            {opts?.cancelLabel ?? t('confirm.cancel')}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={() => close(true)}
            className={opts?.destructive ? 'bg-destructive text-destructive-foreground lg:hover:bg-destructive/90' : undefined}
          >
            {opts?.confirmLabel ?? t('confirm.ok')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
