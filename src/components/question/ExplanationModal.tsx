import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Lightbulb, CheckCircle2, XCircle } from 'lucide-react';
import type { AnswerOption } from '../../types/quiz.types';
import { CodeBlock } from './CodeBlock';
import { cn } from '../../lib/utils';

interface ExplanationModalProps {
  isOpen: boolean;
  isCorrect: boolean;
  correctAnswer: string[];
  options: AnswerOption[];
  explanationMd: string;
  onClose: () => void;
}

export function ExplanationModal({
  isOpen,
  isCorrect,
  correctAnswer,
  options,
  explanationMd,
  onClose,
}: ExplanationModalProps) {
  const correctLabels = correctAnswer
    .map((id) => options.find((o) => o.id === id)?.label)
    .filter(Boolean)
    .join(', ');

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handle = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter') onClose();
    };
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, [isOpen, onClose]);

  // Prevent body scroll while open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.93, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.93, y: 16 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div
              className="relative w-full max-w-lg max-h-[85vh] flex flex-col rounded-2xl overflow-hidden shadow-2xl pointer-events-auto"
              style={{ background: 'var(--color-surface-1, #1e2530)', border: '1px solid rgba(255,255,255,0.08)' }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div
                className={cn(
                  'flex items-center gap-3 px-5 py-4 shrink-0',
                  isCorrect
                    ? 'bg-emerald-500/10 border-b border-emerald-500/20'
                    : 'bg-rose-500/10 border-b border-rose-500/20'
                )}
              >
                {isCorrect ? (
                  <CheckCircle2 size={22} className="text-emerald-400 shrink-0" />
                ) : (
                  <XCircle size={22} className="text-rose-400 shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    'text-sm font-bold',
                    isCorrect ? 'text-emerald-300' : 'text-rose-300'
                  )}>
                    {isCorrect ? 'Doğru Cevap!' : 'Yanlış Cevap'}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Doğru Cevap: <span className="font-semibold text-slate-200">{correctLabels}</span>
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Lightbulb size={15} className="text-amber-400" />
                  <span className="text-xs text-slate-400 font-medium hidden sm:block">Açıklama</span>
                </div>
              </div>

              {/* Scrollable Body */}
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
                <div className="explanation-modal-content text-sm text-slate-300 leading-relaxed">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      hr() {
                        return (
                          <div className="my-4 flex items-center gap-3">
                            <div className="flex-1 h-px bg-white/10" />
                            <span className="text-[10px] font-bold tracking-widest text-indigo-400/70 uppercase">Claude Özeti</span>
                            <div className="flex-1 h-px bg-white/10" />
                          </div>
                        );
                      },
                      p({ children }) {
                        return <p className="mb-2 last:mb-0">{children}</p>;
                      },
                      strong({ children }) {
                        return <strong className="text-white font-semibold">{children}</strong>;
                      },
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
                          <code
                            className="px-1.5 py-0.5 rounded text-xs font-mono bg-white/10 text-amber-300"
                            {...props}
                          >
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

              {/* Footer */}
              <div className="shrink-0 px-5 py-4 border-t border-white/5">
                <button
                  onClick={onClose}
                  autoFocus
                  className="w-full py-3 rounded-xl text-sm font-bold transition-all duration-200 bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/25 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                >
                  Tamam — Sonraki Soru
                  <span className="ml-2 text-xs font-normal text-indigo-200 opacity-70">[Enter]</span>
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
