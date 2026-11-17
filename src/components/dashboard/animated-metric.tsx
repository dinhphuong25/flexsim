'use client';

import { useEffect, useState } from 'react';

interface AnimatedMetricProps {
  value: number | null;
  decimals?: number;
  suffix?: string;
  className?: string;
}

export function AnimatedMetric({ value, decimals = 0, suffix = '', className = '' }: AnimatedMetricProps) {
  const [displayValue, setDisplayValue] = useState(value ?? 0);

  useEffect(() => {
    if (value === null) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      setDisplayValue(value);
      return;
    }

    const startValue = 0;
    const startedAt = performance.now();
    const duration = 400;
    let frameId = 0;

    const animate = (now: number) => {
      const progress = Math.min((now - startedAt) / duration, 1);
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(startValue + (value - startValue) * easedProgress);
      if (progress < 1) frameId = requestAnimationFrame(animate);
    };

    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, [value]);

  if (value === null) return <span className={className}>Chưa có dữ liệu</span>;

  return (
    <span className={className}>
      {displayValue.toLocaleString('vi-VN', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}
      {suffix}
    </span>
  );
}
