import React, { useId } from "react";
import {
  spring,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  AbsoluteFill,
} from "remotion";
import { Theme, resolveTheme } from '../theme';
import { DynamicBackground } from "../layout/DynamicBackground";

export interface SunburstNode {
  label: string;
  value?: number;
  children?: SunburstNode[];
}

export interface SunburstChartProps {
  data: SunburstNode;
  title: string;
  subtitle?: string;
  theme?: string;
  backgroundColor?: string;
  colors?: string[];
  textColor?: string;
  bgStyle?: 'none' | 'mesh' | 'grid';
}

export const SunburstChart: React.FC<SunburstChartProps> = ({
  theme = "dark",
  data,
  title,
  subtitle,
  backgroundColor,
  textColor,
  bgStyle = "none",
}) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const initialT = resolveTheme(theme ?? 'dark');
  const resolvedBg = backgroundColor ?? initialT.background;
  const T = resolveTheme(theme ?? 'dark', resolvedBg);

  // â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”
  // ÃREA ÃšTIL 4K (REGRA GLOBAL)
  // â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”
  const cx = width / 2;
  const cy = height / 2;
  const maxRadius = height * 0.28;
  const innerRadius = maxRadius * 0.2;
  const ringWidth = (maxRadius - innerRadius) / 3; // Supondo 3 nÃ­veis mÃ©dios

  const getSum = (node: SunburstNode): number => {
    if (node.value) return node.value;
    if (node.children) return node.children.reduce((acc, c) => acc + getSum(c), 0);
    return 1;
  };

  const renderLevel = (node: SunburstNode, level: number, sAngle: number, eAngle: number, pColor: string): React.ReactNode => {
    const range = eAngle - sAngle;
    if (range < 0.01) return null;

    const pop = spring({ frame: frame - 20 - level * 10, fps, config: { damping: 14, stiffness: 60 } });
    if (pop <= 0) return null;

    const r0 = innerRadius + (level - 1) * ringWidth;
    const r1 = r0 + ringWidth * pop;

    const getX = (r: number, a: number) => cx + Math.cos(a - Math.PI / 2) * r;
    const getY = (r: number, a: number) => cy + Math.sin(a - Math.PI / 2) * r;
    const largeArc = range > Math.PI ? 1 : 0;
    
    const d = `M ${getX(r0, sAngle)} ${getY(r0, sAngle)}
               A ${r0} ${r0} 0 ${largeArc} 1 ${getX(r0, eAngle)} ${getY(r0, eAngle)}
               L ${getX(r1, eAngle)} ${getY(r1, eAngle)}
               A ${r1} ${r1} 0 ${largeArc} 0 ${getX(r1, sAngle)} ${getY(r1, sAngle)}
               Z`;

    const color = level === 1 ? T.colors[Math.abs(hash(node.label)) % T.colors.length] : pColor;
    const bright = 1 - (level - 1) * 0.08;

    return (
      <g key={`${node.label}-${level}`}>
        <path d={d} fill={color} stroke={T.background} strokeWidth={2} style={{ filter: `brightness(${bright})` }} opacity={pop} />
        {range > 0.15 && pop > 0.9 && (
          <text
            x={getX(r0 + (r1 - r0) / 2, sAngle + range / 2)}
            y={getY(r0 + (r1 - r0) / 2, sAngle + range / 2)}
            textAnchor="middle" dominantBaseline="middle"
            style={{ fontSize: Theme.typography.axis.size, fill: "#fff", fontWeight: 700, fontFamily: Theme.typography.fontFamily }}
            transform={`rotate(${(sAngle + range / 2) * (180 / Math.PI)}, ${getX(r0 + (r1 - r0) / 2, sAngle + range / 2)}, ${getY(r0 + (r1 - r0) / 2, sAngle + range / 2)})`}
          >
             {node.label}
          </text>
        )}
        {node.children && (() => {
          let curA = sAngle;
          const sum = getSum(node);
          return node.children.map(c => {
            const size = (getSum(c) / sum) * range;
            const res = renderLevel(c, level + 1, curA, curA + size, color);
            curA += size;
            return res;
          });
        })()}
      </g>
    );
  };

  return (
    <AbsoluteFill style={{ fontFamily: Theme.typography.fontFamily }}>
      <DynamicBackground 
        style={bgStyle} 
        baseColor={T.background} 
        accentColor={T.colors[0]} 
      />
      <div style={{ position: 'absolute', top: 50, width: '100%', textAlign: 'center', opacity: interpolate(frame, [0, 15], [0, 1]) }}>
        {title && <div style={{ fontSize: Theme.typography.title.size, fontWeight: Theme.typography.title.weight, color: Theme.typography.title.color, fontFamily: Theme.typography.fontFamily }}>{title}</div>}
        {subtitle && <div style={{ fontSize: Theme.typography.subtitle.size, color: Theme.typography.subtitle.color, fontFamily: Theme.typography.fontFamily }}>{subtitle}</div>}
      </div>
      <svg width={width} height={height} style={{ overflow: 'visible', position: 'relative', zIndex: 1 }}>
        {renderLevel(data, 1, 0, Math.PI * 2, T.colors[0])}
      </svg>
    </AbsoluteFill>
  );
};

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = s.charCodeAt(i) + ((h << 5) - h);
  return h;
}
