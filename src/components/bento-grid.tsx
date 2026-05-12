"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

interface BentoGridProps {
  children: ReactNode;
}

export function BentoGrid({ children }: BentoGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {children}
    </div>
  );
}

interface BentoItemProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

export function BentoItem({ children, className = "", delay = 0 }: BentoItemProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
