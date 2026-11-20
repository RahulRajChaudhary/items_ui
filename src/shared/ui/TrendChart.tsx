"use client";
import { useEffect, useRef, useState } from "react";

/**
 * The one chart of the product: a line chart on a dashed grid with a labelled Y axis.
 * `points` are values in order (left to right); `yLabels` are the axis labels from top to bottom;
 * `emptyText` shows instead of a line when there are no points. Always fits its container: it measures the width and draws at that size, so text stays readable.
 * Must not fetch or format money itself: labels come from the caller.
 */
export function TrendChart({ points, yLabels, emptyText = "No data found.", height = 224 }: { points: number[]; yLabels: string[]; emptyText?: string; height?: number }) {
  const box = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(600);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => e && setW(Math.max(240, Math.round(e.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const left = 44;
  const rows = Math.max(1, yLabels.length - 1);
  const max = Math.max(1, ...points);
  const x = (i: number) => left + (points.length < 2 ? (w - left) / 2 : (i / (points.length - 1)) * (w - left - 8));
  const y = (v: number) => 8 + (1 - v / max) * (height - 24);
  return (
    <div ref={box} className="w-full">
    <svg viewBox={`0 0 ${w} ${height}`} role="img" aria-label="Trend chart" width={w} height={height} className="block">
      {yLabels.map((l, i) => {
        const gy = 8 + (i / rows) * (height - 24);
        return (
          <g key={l}>
            <text x={left - 8} y={gy + 4} textAnchor="end" fontSize="11" className="fill-mute">{l}</text>
            <line x1={left} x2={w - 8} y1={gy} y2={gy} className="stroke-line" strokeDasharray="3 3" />
          </g>
        );
      })}
      {points.length === 0 ? (
        <text x={(w + left) / 2} y={height / 2} textAnchor="middle" fontSize="14" className="fill-mute">{emptyText}</text>
      ) : (
        <>
          <polyline fill="none" strokeWidth="1.5" className="stroke-link" points={points.map((v, i) => `${x(i)},${y(v)}`).join(" ")} />
          {points.map((v, i) => <circle key={i} cx={x(i)} cy={y(v)} r="3" className="fill-link" />)}
        </>
      )}
    </svg>
    </div>
  );
}
