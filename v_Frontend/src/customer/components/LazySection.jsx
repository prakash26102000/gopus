import React, { useEffect, useRef, useState } from 'react';

// LazySection mounts its children only when near the viewport.
// Props:
// - rootMargin: when to start mounting (e.g., '200px')
// - fallback: optional placeholder while waiting
const LazySection = ({ children, rootMargin = '200px', fallback = null }) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (isVisible) return; // Already mounted
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
          }
        });
      },
      { root: null, rootMargin, threshold: 0.01 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [isVisible, rootMargin]);

  return (
    <div ref={ref}>
      {isVisible ? children : fallback}
    </div>
  );
};

export default LazySection;
