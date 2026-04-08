import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { StepItem } from '../components/StepItem';
import { CircularArrow } from '../components/CircularArrow';

export const CircularFlow: React.FC<{ data: any }> = ({ data }) => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill style={{ backgroundColor: 'transparent' }}>
      {/* Arrows */}
      {data.nodes.map((node: any, i: number) => {
        if (i === data.nodes.length - 1) return null; // No arrow after last node
        const nextNode = data.nodes[i + 1];
        
        // Arrow starts a bit after the node delay to give it time to animate in
        const arrowDelay = node.delay + 30;
        // Arrow duration should be long enough to fill the gap nicely
        const arrowDuration = 40;

        return (
          <CircularArrow 
            key={`arr-${node.id}`} 
            from={node.position} 
            to={nextNode.position} 
            delay={arrowDelay}
            duration={arrowDuration}
          />
        );
      })}

      {/* Nodes */}
      {data.nodes.map((node: any) => {
        // Active if frame is at or passed this node's delay
        const isActive = frame >= node.delay;
        return <StepItem key={`node-${node.id}`} node={node} isActive={isActive} />;
      })}
    </AbsoluteFill>
  );
};
