"use client";

import { useMemo } from "react";

interface MiniSparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  showArea?: boolean;
  className?: string;
}

export function MiniSparkline({
  data,
  width = 80,
  height = 24,
  color,
  showArea = true,
  className,
}: MiniSparklineProps) {
  const { points, areaPath, strokeColor } = useMemo(() => {
    if (!data || data.length < 2) {
      return { points: "", areaPath: "", strokeColor: color || "#6b7280" };
    }

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;

    const paddingX = 1;
    const paddingY = 2;
    const innerWidth = width - paddingX * 2;
    const innerHeight = height - paddingY * 2;

    const coords = data.map((value, index) => {
      const x = paddingX + (index / (data.length - 1)) * innerWidth;
      const y = paddingY + innerHeight - ((value - min) / range) * innerHeight;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });

    // Determine color based on trend: up = emerald, down = rose
    let determinedColor = color || "#6b7280";
    if (!color) {
      const firstHalf = data.slice(0, Math.ceil(data.length / 2));
      const secondHalf = data.slice(Math.ceil(data.length / 2));
      const avgFirst = firstHalf.reduce((s, v) => s + v, 0) / firstHalf.length;
      const avgSecond = secondHalf.reduce((s, v) => s + v, 0) / secondHalf.length;
      determinedColor = avgSecond >= avgFirst ? "#34d399" : "#fb7185";
    }

    const pointsStr = coords.join(" ");

    // Build area path: start at bottom-left, go through all points, then bottom-right
    const areaCoords = [
      `${paddingX},${height}`,
      ...coords,
      `${paddingX + innerWidth},${height}`,
    ].join(" ");
    const areaPathStr = areaCoords;

    return {
      points: pointsStr,
      areaPath: areaPathStr,
      strokeColor: determinedColor,
    };
  }, [data, width, height, color]);

  if (!data || data.length < 2) {
    return (
      <div
        className={className}
        style={{ width, height }}
      />
    );
  }

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {showArea && (
        <polygon
          points={areaPath}
          fill={strokeColor}
          opacity={0.1}
        />
      )}
      <polyline
        points={points}
        stroke={strokeColor}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}
