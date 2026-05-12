"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AnimatedButtonProps {
  variant?: "default" | "outline" | "secondary" | "ghost" | "destructive" | "link";
  size?: "default" | "xs" | "sm" | "lg" | "icon" | "icon-xs" | "icon-sm" | "icon-lg";
  className?: string;
  disabled?: boolean;
  onClick?: () => void | Promise<void>;
  isLoading?: boolean;
  isSuccess?: boolean;
  loadingText?: string;
  successText?: string;
  defaultText?: string;
  children?: React.ReactNode;
  type?: "button" | "submit" | "reset";
}

export function AnimatedButton({
  variant = "default",
  size = "default",
  isLoading,
  isSuccess,
  loadingText = "Loading...",
  successText = "Success!",
  defaultText = "Submit",
  className,
  children,
  disabled,
  onClick,
  type = "button",
}: AnimatedButtonProps) {
  return (
    <Button
      variant={variant}
      size={size}
      className={cn("relative overflow-hidden transition-all", className)}
      disabled={isLoading || isSuccess || disabled}
      onClick={onClick}
      type={type}
    >
      <AnimatePresence mode="wait" initial={false}>
        {isLoading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.2 }}
            className="flex items-center justify-center gap-2"
          >
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>{loadingText}</span>
          </motion.div>
        ) : isSuccess ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.2 }}
            className="flex items-center justify-center gap-2 text-green-500"
          >
            <Check className="h-5 w-5" />
            <span>{successText}</span>
          </motion.div>
        ) : (
          <motion.div
            key="default"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.2 }}
            className="flex items-center justify-center gap-2"
          >
            {children || defaultText}
          </motion.div>
        )}
      </AnimatePresence>
    </Button>
  );
}