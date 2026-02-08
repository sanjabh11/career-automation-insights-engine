import React from "react";
import { useNavigate } from "react-router-dom";

export default function GlobalShortcuts() {
  const navigate = useNavigate();

  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isTyping = !!target && (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        (target as any).isContentEditable === true
      );
      if (isTyping) return;

      // '?' on most keyboards is Shift + '/'
      if ((e.shiftKey && e.key === '/') || e.key === '?') {
        e.preventDefault();
        navigate('/help');
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [navigate]);

  return null;
}
