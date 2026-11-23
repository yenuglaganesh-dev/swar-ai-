import { motion, useReducedMotion } from 'framer-motion';
import { ReactNode, useEffect, useState } from 'react';

interface Props {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
  scale?: number;
}

export default function Reveal({ children, delay = 0, y = 28, className = '', scale = 0.985 }: Props) {
  const reduce = useReducedMotion();
  const [fallbackVisible, setFallbackVisible] = useState(false);

  useEffect(() => {
    if (reduce) return;
    // Fallback: if IntersectionObserver/animation fails, ensure content becomes visible.
    const id = window.setTimeout(() => setFallbackVisible(true), 1200);
    return () => window.clearTimeout(id);
  }, [reduce]);

  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y, scale }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      animate={fallbackVisible ? { opacity: 1, y: 0, scale: 1 } : undefined}
      viewport={{ once: true, margin: '-40px', amount: 0.1 }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
