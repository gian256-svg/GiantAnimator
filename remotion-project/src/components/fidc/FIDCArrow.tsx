import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';

export const FIDCArrow: React.FC<{ arrow: any }> = ({ arrow }) => {
  const frame = useCurrentFrame();
  const T = resolveTheme(theme ?? 'dark');
  
  const duration = arrow.direction === 'path' ? 40 : 20;
  const progress = interpolate(Math.max(0, frame - arrow.delay), [0, duration], [0, 1], { extrapolateRight: 'clamp' });

  if (progress === 0) return null;

  const color = '#B0B0B0';

  if (arrow.direction === 'path') {
    const x1 = arrow.from[0];
    const y1 = arrow.from[1];
    const x2 = arrow.to[0];
    const y2 = arrow.to[1];
    
    const pathTotalLen = Math.abs(x2 - x1) + Math.abs(y2 - y1);
    
    return (
      <div style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', zIndex: 5 }}>
        <svg width="3840" height="2160">
           <defs>
              <mask id={`mask-${arrow.id}`}>
                <path
                   d={`M ${x1} ${y1} L ${x2} ${y1} L ${x2} ${y2}`}
                   fill="none"
                   stroke="white"
                   strokeWidth={48}
                   strokeDasharray={pathTotalLen}
                   strokeDashoffset={pathTotalLen * (1 - progress)}
                />
              </mask>
           </defs>
           <g mask={`url(#mask-${arrow.id})`}>
              <path
                d={`M ${x1} ${y1} L ${x2} ${y1} L ${x2} ${y2}`}
                fill="none"
                stroke={color}
                strokeWidth={8}
                strokeDasharray="20 20"
                strokeLinejoin="round"
              />
           </g>
           {progress > 0.95 && (
             <polygon points={`${x2-12},${y2+15} ${x2+12},${y2+15} ${x2},${y2}`} fill={color} />
           )}
        </svg>
        {arrow.label && (
          <div style={{
            position: 'absolute',
            left: (x1 + x2) / 2,
            top: y1 + 50,
            transform: `translate(-50%, 0)`,
            opacity: interpolate(progress, [0.5, 1], [0, 1]),
            color: '#282B2F',
            fontFamily: "'Poppins', sans-serif",
            fontWeight: 700,
            fontSize: 48,
            textAlign: 'center',
            whiteSpace: 'pre-wrap',
            lineHeight: 1.3,
            width: 1200,
          }}>
            {arrow.label}
          </div>
        )}
      </div>
    );
  }

  const dx = arrow.to[0] - arrow.from[0];
  const dy = arrow.to[1] - arrow.from[1];
  
  const currentX = arrow.from[0] + dx * progress;
  const currentY = arrow.from[1] + dy * progress;

  let labelTop = arrow.from[1];
  let labelLeft = arrow.from[0] + dx / 2;
  
  if (arrow.labelPosition === 'top') {
    labelTop = arrow.from[1] - 140;
  } else if (arrow.labelPosition === 'bottom') {
    labelTop = arrow.from[1] + 50;
  } else {
    // vertical arrows logic for labels if any, but they don't have labels right now.
  }

  return (
    <div style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', zIndex: 5 }}>
      <svg width="3840" height="2160">
         <defs>
              <marker id={`arrowhead-${arrow.id}`} markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                <polygon points="0 0, 6 3, 0 6" fill={color} />
              </marker>
         </defs>
         <line
           x1={arrow.from[0]}
           y1={arrow.from[1]}
           x2={currentX}
           y2={currentY}
           stroke={color}
           strokeWidth={8}
           strokeDasharray="20 20"
           markerEnd={progress > 0.1 ? `url(#arrowhead-${arrow.id})` : ""}
         />
      </svg>
      {arrow.label && (
          <div style={{
            position: 'absolute',
            left: labelLeft,
            top: labelTop,
            transform: `translate(-50%, 0)`,
            opacity: interpolate(progress, [0.5, 1], [0, 1]),
            color: '#282B2F',
            fontFamily: "'Poppins', sans-serif",
            fontWeight: 700,
            fontSize: 48,
            textAlign: 'center',
            whiteSpace: 'pre-wrap',
            lineHeight: 1.3,
            width: 1000,
          }}>
            {arrow.label}
          </div>
      )}
    </div>
  );
};
