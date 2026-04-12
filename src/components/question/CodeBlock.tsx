import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface CodeBlockProps {
  code: string;
  language: string;
}

const customTheme = {
  ...oneDark,
  'pre[class*="language-"]': {
    ...oneDark['pre[class*="language-"]'],
    background: 'oklch(0.14 0.02 250)',
    fontSize: '0.8125rem',
    lineHeight: '1.6',
    borderRadius: '0.75rem',
    padding: '1rem',
    border: '1px solid oklch(0.25 0.02 250 / 0.5)',
    margin: '0',
  },
  'code[class*="language-"]': {
    ...oneDark['code[class*="language-"]'],
    background: 'none',
    fontSize: '0.8125rem',
    fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
  },
};

export function CodeBlock({ code, language }: CodeBlockProps) {
  return (
    <div className="relative group">
      <span className="absolute top-2 right-3 text-[10px] font-mono text-slate-600 uppercase tracking-wider">
        {language}
      </span>
      <SyntaxHighlighter
        language={language}
        style={customTheme}
        showLineNumbers={code.split('\n').length > 3}
        lineNumberStyle={{
          color: 'oklch(0.35 0.02 250)',
          fontSize: '0.75rem',
          paddingRight: '1rem',
          minWidth: '2rem',
        }}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
}
