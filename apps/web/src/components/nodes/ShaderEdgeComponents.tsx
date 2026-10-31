'use client';

import { BaseEdge, BezierEdge, StraightEdge, EdgeProps } from 'reactflow';
import { cn } from '@/lib/utils';

interface ShaderEdgeProps extends EdgeProps {
  data?: { type?: string };
}

export const ShaderEdgeComponents = {
  ShaderEdge: AnimatedShaderEdge,
  DefaultEdge: StyledBezierEdge,
};

function AnimatedShaderEdge({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, markerEnd, style, data, ...props }: ShaderEdgeProps) {
  const color = '#00F0FF';
  const glowColor = 'rgba(0, 240, 255, 0.4)';

  return (
    <BezierEdge
      id={id}
      sourceX={sourceX}
      sourceY={sourceY}
      targetX={targetX}
      targetY={targetY}
      sourcePosition={sourcePosition}
      targetPosition={targetPosition}
      markerEnd={markerEnd}
      style={{
        ...style,
        stroke: color,
        strokeWidth: 2,
        strokeDasharray: '8, 4',
        filter: `drop-shadow(0 0 4px ${glowColor})`,
        transition: 'all 0.3s ease',
      }}
      {...props}
    >
      <animate
        attributeName="stroke-dashoffset"
        from="12"
        to="0"
        dur="1s"
        repeatCount="indefinite"
      />
    </BezierEdge>
  );
}

function StyledBezierEdge({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, markerEnd, style, data, ...props }: ShaderEdgeProps) {
  const color = data?.type === 'shader' ? '#00F0FF' : '#6B7280';
  const width = data?.type === 'shader' ? 2 : 1.5;

  return (
    <BezierEdge
      id={id}
      sourceX={sourceX}
      sourceY={sourceY}
      targetX={targetX}
      targetY={targetY}
      sourcePosition={sourcePosition}
      targetPosition={targetPosition}
      markerEnd={{
        ...markerEnd,
        type: MarkerType.ArrowClosed,
        color,
        width: 12,
        height: 12,
      }}
      style={{
        ...style,
        stroke: color,
        strokeWidth: width,
        opacity: 0.8,
        transition: 'all 0.2s ease',
      }}
      {...props}
    />
  );
}

function StyledStraightEdge({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, markerEnd, style, ...props }: ShaderEdgeProps) {
  return (
    <StraightEdge
      id={id}
      sourceX={sourceX}
      sourceY={sourceY}
      targetX={targetX}
      targetY={targetY}
      sourcePosition={sourcePosition}
      targetPosition={targetPosition}
      markerEnd={markerEnd}
      style={{
        ...style,
        stroke: '#6B7280',
        strokeWidth: 1.5,
        strokeDasharray: '4, 2',
      }}
      {...props}
    />
  );
}

import { MarkerType } from 'reactflow';