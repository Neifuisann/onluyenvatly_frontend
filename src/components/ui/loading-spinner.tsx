"use client";

import { motion } from "motion/react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  text?: string;
}

export function LoadingSpinner({ size = "md", text }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16",
  };

  const dotSize = {
    sm: 6,
    md: 8,
    lg: 10,
  };

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <div className={`relative ${sizeClasses[size]}`}>
        <motion.div
          className="absolute inset-0"
          animate={{
            rotate: 360,
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "linear",
          }}
        >
          {[0, 1, 2].map((index) => (
            <motion.div
              key={index}
              className="absolute bg-primary"
              style={{
                width: dotSize[size],
                height: dotSize[size],
                borderRadius: "50%",
                top: "50%",
                left: "50%",
                marginTop: -dotSize[size] / 2,
                marginLeft: -dotSize[size] / 2,
              }}
              animate={{
                x: [0, 20 * (size === "sm" ? 0.8 : size === "lg" ? 1.2 : 1), 0],
                y: [0, 0, 0],
                opacity: [0.3, 1, 0.3],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: index * 0.5,
                ease: "easeInOut",
              }}
            />
          ))}
        </motion.div>
      </div>
      {text && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-sm text-muted-foreground"
        >
          {text}
        </motion.p>
      )}
    </div>
  );
}