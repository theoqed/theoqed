'use client';

import React from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

interface MathTextProps {
  text: string;
  className?: string;
}

export function MathText({ text, className = '' }: MathTextProps) {
  if (!text) return null;

  // Pisahkan blok display math ($$...$$) dan inline math ($...$)
  const tokens = text.split(/(\$\$[\s\S]*?\$\$|\$[^$\n]+?\$)/g);

  return (
    <div className={`leading-relaxed whitespace-pre-line ${className}`}>
      {tokens.map((token, index) => {
        if (token.startsWith('$$') && token.endsWith('$$')) {
          const tex = token.slice(2, -2).trim();
          try {
            const html = katex.renderToString(tex, {
              displayMode: true,
              throwOnError: false,
            });
            return (
              <span
                key={index}
                className="block my-2 overflow-x-auto"
                dangerouslySetInnerHTML={{ __html: html }}
              />
            );
          } catch {
            return <code key={index}>{token}</code>;
          }
        }

        if (token.startsWith('$') && token.endsWith('$')) {
          const tex = token.slice(1, -1).trim();
          try {
            const html = katex.renderToString(tex, {
              displayMode: false,
              throwOnError: false,
            });
            return (
              <span
                key={index}
                dangerouslySetInnerHTML={{ __html: html }}
              />
            );
          } catch {
            return <code key={index}>{token}</code>;
          }
        }

        return <React.Fragment key={index}>{token}</React.Fragment>;
      })}
    </div>
  );
}