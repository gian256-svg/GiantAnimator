import React from 'react';
import { AbsoluteFill } from 'remotion';
import { FlowItem } from './FlowItem';
import { Connector } from './Connector';

export const FlowLayout: React.FC<{ data: any }> = ({ data }) => {
  return (
    <AbsoluteFill style={{ backgroundColor: 'transparent' }}>
       {/* SVG layer for connectors (behind items) */}
       <AbsoluteFill>
         <svg width="3840" height="2160">
            <defs>
              <marker id="arrowhead" markerWidth="6" markerHeight="6" 
                refX="5" refY="3" orient="auto">
                <polygon points="0 0, 6 3, 0 6" fill="#000000" opacity={0.4} />
              </marker>
            </defs>
            {data.connectors.map((connector: any, i: number) => {
               const fromNode = data.nodes.find((n: any) => n.id === connector.from);
               const toNode = data.nodes.find((n: any) => n.id === connector.to);
               if (!fromNode || !toNode) return null;
               
               return <Connector key={i} from={fromNode.position} to={toNode.position} delay={connector.delay} />;
            })}
         </svg>
       </AbsoluteFill>

       {/* Items layer */}
       {data.nodes.map((node: any) => (
         <FlowItem key={node.id} node={node} />
       ))}
    </AbsoluteFill>
  );
};
