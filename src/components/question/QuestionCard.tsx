import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Bookmark, BookmarkCheck, ChevronDown, Hash } from 'lucide-react';
import type { Question } from '../../types/quiz.types';
import type { UserAnswer } from '../../types/progress.types';
import { AnswerOption } from './AnswerOption';
import { ExplanationPanel } from './ExplanationPanel';
import { CodeBlock } from './CodeBlock';
import { useQuizStore } from '../../store/quizStore';
import { useBookmarkStore } from '../../store/bookmarkStore';
import { cn, getDifficultyColor, getDifficultyLabel } from '../../lib/utils';

interface QuestionCardProps {
  question: Question;
  index: number;
  quizId: string;
  existingAnswer?: UserAnswer;
}

export function QuestionCard({
  question,
  index,
  quizId,
  existingAnswer,
}: QuestionCardProps) {
  const { answerQuestion, revealExplanation } = useQuizStore();
  const { isBookmarked, toggleBookmark } = useBookmarkStore();

  const [selectedOptions, setSelectedOptions] = useState<string[]>(
    existingAnswer?.selectedOptionIds || []
  );
  const [isAnswered, setIsAnswered] = useState(!!existingAnswer);
  const [isCorrect, setIsCorrect] = useState(existingAnswer?.isCorrect ?? false);
  const [showExplanation, setShowExplanation] = useState(
    existingAnswer?.revealed ?? false
  );

  const bookmarked = isBookmarked(question.id);

  const handleSelectOption = useCallback(
    (optionId: string) => {
      if (isAnswered) return;

      if (question.type === 'multiple_choice') {
        setSelectedOptions((prev) =>
          prev.includes(optionId)
            ? prev.filter((id) => id !== optionId)
            : [...prev, optionId]
        );
      } else {
        setSelectedOptions([optionId]);
      }
    },
    [isAnswered, question.type]
  );

  const handleSubmitAnswer = useCallback(() => {
    if (selectedOptions.length === 0) return;

    const correct =
      selectedOptions.length === question.correctAnswer.length &&
      selectedOptions.every((id) => question.correctAnswer.includes(id));

    setIsCorrect(correct);
    setIsAnswered(true);
    answerQuestion(question.id, selectedOptions, correct);
  }, [selectedOptions, question, answerQuestion]);

  const handleReveal = useCallback(() => {
    setShowExplanation(true);
    revealExplanation(question.id);
  }, [question.id, revealExplanation]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.05 }}
      className="glass-card overflow-hidden"
    >
      {/* Card header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-white/5">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-xs font-mono text-slate-500">
            <Hash size={12} />
            {index + 1}
          </span>
          <span
            className={cn(
              'text-[10px] font-semibold px-2 py-0.5 rounded-full border',
              getDifficultyColor(question.difficulty)
            )}
          >
            {getDifficultyLabel(question.difficulty)}
          </span>
          <span className="text-[10px] text-slate-500 font-medium">{question.topic}</span>
          {question.type === 'multiple_choice' && (
            <span className="text-[10px] text-amber-400/70 font-medium bg-amber-400/5 px-1.5 py-0.5 rounded border border-amber-400/10">
              Select all
            </span>
          )}
        </div>
        <button
          onClick={() => toggleBookmark(question.id, quizId)}
          className={cn(
            'p-1.5 rounded-lg transition-colors',
            bookmarked
              ? 'text-amber-400 hover:text-amber-300'
              : 'text-slate-600 hover:text-slate-400'
          )}
          aria-label={bookmarked ? 'Remove bookmark' : 'Add bookmark'}
        >
          {bookmarked ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
        </button>
      </div>

      {/* Question body */}
      <div className="px-5 py-4 space-y-4">
        {/* Question stem */}
        <div className="markdown-content text-sm text-slate-200 leading-relaxed">
          <QuestionMarkdown content={question.questionMd} />
        </div>

        {/* Code block */}
        {question.codeBlock && (
          <CodeBlock
            code={question.codeBlock}
            language={question.codeLanguage || 'javascript'}
          />
        )}

        {/* Answer options */}
        <div className="space-y-2">
          {question.options.map((option) => (
            <AnswerOption
              key={option.id}
              option={option}
              isSelected={selectedOptions.includes(option.id)}
              isCorrectOption={question.correctAnswer.includes(option.id)}
              isAnswered={isAnswered}
              onClick={() => handleSelectOption(option.id)}
              questionType={question.type}
            />
          ))}
        </div>

        {/* Submit / Result */}
        <div className="flex items-center gap-3 pt-2">
          {!isAnswered ? (
            <button
              onClick={handleSubmitAnswer}
              disabled={selectedOptions.length === 0}
              className={cn(
                'px-5 py-2 text-xs font-semibold rounded-lg transition-all duration-200',
                selectedOptions.length === 0
                  ? 'bg-white/5 text-slate-600 cursor-not-allowed'
                  : 'bg-indigo-500 text-white hover:bg-indigo-400 shadow-lg shadow-indigo-500/20'
              )}
            >
              Check Answer
            </button>
          ) : (
            <div className="flex items-center gap-3 flex-wrap">
              <span
                className={cn(
                  'inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg',
                  isCorrect
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                )}
              >
                {isCorrect ? '✓ Correct' : '✗ Incorrect'}
              </span>

              {!showExplanation && (
                <button
                  onClick={handleReveal}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-slate-200 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <ChevronDown size={14} />
                  Show Explanation
                </button>
              )}
            </div>
          )}
        </div>

        {/* Explanation */}
        <ExplanationPanel
          isOpen={showExplanation}
          explanationMd={question.explanationMd}
          correctAnswer={question.correctAnswer}
          options={question.options}
        />
      </div>
    </motion.div>
  );
}

// Simple markdown renderer for question stem
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

function QuestionMarkdown({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        code({ className, children, ...props }) {
          const match = /language-(\w+)/.exec(className || '');
          if (match) {
            return (
              <CodeBlock
                code={String(children).replace(/\n$/, '')}
                language={match[1]}
              />
            );
          }
          return (
            <code className={className} {...props}>
              {children}
            </code>
          );
        },
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
