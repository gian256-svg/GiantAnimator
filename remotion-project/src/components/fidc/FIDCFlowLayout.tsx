import React from 'react';
import { AbsoluteFill } from 'remotion';
import { FIDCFlowItem } from './FIDCFlowItem';
import { FIDCArrow } from './FIDCArrow';

export const FIDCFlowLayout: React.FC<{ data: any }> = ({ data }) => {
  return (
    <AbsoluteFill style={{ backgroundColor: 'transparent' }}>
       {data.arrows.map((arrow: any) => (
          <FIDCArrow key={`arrow-${arrow.id}`} arrow={arrow} />
       ))}
       {data.nodes.map((node: any) => (
         <FIDCFlowItem key={`node-${node.id}`} node={node} />
       ))}
    </AbsoluteFill>
  );
};
