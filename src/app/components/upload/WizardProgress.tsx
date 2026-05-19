// src/app/components/upload/WizardProgress.tsx
import { Check } from 'lucide-react';
import type { WizardStep } from './types';

interface StepDef {
  number: WizardStep;
  labelKey: string;
}

interface Props {
  currentStep: WizardStep;
  isGroup: boolean;
  onStepClick: (step: WizardStep) => void;
}

const STEP_DEFS: StepDef[] = [
  { number: 1, labelKey: '작품 올리기' },
  { number: 2, labelKey: '제목 짓기' },
  { number: 3, labelKey: '작가 연결' },
  { number: 4, labelKey: '전시 신청' },
];

export function WizardProgress({ currentStep, isGroup, onStepClick }: Props) {
  const steps = isGroup ? STEP_DEFS : STEP_DEFS.filter((s) => s.number !== 3);

  return (
    <div className="flex items-center justify-center gap-0 py-3 px-4 border-b border-border/40 bg-white sticky top-0 z-10">
      {steps.map((step, idx) => {
        const isDone = step.number < currentStep;
        const isCurrent = step.number === currentStep;

        return (
          <div key={step.number} className="flex items-center">
            <button
              type="button"
              disabled={!isDone}
              onClick={() => isDone && onStepClick(step.number)}
              className="flex flex-col items-center gap-1 min-w-[44px] min-h-[44px] justify-center"
              aria-current={isCurrent ? 'step' : undefined}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                  isDone
                    ? 'bg-emerald-500 text-white cursor-pointer'
                    : isCurrent
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {isDone ? <Check className="h-3.5 w-3.5" /> : idx + 1}
              </div>
              <span
                className={`text-[9px] font-semibold whitespace-nowrap hidden sm:block ${
                  isDone ? 'text-emerald-500' : isCurrent ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                {step.labelKey}
              </span>
              <span
                className={`text-[9px] font-semibold whitespace-nowrap sm:hidden ${
                  isCurrent ? 'text-primary' : 'text-transparent select-none'
                }`}
                aria-hidden={!isCurrent}
              >
                {step.labelKey}
              </span>
            </button>
            {idx < steps.length - 1 && (
              <div
                className={`w-5 h-0.5 mx-0.5 flex-shrink-0 ${
                  step.number < currentStep ? 'bg-emerald-500' : 'bg-border'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
