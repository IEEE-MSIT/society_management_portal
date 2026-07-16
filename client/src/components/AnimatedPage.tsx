import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

interface AnimatedPageProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Wraps page content with a smooth GSAP entrance animation.
 * Automatically animates:
 * - The page container (fade + slide up)
 * - Any child elements with data-animate attribute (staggered entrance)
 * - Cards with .glass-panel class (staggered pop-in)
 * - Table rows (slide in from left)
 * - Form fields (staggered fade-up)
 */
const AnimatedPage: React.FC<AnimatedPageProps> = ({ children, className = '' }) => {
  const pageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const page = pageRef.current;
    if (!page) return;

    const ctx = gsap.context(() => {
      // Page entrance
      gsap.fromTo(page,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' }
      );

      // Animate section headers
      const headers = page.querySelectorAll('h1, h2, .page-header');
      if (headers.length) {
        gsap.fromTo(headers,
          { opacity: 0, y: 20, scale: 0.98 },
          { opacity: 1, y: 0, scale: 1, duration: 0.5, stagger: 0.1, delay: 0.15, ease: 'power2.out' }
        );
      }

      // Animate glass panels / cards with stagger
      const cards = page.querySelectorAll('.glass-panel, [data-animate="card"]');
      if (cards.length) {
        gsap.fromTo(cards,
          { opacity: 0, y: 40, scale: 0.95 },
          { opacity: 1, y: 0, scale: 1, duration: 0.5, stagger: 0.08, delay: 0.2, ease: 'power3.out' }
        );
      }

      // Animate grid items
      const gridItems = page.querySelectorAll('[data-animate="grid-item"]');
      if (gridItems.length) {
        gsap.fromTo(gridItems,
          { opacity: 0, y: 30, scale: 0.9 },
          { opacity: 1, y: 0, scale: 1, duration: 0.5, stagger: 0.06, delay: 0.3, ease: 'back.out(1.2)' }
        );
      }

      // Animate table rows
      const tableRows = page.querySelectorAll('tbody tr');
      if (tableRows.length) {
        gsap.fromTo(tableRows,
          { opacity: 0, x: -20 },
          { opacity: 1, x: 0, duration: 0.4, stagger: 0.04, delay: 0.3, ease: 'power2.out' }
        );
      }

      // Animate form fields
      const formFields = page.querySelectorAll('input, select, textarea, [data-animate="field"]');
      if (formFields.length) {
        gsap.fromTo(formFields,
          { opacity: 0, y: 15 },
          { opacity: 1, y: 0, duration: 0.4, stagger: 0.05, delay: 0.25, ease: 'power2.out' }
        );
      }

      // Animate buttons
      const buttons = page.querySelectorAll('button, a[class*="bg-indigo"], a[class*="bg-slate-800"]');
      if (buttons.length) {
        gsap.fromTo(buttons,
          { opacity: 0, y: 10, scale: 0.95 },
          { opacity: 1, y: 0, scale: 1, duration: 0.4, stagger: 0.06, delay: 0.35, ease: 'back.out(1.5)' }
        );
      }

      // Animate stat numbers
      const stats = page.querySelectorAll('[data-animate="stat"]');
      if (stats.length) {
        stats.forEach((stat) => {
          const target = parseInt(stat.textContent || '0', 10);
          if (!isNaN(target) && target > 0) {
            const obj = { val: 0 };
            gsap.to(obj, {
              val: target,
              duration: 1.5,
              delay: 0.4,
              ease: 'power2.out',
              onUpdate: () => {
                (stat as HTMLElement).textContent = Math.round(obj.val).toString();
              },
            });
          }
        });
      }
    }, page);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={pageRef} className={className} style={{ opacity: 0 }}>
      {children}
    </div>
  );
};

export default AnimatedPage;
