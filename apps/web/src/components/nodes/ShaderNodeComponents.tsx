'use client';

import { Handle, Position, HandleType } from 'reactflow';
import { cn } from '@/lib/utils';

interface ShaderNodeProps {
  data: {
    label: string;
    type: string;
    inputs: { name: string; type: string; value?: any }[];
    outputs: { name: string; type: string }[];
    params: Record<string, any>;
  };
  selected: boolean;
}

const typeColors: Record<string, string> = {
  shader: '#00F0FF',
  color: '#FF007A',
  vector: '#FFB800',
  float: '#00FF88',
  int: '#FF6B35',
  bool: '#9B59B6',
  texture: '#00D4AA',
  bsdf: '#FF3366',
  custom: '#6B7280',
};

const typeIcons: Record<string, string> = {
  shader: '◇',
  color: '●',
  vector: '▲',
  float: '◆',
  int: '#',
  bool: '☐',
  texture: '■',
  bsdf: '◆',
};

export const ShaderNodeComponents = {
  OutputNode: ShaderNode,
  BSDFNode: ShaderNode,
  TexCoordNode: ShaderNode,
  ImageTextureNode: ShaderNode,
  MixShaderNode: ShaderNode,
  AddShaderNode: ShaderNode,
  DiffuseBSDFNode: ShaderNode,
  GlossyBSDFNode: ShaderNode,
  GlassBSDFNode: ShaderNode,
  EmissionNode: ShaderNode,
  ColorRampNode: ShaderNode,
  MathNode: ShaderNode,
  VectorMathNode: ShaderNode,
  SeparateXYZNode: ShaderNode,
  CombineXYZNode: ShaderNode,
  NoiseTextureNode: ShaderNode,
  VoronoiTextureNode: ShaderNode,
  WaveTextureNode: ShaderNode,
  MagicTextureNode: ShaderNode,
  RGBCurvesNode: ShaderNode,
  HueSaturationNode: ShaderNode,
  GammaNode: ShaderNode,
  BrightnessContrastNode: ShaderNode,
  InvertNode: ShaderNode,
  MixNode: ShaderNode,
  MixRGBNode: ShaderNode,
  SeparateColorNode: ShaderNode,
  CombineColorNode: ShaderNode,
};

function ShaderNode({ data, selected }: ShaderNodeProps) {
  const color = typeColors[data.type] || typeColors.custom;
  const icon = typeIcons[data.type] || '?';

  return (
    <div
      className={cn(
        'min-w-[180px] max-w-[280px] rounded-lg border-2 transition-all duration-150',
        'bg-studio-panel/90 backdrop-blur-sm',
        selected ? 'border-studio-cyan shadow-[0_0_15px_rgba(0,240,255,0.3)]' : 'border-studio-border'
      )}
      style={{ borderColor: color }}
    >
      <div className="flex items-center justify-between px-3 py-2 border-b border-studio-border/50 bg-studio-bg-elevated/50 rounded-t-lg">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 flex items-center justify-center rounded text-xs font-bold" style={{ backgroundColor: color, color: '#0D0E12' }}>
            {icon}
          </span>
          <span className="text-sm font-medium text-studio-text truncate">{data.label}</span>
        </div>
        <span className="text-[10px] text-studio-text-muted uppercase tracking-wider px-1.5 py-0.5 rounded bg-studio-bg" style={{ border: `1px solid ${color}40` }}>
          {data.type}
        </span>
      </div>

      <div className="p-2 space-y-1.5">
        <div className="flex gap-4">
          <div className="flex-1 space-y-1">
            {data.inputs.map((input, index) => (
              <Handle
                key={`input-${input.name}`}
                id={input.name}
                type="target"
                position={Position.Left}
                className="w-2 h-2"
                style={{
                  backgroundColor: typeColors[input.type] || '#6B7280',
                  borderColor: typeColors[input.type] || '#6B7280',
                }}
              />
            ))}
          </div>
          <div className="flex-1 space-y-1">
            {data.inputs.map((input, index) => (
              <div key={`input-label-${input.name}`} className="flex items-center gap-2 text-xs">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: typeColors[input.type] || '#6B7280' }} />
                <span className="text-studio-text truncate">{input.name}</span>
                {input.value !== undefined && (
                  <span className="text-studio-text-muted font-mono ml-auto text-[10px]">
                    {typeof input.value === 'string' ? input.value : input.value.toString()}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-4 pt-2 border-t border-studio-border/30">
          <div className="flex-1 space-y-1">
            {data.outputs.map((output, index) => (
              <div key={`output-label-${output.name}`} className="flex items-center gap-2 text-xs justify-end">
                <span className="text-studio-text truncate mr-auto">{output.name}</span>
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: typeColors[output.type] || '#6B7280' }} />
              </div>
            ))}
          </div>
          <div className="flex-1 space-y-1">
            {data.outputs.map((output, index) => (
              <Handle
                key={`output-${output.name}`}
                id={output.name}
                type="source"
                position={Position.Right}
                className="w-2 h-2"
                style={{
                  backgroundColor: typeColors[output.type] || '#6B7280',
                  borderColor: typeColors[output.type] || '#6B7280',
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {Object.keys(data.params).length > 0 && (
        <div className="px-3 pb-3 pt-2 border-t border-studio-border/30">
          <div className="text-xs font-medium text-studio-text-muted uppercase tracking-wider mb-1">Parameters</div>
          <div className="space-y-1.5">
            {Object.entries(data.params).map(([key, value]) => (
              <ParameterRow key={key} name={key} value={value} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ParameterRow({ name, value }: { name: string; value: any }) {
  if (typeof value === 'boolean') {
    return (
      <label className="flex items-center gap-2 text-xs cursor-pointer">
        <input
          type="checkbox"
          checked={value}
          onChange={() => {}}
          className="w-3 h-3 accent-studio-cyan rounded border-studio-border bg-studio-bg"
        />
        <span className="text-studio-text-muted">{name}</span>
      </label>
    );
  }
  if (typeof value === 'number') {
    return (
      <div className="flex items-center gap-2 text-xs">
        <span className="text-studio-text-muted w-20 shrink-0">{name}</span>
        <input
          type="number"
          value={value}
          onChange={() => {}}
          className="studio-input flex-1 text-[10px] py-0.5"
          step="0.01"
        />
      </div>
    );
  }
  if (typeof value === 'string') {
    return (
      <div className="flex items-center gap-2 text-xs">
        <span className="text-studio-text-muted w-20 shrink-0">{name}</span>
        <input
          type="text"
          value={value}
          onChange={() => {}}
          className="studio-input flex-1 text-[10px] py-0.5"
        />
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="text-studio-text-muted w-20 shrink-0">{name}</span>
      <span className="text-studio-text-muted text-[10px]">({typeof value})</span>
    </div>
  );
}

export const DefaultNode = ({ data, selected }: ShaderNodeProps) => (
  <ShaderNode data={data} selected={selected} />
);