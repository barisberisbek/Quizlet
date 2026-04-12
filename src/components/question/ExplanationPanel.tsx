import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Lightbulb } from 'lucide-react';
import type { AnswerOption } from '../../types/quiz.types';
import { CodeBlock } from './CodeBlock';

interface ExplanationPanelProps {
  isOpen: boolean;
  explanationMd: string;
  correctAnswer: string[];
  options: AnswerOption[];
}

export function ExplanationPanel({
  isOpen,
  explanationMd,
  correctAnswer,
  options,
}: ExplanationPanelProps) {
  const correctLabels = correctAnswer
    .map((id) => options.find((o) => o.id === id)?.label)
    .filter(Boolean)
    .join(', ');

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="overflow-hidden"
        >
          <div className="mt-2 p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/10">
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb size={14} className="text-indigo-400" />
              <span className="text-xs font-semibold text-indigo-300">
                Correct Answer: {correctLabels}
              </span>
            </div>
            <div className="markdown-content text-sm text-slate-300 leading-relaxed">
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
                {explanationMd}
              </ReactMarkdown>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
