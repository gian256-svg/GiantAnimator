import React from 'react';

export type ComparativeAxisSystemProps = {
  width: number;
  height: number;
  minY: number;
  maxY: number;
  visibleData: { date: string }[];
  showGrid?: boolean;
  axisColor?: string;
  labelColor?: string;
  pointsSP500: { x: number; y: number }[];
  topOffset: number;
  bottomOffset: number;
};

export const ComparativeAxisSystem: React.FC<ComparativeAxisSystemProps> = ({
  width,
  height,
  minY,
  maxY,
  visibleData,
  showGrid = true,
  axisColor = '#444444',
  labelColor = '#cccccc',
  topOffset,
  bottomOffset,
}) => {
  const chartHeight = height - topOffset - bottomOffset;
  const paddingHorizontal = 100;
  const chartWidth = width - paddingHorizontal * 2;
  const paddingVertical = 50;
  const chartActualHeight = chartHeight - paddingVertical * 2;

  // Decide dynamically the step for Y labels based on maxY
  let yStep = 10;
  if (maxY > 50) yStep = 20;
  if (maxY > 100) yStep = 50;
  if (maxY > 200) yStep = 100;
  if (maxY > 500) yStep = 250;
  if (maxY > 1000) yStep = 500;
  
  const yLabels = [];
  const startTick = minY;
  let currTick = startTick;
  while (currTick <= maxY + yStep) {
      if (currTick >= minY && currTick <= maxY) {
          yLabels.push(currTick);
      }
      currTick += yStep;
  }

  // Draw X-axis labels (Dates). Let's pick a few evenly spaced dates from visibleData
  const numXBands = 4;
  const xIndices = [];
  
  if (visibleData.length > 0) {
      xIndices.push(0); // Add first label 
      
      const step = Math.floor(visibleData.length / numXBands);
      if (step > 0) {
          for (let i = 1; i < numXBands; i++) {
              if (i * step < visibleData.length - 1) { // avoid clashing with the last label
                  xIndices.push(i * step);
              }
          }
      }
      // Usually would add the last, but let's just spread them evenly based on current visible
      // This replicates the continuous timeline
  }

  return (
    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1 }}>
      {/* Y-axis Labels & Grid Lines */}
      {yLabels.map((val) => {
        const yRatio = (val - minY) / (maxY - minY);
        const yPos = topOffset + paddingVertical + chartActualHeight - yRatio * chartActualHeight;

        return (
          <div key={`y-${val}`} style={{ position: 'absolute', top: yPos, left: 0, width: '100%' }}>
            {showGrid && val > 0 && (
              <div style={{ position: 'absolute', left: paddingHorizontal, top: 0, width: chartWidth, height: 1, backgroundColor: axisColor, opacity: 0.15 }} />
            )}
            <div style={{
              position: 'absolute',
              left: 20,
              top: -15, // center text vertically relative to the line
              width: paddingHorizontal - 30,
              textAlign: 'right',
              color: labelColor,
              fontSize: 24, // adapted sizes for mobile view 
              fontFamily: 'sans-serif',
              fontWeight: 300,
            }}>
              {Math.round(val)}%
            </div>
          </div>
        );
      })}

      {/* Main axes lines */}
      <div style={{ position: 'absolute', left: paddingHorizontal, top: topOffset + paddingVertical, width: 2, height: chartActualHeight, backgroundColor: axisColor }} />
      <div style={{ position: 'absolute', left: paddingHorizontal, top: topOffset + paddingVertical + chartActualHeight, width: chartWidth, height: 2, backgroundColor: axisColor }} />

      {/* X-axis Labels */}
      {xIndices.map((idx) => {
         const dataPoint = visibleData[idx];
         if (!dataPoint) return null;
         
         const xRatio = idx / (visibleData.length - 1 || 1);
         const xPos = paddingHorizontal + xRatio * chartWidth;
         
         // Format the date label, e.g. "Jan 2021" -> "1/21" or just "2021" based on pref
         // Let's keep it simple and output directly 
         const [, year] = dataPoint.date.split(' ');
         
         // Only show year to avoid clutter
         const isFirstOfYear = dataPoint.date.startsWith('Jan ');

         return (
            <div key={`x-${idx}-${dataPoint.date}`} style={{ position: 'absolute', left: xPos, top: topOffset + paddingVertical + chartActualHeight + 20 }}>
               {/* Tick mark */}
               <div style={{ position: 'absolute', left: 0, top: -20, width: 2, height: 10, backgroundColor: axisColor }} />
               <div style={{ 
                    position: 'absolute',
                    left: -40,
                    top: 10,
                    width: 80,
                    textAlign: 'center',
                    color: labelColor,
                    fontSize: 24,
                    fontFamily: 'sans-serif',
                    fontWeight: isFirstOfYear ? 500 : 300,
               }}>
                 {isFirstOfYear ? year : dataPoint.date.split(' ')[0]}
               </div>
            </div>
         );
      })}
    </div>
  );
};
