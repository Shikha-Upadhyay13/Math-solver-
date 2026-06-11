"use client";

import { useEffect, useRef } from "react";
import katex from "katex";

interface MathRenderProps {
  expr: string;
  display?: boolean;
  className?: string;
}

export function MathRender({ expr, display = false, className }: MathRenderProps) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    try {
      katex.render(expr, ref.current, {
        displayMode: display,
        throwOnError: false,
        strict: "ignore",
      });
    } catch {
      if (ref.current) ref.current.textContent = expr;
    }
  }, [expr, display]);

  return <span ref={ref} className={className} aria-label={expr} />;
}
