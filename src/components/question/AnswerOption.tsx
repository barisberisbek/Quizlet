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
        ? 'border-indigo-500/50 bg-indigo-500/10 text-slate-200'
        : 'border-white/5 bg-white/[0.02] text-slate-300 hover:border-white/10 hover:bg-white/5';
    }

    // Answered state
    if (isCorrectOption && isSelected) {
      return 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300';
    }
    if (isCorrectOption) {
      return 'border-emerald-500/20 bg-emerald-500/5 text-emerald-400';
    }
    if (isSelected && !isCorrectOption) {
      return 'border-rose-500/40 bg-rose-500/10 text-rose-300';
    }
    return 'border-white/5 bg-white/[0.01] text-slate-500 opacity-60';
  };

  const renderIcon = () => {
    if (!isAnswered) {
      if (isMultiple) {
        return isSelected ? (
          <CheckSquare size={16} className="text-indigo-400" />
        ) : (
          <Square size={16} className="text-slate-600" />
        );
      }
      return (
        <Circle
          size={16}
          className={isSelected ? 'text-indigo-400' : 'text-slate-600'}
          fill={isSelected ? 'currentColor' : 'none'}
        />
      );
    }

    if (isCorrectOption) {
      return <Check size={16} className="text-emerald-400" />;
    }
    if (isSelected && !isCorrectOption) {
      return <X size={16} className="text-rose-400" />;
    }
    return isMultiple ? (
      <Square size={16} className="text-slate-600" />
    ) : (
      <Circle size={16} className="text-slate-600" />
    );
  };

  return (
    <motion.button
      whileTap={!isAnswered ? { scale: 0.99 } : undefined}
      onClick={onClick}
      disabled={isAnswered}
      className={cn(
        'w-full flex items-start gap-3 px-4 py-3 rounded-xl border transition-all duration-200 text-left',
        getStateClasses(),
        !isAnswered && 'cursor-pointer',
        isAnswered && 'cursor-default'
      )}
    >
      <span className="mt-0.5 shrink-0">{renderIcon()}</span>
      <span className="flex-1">
        <span className="text-xs font-bold mr-2 opacity-50">{option.label}.</span>
        <span className="text-sm">{option.text}</span>
      </span>
    </motion.button>
  );
}
