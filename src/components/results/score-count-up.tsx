"use client";

import { useEffect, useState } from "react";

interface ScoreCountUpProps {
  value: number;
}

export function ScoreCountUp({ value }: ScoreCountUpProps) {
  const target = Math.max(0, Math.min(100, Math.round(value)));
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let frame = 0;
    const duration = 720;
    const startTime = performance.now();

    function tick(now: number) {
      const progress = Math.min(1, (now - startTime) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.round(target * eased));

      if (progress < 1) {
        frame = window.requestAnimationFrame(tick);
      }
    }

    frame = window.requestAnimationFrame(tick);

    return () => window.cancelAnimationFrame(frame);
  }, [target]);

  return <span>{displayValue}</span>;
}
