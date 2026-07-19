import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

interface SplitTextProps {
  text: string;
  delay?: number; // milliseconds before animation starts
  duration?: number; // seconds for each character fade
  className?: string;
}

/**
 * Simple SplitText component that animates each character sequentially using GSAP.
 * It splits the provided text into individual <span> elements and fades them in
 * with a small stagger. This implementation uses only the core GSAP library –
 * no commercial SplitText plugin required.
 */
const SplitText: React.FC<SplitTextProps> = ({ text, delay = 0, duration = 0.6, className }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Clear any previous content (important on re‑renders)
    container.innerHTML = '';

    // Create a <span> for each character
    const spans = text.split('').map((char) => {
      const span = document.createElement('span');
      span.textContent = char;
      span.style.opacity = '0';
      span.style.display = 'inline-block';
      span.style.whiteSpace = 'pre'; // preserve spaces
      container.appendChild(span);
      return span;
    });

    // GSAP timeline with optional start delay (converted to seconds)
    const tl = gsap.timeline({ delay: delay / 1000 });
    tl.to(spans, {
      opacity: 1,
      y: -10,
      ease: 'power2.out',
      duration,
      stagger: 0.04,
    });

    // Cleanup on unmount
    return () => {
      tl.kill();
      if (container) container.innerHTML = '';
    };
  }, [text, delay, duration]);

  return <div ref={containerRef} className={className} aria-label={text} />;
};

export default SplitText;
