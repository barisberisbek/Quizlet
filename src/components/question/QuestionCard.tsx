import { useState, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
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
  const [isAnswered, setIsAnswered]     = useState(!!existingAnswer);
  const [isCorrect, setIsCorrect]       = useState(existingAnswer?.isCorrect ?? false);
  const [showExplanation, setShowExplanation] = useState(existingAnswer?.revealed ?? false);

  const bookmarked = isBookmarked(question.id);

  const handleSelectOption = useCallback(
    (optionId: string) => {
      if (isAnswered) return;
      if (question.type === 'multiple_choice') {
        setSelectedOptions((prev) =>
          prev.includes(optionId) ? prev.filter((id) => id !== optionId) : [...prev, optionId]
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
      className="question-card overflow-hidden"
    >
      {/* Card header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-teal-700/20">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="flex items-center gap-1 text-xs font-mono text-teal-700/60">
            <Hash size={12} />
            {index + 1}
          </span>
          <span className={cn(
            'text-[10px] font-semibold px-2 py-0.5 rounded-full border',
            getDifficultyColor(question.difficulty)
          )}>
            {getDifficultyLabel(question.difficulty)}
          </span>
          <span className="text-[10px] text-teal-800/70 font-medium">{question.topic}</span>
          {question.type === 'multiple_choice' && (
            <span className="text-[10px] text-amber-700 font-semibold bg-amber-400/20 px-2 py-0.5 rounded-full border border-amber-500/30">
              Hepsini seç
            </span>
          )}
        </div>
        <button
          onClick={() => toggleBookmark(question.id, quizId, question.questionMd)}
          className={cn(
            'p-1.5 rounded-lg transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center',
            bookmarked
              ? 'text-amber-600 hover:text-amber-500'
              : 'text-teal-700/50 hover:text-teal-700'
          )}
          aria-label={bookmarked ? 'Yer imini kaldır' : 'Yer imle'}
        >
          {bookmarked ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
        </button>
      </div>

      {/* Question body */}
      <div className="px-5 py-5 space-y-5">
        <div className="markdown-content text-base font-medium text-slate-800 leading-relaxed">
          <QuestionMarkdown content={question.questionMd} />
        </div>

        {question.codeBlock && (
          <CodeBlock
            code={question.codeBlock}
            language={question.codeLanguage || 'javascript'}
          />
        )}

        {/* Answer options */}
        <div className="space-y-2.5 pt-2 border-t border-teal-700/15">
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
        <div className="flex items-center gap-3 pt-1">
          {!isAnswered ? (
            <button
              onClick={handleSubmitAnswer}
              disabled={selectedOptions.length === 0}
              className={cn(
                'px-5 py-2.5 text-sm font-semibold rounded-xl transition-all duration-200 min-h-[44px]',
                selectedOptions.length === 0
                  ? 'bg-teal-700/10 text-teal-700/40 cursor-not-allowed'
                  : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-600/25'
              )}
            >
              Cevabı Kontrol Et
            </button>
          ) : (
            <div className="flex items-center gap-3 flex-wrap">
              <span className={cn(
                'inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg',
                isCorrect
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
              )}>
                {isCorrect ? '✓ Doğru' : '✗ Yanlış'}
              </span>

              {!showExplanation && (
                <button
                  onClick={handleReveal}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-teal-700 hover:text-teal-900 bg-teal-700/10 hover:bg-teal-700/20 rounded-lg transition-colors min-h-[36px]"
                >
                  <ChevronDown size={14} />
                  Açıklamayı Gör
                  <span className="text-[10px] text-slate-600 ml-1 hidden md:inline">[e]</span>
                </button>
              )}
            </div>
          )}
        </div>

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

// Markdown renderer — imports must be at top of file
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
          return <code className={className} {...props}>{children}</code>;
        },
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
