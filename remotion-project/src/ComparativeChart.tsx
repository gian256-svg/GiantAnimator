import React, { useMemo } from 'react';
import { interpolate, useCurrentFrame, useVideoConfig, AbsoluteFill } from 'remotion';
import { ComparativeLinePath } from './ComparativeLinePath';
import { ComparativeValueIndicator } from './ComparativeValueIndicator';

export type ComparativeDataPoint = {
  date: string;
  sp500: number;
  nvidia: number;
};

export type ComparativeChartProps = {
  data: ComparativeDataPoint[];
  colorSP500?: string;
  colorNVIDIA?: string;
  lineThickness?: number;
  glowIntensity?: number;
  backgroundColor?: string;
  axisColor?: string;
  labelColor?: string;
};

export const ComparativeChart: React.FC<ComparativeChartProps> = ({
  data,
  colorSP500 = '#00E5FF',
  colorNVIDIA = '#39FF14',
  lineThickness = 8,
  glowIntensity = 2.5,
  backgroundColor = '#000000',
  axisColor = '#333333',
  labelColor = '#bbbbbb',
}) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();

  const maxDrawingFrame = 800; // Complete drawing slightly before end for pause
  const totalPoints = data.length;
  
  // Distribute points evenly across drawing frames
  const pointFrames = useMemo(() => {
    const pf: number[] = [];
    const framesPerPoint = maxDrawingFrame / totalPoints;
    let currentFrame = 0;
    for (let i = 0; i < totalPoints; i++) {
        pf.push(currentFrame);
        currentFrame += framesPerPoint;
    }
    return pf;
  }, [maxDrawingFrame, totalPoints]);

  let currentDataIndex = 0;

  if (frame >= pointFrames[totalPoints - 1]) {
      currentDataIndex = totalPoints - 1;
  } else {
      for (let i = 0; i < totalPoints - 1; i++) {
          const frameStart = pointFrames[i];
          const frameEnd = pointFrames[i + 1];
          if (frame >= frameStart && frame < frameEnd) {
             const progress = (frame - frameStart) / (frameEnd - frameStart);
             currentDataIndex = i + progress;
             break;
          }
      }
  }

  const visibleCount = Math.ceil(currentDataIndex) + 1;
  const visibleData = data.slice(0, visibleCount);

  // Smooth running max logic for zoom out
  const runningMax = useMemo(() => {
    let maxSoFar = 50; // Initial scaling pad
    return data.map((d) => {
      const highest = Math.max(d.sp500, d.nvidia);
      if (highest > maxSoFar) maxSoFar = highest;
      return maxSoFar;
    });
  }, [data]);

  const indexFloor = Math.floor(currentDataIndex);
  const indexCeil = Math.min(indexFloor + 1, totalPoints - 1);
  const fraction = currentDataIndex - indexFloor;
  
  const currentMaxYFromData = interpolate(
    fraction,
    [0, 1],
    [runningMax[indexFloor], runningMax[indexCeil]]
  );

  const minY = Math.min(0, Math.min(...data.map(d => Math.min(d.sp500, d.nvidia))) - 10); // Find actual min if negative exists
  const zoomOutStrength = 1.15; // padding top
  const maxY = currentMaxYFromData * zoomOutStrength; 

  const paddingHorizontal = 120;
  
  // Using 1080x1920 layout logic 
  const topAreaHeight = 350; // No title, but space
  const bottomAreaHeight = 300; // Space for X labels
  const chartHeight = height - topAreaHeight - bottomAreaHeight;
  const paddingVertical = 50;
  
  const chartWidth = width - paddingHorizontal * 2;
  const chartActualHeight = chartHeight - paddingVertical * 2;

  // Render points
  const pointsSP500 = visibleData.map((d, index) => {
    const xRatio = currentDataIndex > 0 ? index / currentDataIndex : 0;
    const x = paddingHorizontal + xRatio * chartWidth;
    const yRatio = (d.sp500 - minY) / (maxY - minY);
    const y = topAreaHeight + paddingVertical + chartActualHeight - yRatio * chartActualHeight;
    return { x, y };
  });

  const pointsNVIDIA = visibleData.map((d, index) => {
    const xRatio = currentDataIndex > 0 ? index / currentDataIndex : 0;
    const x = paddingHorizontal + xRatio * chartWidth;
    const yRatio = (d.nvidia - minY) / (maxY - minY);
    const y = topAreaHeight + paddingVertical + chartActualHeight - yRatio * chartActualHeight;
    return { x, y };
  });

  // Smooth interpolation for the very last point
  if (currentDataIndex > 0 && currentDataIndex < totalPoints - 1) {
      const idx = Math.floor(currentDataIndex);
      const nextData = data[idx + 1];
      const prevData = data[idx];
      const lerpedFraction = currentDataIndex - idx;

      // SP500
      const lerpedSP500 = interpolate(lerpedFraction, [0, 1], [prevData.sp500, nextData.sp500]);
      const xRatio = 1; 
      const x = paddingHorizontal + xRatio * chartWidth;
      let yRatio = (lerpedSP500 - minY) / (maxY - minY);
      pointsSP500[pointsSP500.length - 1] = { x, y: topAreaHeight + paddingVertical + chartActualHeight - yRatio * chartActualHeight };

      // NVIDIA
      const lerpedNVIDIA = interpolate(lerpedFraction, [0, 1], [prevData.nvidia, nextData.nvidia]);
      yRatio = (lerpedNVIDIA - minY) / (maxY - minY);
      pointsNVIDIA[pointsNVIDIA.length - 1] = { x, y: topAreaHeight + paddingVertical + chartActualHeight - yRatio * chartActualHeight };
  }

  const lastPointSP500 = pointsSP500[pointsSP500.length - 1];
  const lastPointNVIDIA = pointsNVIDIA[pointsNVIDIA.length - 1];
  
  const displayValueSP500 = currentDataIndex < totalPoints - 1
        ? interpolate(currentDataIndex - Math.floor(currentDataIndex), [0, 1], [data[Math.floor(currentDataIndex)].sp500, data[Math.floor(currentDataIndex) + 1].sp500])
        : data[totalPoints - 1].sp500;

  const displayValueNVIDIA = currentDataIndex < totalPoints - 1
        ? interpolate(currentDataIndex - Math.floor(currentDataIndex), [0, 1], [data[Math.floor(currentDataIndex)].nvidia, data[Math.floor(currentDataIndex) + 1].nvidia])
        : data[totalPoints - 1].nvidia;

  // Let's create an inline component for Axis so we can have custom logic tailored perfectly here. 
  // Wait, I created ComparativeAxisSystem, let's paste the logic here to simplify and adjust easily since we might need more control.
  
  // Setup Y labels
  let yStep = 10;
  if (maxY > 50) yStep = 20;
  if (maxY > 100) yStep = 50;
  if (maxY > 200) yStep = 100;
  if (maxY > 500) yStep = 250;
  if (maxY > 1000) yStep = 500;
  const yLabels = [];
  let currTick = minY;
  while (currTick <= maxY + yStep) {
      if (currTick >= minY && currTick <= maxY) {
          yLabels.push(currTick);
      }
      currTick += yStep;
  }

  // Setup X labels (displaying 1 label per year)
  // e.g. "Jan 2021", "Jan 2022"
  const xIndices = visibleData.map((d, index) => d.date.startsWith('Jan ') ? index : -1).filter(idx => idx !== -1);
  if (visibleData.length > 0 && xIndices.indexOf(0) === -1) {
       xIndices.unshift(0); // Ensure first label shows
  }
  
  return (
    <AbsoluteFill style={{ backgroundColor }}>
      {/* Background Axis & Lines */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1 }}>
         {/* Y Axis Grid */}
         {yLabels.map((val) => {
           const yRatio = (val - minY) / (maxY - minY);
           const yPos = topAreaHeight + paddingVertical + chartActualHeight - yRatio * chartActualHeight;

           return (
             <div key={`y-${val}`} style={{ position: 'absolute', top: yPos, left: paddingHorizontal, width: chartWidth }}>
               {/* Grid line */}
               {val !== 0 && (
                  <div style={{ width: '100%', height: 2, backgroundColor: axisColor, opacity: 0.5 }} />
               )}
               {/* Main 0 Line strongly highlighted */}
               {val === 0 && (
                  <div style={{ width: '100%', height: 4, backgroundColor: '#ffffff', opacity: 0.8 }} />
               )}
               <div style={{
                 position: 'absolute',
                 left: -100,
                 top: -15, 
                 width: 80,
                 textAlign: 'right',
                 color: labelColor,
                 fontSize: 28, 
                 fontFamily: 'sans-serif',
                 fontWeight: 300,
               }}>
                 {val}%
               </div>
             </div>
           );
         })}
         
         {/* Main Y vertical line */}
         <div style={{ position: 'absolute', left: paddingHorizontal, top: topAreaHeight, width: 4, height: chartHeight, backgroundColor: axisColor, opacity: 0.8 }} />

         {/* X Axis Grid / Labels */}
         {xIndices.map((idx) => {
            const dataPoint = visibleData[idx];
            if (!dataPoint) return null;
            const xRatio = idx / (totalPoints - 1 || 1); // fixed max width layout!
            // Wait, previous xRatio used `currentDataIndex` so it zoomed out horizontally too.
            // Let's use `currentDataIndex` to maintain the progressive layout instead of totalPoints
            const currentXRatio = idx / (currentDataIndex || 1);
            if (currentXRatio > 1) return null; // not visible yet
            const xPos = paddingHorizontal + currentXRatio * chartWidth;
            const year = dataPoint.date.split(' ')[1];

            return (
               <div key={`x-${idx}-${dataPoint.date}`} style={{ position: 'absolute', left: xPos, top: topAreaHeight + paddingVertical + chartActualHeight }}>
                  <div style={{ position: 'absolute', left: -2, top: 0, width: 4, height: 16, backgroundColor: axisColor }} />
                  <div style={{ 
                       position: 'absolute',
                       left: -50,
                       top: 25,
                       width: 100,
                       textAlign: 'center',
                       color: labelColor,
                       fontSize: 32,
                       fontFamily: 'sans-serif',
                       fontWeight: 400,
                  }}>
                    {year}
                  </div>
               </div>
            );
         })}
      </div>

      <ComparativeLinePath
        data={visibleData}
        pointsSP500={pointsSP500}
        pointsNVIDIA={pointsNVIDIA}
        colorSP500={colorSP500}
        colorNVIDIA={colorNVIDIA}
        lineThickness={lineThickness}
        glowIntensity={glowIntensity}
      />

      {/* Value Indicators */}
      {lastPointSP500 && (
        <ComparativeValueIndicator
            x={lastPointSP500.x}
            y={lastPointSP500.y}
            value={displayValueSP500}
            label="S&P 500"
            color={colorSP500}
            glowIntensity={glowIntensity}
        />
      )}
      
      {lastPointNVIDIA && (
        <ComparativeValueIndicator
            x={lastPointNVIDIA.x}
            y={lastPointNVIDIA.y}
            value={displayValueNVIDIA}
            label="NVIDIA"
            color={colorNVIDIA}
            glowIntensity={glowIntensity}
            isNvidia={true} // For positioning tweaks if needed
        />
      )}
    </AbsoluteFill>
  );
};
