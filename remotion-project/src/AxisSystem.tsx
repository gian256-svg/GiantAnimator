import React from 'react';
import { AbsoluteFill } from 'remotion';

export type AxisSystemProps = {
  width: number;
  height: number;
  minY: number;
  maxY: number;
  visibleData: { date: string; value: number }[];
  showGrid: boolean;
  gridOpacity: number;
  axisColor: string;
  labelColor: string;
  showYearMarkers: boolean;
  points: { x: number; y: number }[];
  topOffset?: number;
  bottomOffset?: number;
};

export const AxisSystem: React.FC<AxisSystemProps> = ({
  width,
  height,
  minY,
  maxY,
  visibleData,
  showGrid,
  gridOpacity,
  axisColor,
  labelColor,
  showYearMarkers,
  points,
  topOffset = 0,
  bottomOffset = 0,
}) => {
  const T = resolveTheme(theme ?? 'dark');
  const rangeY = maxY - minY;
  let stepY = 10;
  
  if (rangeY > 100) stepY = 20;
  if (rangeY > 200) stepY = 50;

  const firstLabel = Math.floor(minY / stepY) * stepY;
  const gridLines = [];
  for (let yVal = firstLabel; yVal <= maxY; yVal += stepY) {
    if (yVal >= minY) {
      gridLines.push(yVal);
    }
  }

  const yearMarkers: { label: string; x: number }[] = [];
  if (showYearMarkers) {
    visibleData.forEach((d, index) => {
      if (d.date.endsWith('-01')) {
        yearMarkers.push({
          label: d.date.split('-')[0],
          x: points[index]?.x || 0
        });
      }
    });
  }

  const chartAreaHeight = height - topOffset - bottomOffset;

  return (
    <AbsoluteFill>
      {/* Grid Lines and Y-Axis Labels */}
      {gridLines.map((val) => {
        // Apply vertical padding mapped from actual rendered chart bounds
        const yRatio = (val - minY) / (maxY - minY);
        // The LinePath rendering uses a 50px vertical padding. We mimic it here.
        const paddingVertical = 50;
        const boundedChartHeight = chartAreaHeight - paddingVertical * 2;
        
        // Match the Y position logic exactly as done in the LinePath
        const yPos = topOffset + paddingVertical + boundedChartHeight - yRatio * boundedChartHeight;
        
        return (
          <div key={`grid-y-${val}`}>
            {showGrid && (
              <div
                style={{
                  position: 'absolute',
                  top: yPos,
                  left: 0,
                  width: width,
                  height: 1,
                  backgroundColor: axisColor,
                  opacity: gridOpacity,
                }}
              />
            )}
            <div
              style={{
                position: 'absolute',
                top: yPos - 20,
                left: 20,
                color: labelColor,
                fontFamily: 'sans-serif',
                fontSize: 36,
                fontWeight: 'bold',
                opacity: 0.8,
              }}
            >
              ${val}
            </div>
          </div>
        );
      })}

      {/* X-Axis Lines and Labels */}
      {yearMarkers.map((marker) => (
        <div key={`grid-x-${marker.label}`}>
          {showGrid && (
            <div
              style={{
                position: 'absolute',
                top: topOffset,
                left: marker.x,
                width: 1,
                height: chartAreaHeight,
                backgroundColor: axisColor,
                opacity: gridOpacity / 2,
              }}
            />
          )}
          <div
            style={{
              position: 'absolute',
              top: height - bottomOffset + 20, // place right below the chart area
              left: marker.x + 10,
              color: labelColor,
              fontFamily: 'sans-serif',
              fontSize: 36,
              fontWeight: 'bold',
              opacity: 0.8,
            }}
          >
            {marker.label}
          </div>
        </div>
      ))}
    </AbsoluteFill>
  );
};

