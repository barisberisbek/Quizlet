import { motion } from 'framer-motion';
import { Check, X, Circle, Square, CheckSquare } from 'lucide-react';
import type { AnswerOption as AnswerOptionType, QuestionType } from '../../types/quiz.types';
import { cn } from '../../lib/utils';

interface AnswerOptionProps {
  option: AnswerOptionType;
  isSelected: boolean;
  isCorrectOption: boolean;
  isAnswered: boolean;
  onClick: () => void;
  questionType: QuestionType;
}

export function AnswerOption({
  option,
  isSelected,
  isCorrectOption,
  isAnswered,
  onClick,
  questionType,
}: AnswerOptionProps) {
  const isMultiple = questionType === 'multiple_choice';

  const getStateClasses = () => {
    if (!isAnswered) {
      return isSelected
        ? 'border-indigo-500 bg-indigo-100/80 text-indigo-900 shadow-[0_0_12px_rgba(99,102,241,0.18)] scale-[1.01]'
        : 'border-teal-700/25 bg-white/30 text-slate-700 hover:border-indigo-400/50 hover:bg-white/50';
    }

    // Answered state
    if (isCorrectOption && isSelected) {
      return 'border-emerald-600 bg-emerald-100/90 text-emerald-900 shadow-[0_0_16px_rgba(16,185,129,0.18)] ring-1 ring-emerald-500/50 z-10 scale-[1.02]';
    }
    if (isCorrectOption) {
      return 'border-emerald-500/60 bg-emerald-100/70 text-emerald-800 font-medium z-10';
    }
    if (isSelected && !isCorrectOption) {
      return 'border-rose-500/60 bg-rose-100/80 text-rose-800 opacity-90 scale-[0.99]';
    }
    return 'border-teal-700/10 bg-white/10 text-slate-500 opacity-40';
  };

  const renderIcon = () => {
    if (!isAnswered) {
      if (isMultiple) {
        return isSelected ? (
          <CheckSquare size={16} className="text-indigo-600" />
        ) : (
          <Square size={16} className="text-teal-700/50" />
        );
      }
      return (
        <Circle
          size={16}
          className={isSelected ? 'text-indigo-600' : 'text-teal-700/50'}
          fill={isSelected ? 'currentColor' : 'none'}
        />
      );
    }

    if (isCorrectOption) {
      return <Check size={16} className="text-emerald-600" />;
    }
    if (isSelected && !isCorrectOption) {
      return <X size={16} className="text-rose-600" />;
    }
    return isMultiple ? (
      <Square size={16} className="text-teal-700/40" />
    ) : (
      <Circle size={16} className="text-teal-700/40" />
    );
  };

  return (
    <motion.button
      whileTap={!isAnswered ? { scale: 0.99 } : undefined}
      onClick={onClick}
      disabled={isAnswered}
      className={cn(
        'w-full flex items-start gap-3 px-4 py-3 rounded-xl border transition-all duration-200 text-left min-h-[52px]',
        getStateClasses(),
        !isAnswered && 'cursor-pointer',
        isAnswered && 'cursor-default'
      )}
    >
      <span className="mt-0.5 shrink-0">{renderIcon()}</span>
      <span className="flex-1">
        <span className="text-xs font-bold mr-2" style={{color:'#4a8a92'}}>{option.label}.</span>
        <span className="text-sm">{option.text}</span>
      </span>
    </motion.button>
  );
}
