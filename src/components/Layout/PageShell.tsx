import { motion, useReducedMotion } from 'framer-motion';
import React, { useEffect, useState } from 'react';

export default function PageShell({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const reduce = useReducedMotion();
  const [ready, setReady] = useState(reduce);
  useEffect(() => { if (!reduce) setReady(true); }, [reduce]);

  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      style={!reduce && !ready ? { opacity: 1 } : undefined}
    >
      <div className="app-bg" aria-hidden />
      {children}
    </motion.div>
  );
}
