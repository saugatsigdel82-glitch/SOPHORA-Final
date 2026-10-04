import { useEffect, useRef, useState } from 'react';

/**
 * Hook that returns a ref to be attached to an element and a boolean `isVisible`
 * which becomes true when the element enters the viewport (threshold 0.15).
 * The element will stay visible after the first reveal.
 */
export function useScrollReveal(threshold = 0.15) {
  const ref = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold }
    );
    observer.observe(node);
    return () => {
      observer.disconnect();
    };
  }, [threshold]);

  return { ref, isVisible };
}
