'use client';

import { useCallback, useRef, useState, useEffect } from 'react';
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  Connection,
  NodeTypes,
  EdgeTypes,
  useNodesState,
  useEdgesState,
  Background,
  Controls,
  MiniMap,
  Panel,
  Handle,
  Position,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { cn } from '@/lib/utils';
import { ShaderNodeComponents } from './ShaderNodeComponents';
import { ShaderEdgeComponents } from './ShaderEdgeComponents';

interface ShaderNodeData {
  label: string;
  type: string;
  inputs: { name: string; type: string; value?: any }[];
  outputs: { name: string; type: string }[];
  params: Record<string, any>;
}

const initialNodes: Node<ShaderNodeData>[] = [
  {
    id: '1',
    type: 'shaderOutput',
    position: { x: 400, y: 100 },
    data: {
      label: 'Material Output',
      type: 'output',
      inputs: [
        { name: 'Surface', type: 'shader' },
        { name: 'Displacement', type: 'vector' },
        { name: 'Volume', type: 'shader' },
      ],
      outputs: [],
      params: {},
    },
  },
  {
    id: '2',
    type: 'principledBSDF',
    position: { x: 100, y: 100 },
    data: {
      label: 'Principled BSDF',
      type: 'bsdf',
      inputs: [
        { name: 'Base Color', type: 'color', value: '#ffffff' },
        { name: 'Subsurface', type: 'float', value: 0 },
        { name: 'Metallic', type: 'float', value: 0 },
        { name: 'Roughness', type: 'float', value: 0.5 },
        { name: 'Specular', type: 'float', value: 0.5 },
        { name: 'Clearcoat', type: 'float', value: 0 },
        { name: 'Transmission', type: 'float', value: 0 },
        { name: 'Emission', type: 'color', value: '#000000' },
        { name: 'Alpha', type: 'float', value: 1 },
        { name: 'Normal', type: 'vector' },
      ],
      outputs: [{ name: 'BSDF', type: 'shader' }],
      params: { distribution: 'ggx', subsurfaceMethod: 'burley' },
    },
  },
  {
    id: '3',
    type: 'textureCoordinate',
    position: { x: 100, y: 300 },
    data: {
      label: 'Texture Coordinate',
      type: 'input',
      inputs: [],
      outputs: [
        { name: 'Generated', type: 'vector' },
        { name: 'Object', type: 'vector' },
        { name: 'Camera', type: 'vector' },
        { name: 'Window', type: 'vector' },
        { name: 'Reflection', type: 'vector' },
      ],
      params: {},
    },
  },
  {
    id: '4',
    type: 'imageTexture',
    position: { x: 100, y: 400 },
    data: {
      label: 'Image Texture',
      type: 'texture',
      inputs: [
        { name: 'Vector', type: 'vector' },
      ],
      outputs: [
        { name: 'Color', type: 'color' },
        { name: 'Alpha', type: 'float' },
      ],
      params: { image: null, interpolation: 'linear', projection: 'flat' },
    },
  },
];

const initialEdges: Edge[] = [
  { id: 'e2-1', source: '2', target: '1', sourceHandle: 'BSDF', targetHandle: 'Surface', type: 'shader', animated: true },
  { id: 'e3-4', source: '3', target: '4', sourceHandle: 'Generated', targetHandle: 'Vector', type: 'default' },
  { id: 'e4-2', source: '4', target: '2', sourceHandle: 'Color', targetHandle: 'Base Color', type: 'default' },
];

const nodeTypes: NodeTypes = {
  shaderOutput: ShaderNodeComponents.OutputNode,
  principledBSDF: ShaderNodeComponents.BSDFNode,
  textureCoordinate: ShaderNodeComponents.TexCoordNode,
  imageTexture: ShaderNodeComponents.ImageTextureNode,
  mixShader: ShaderNodeComponents.MixShaderNode,
  addShader: ShaderNodeComponents.AddShaderNode,
  diffuseBSDF: ShaderNodeComponents.DiffuseBSDFNode,
  glossyBSDF: ShaderNodeComponents.GlossyBSDFNode,
  glassBSDF: ShaderNodeComponents.GlassBSDFNode,
  emission: ShaderNodeComponents.EmissionNode,
  colorRamp: ShaderNodeComponents.ColorRampNode,
  math: ShaderNodeComponents.MathNode,
  vectorMath: ShaderNodeComponents.VectorMathNode,
  separateXYZ: ShaderNodeComponents.SeparateXYZNode,
  combineXYZ: ShaderNodeComponents.CombineXYZNode,
  noiseTexture: ShaderNodeComponents.NoiseTextureNode,
  voronoiTexture: ShaderNodeComponents.VoronoiTextureNode,
  waveTexture: ShaderNodeComponents.WaveTextureNode,
  magicTexture: ShaderNodeComponents.MagicTextureNode,
  rgbCurves: ShaderNodeComponents.RGBCurvesNode,
  hueSaturation: ShaderNodeComponents.HueSaturationNode,
  gamma: ShaderNodeComponents.GammaNode,
  brightnessContrast: ShaderNodeComponents.BrightnessContrastNode,
  invert: ShaderNodeComponents.InvertNode,
  mix: ShaderNodeComponents.MixNode,
  mixRGB: ShaderNodeComponents.MixRGBNode,
  separateColor: ShaderNodeComponents.SeparateColorNode,
  combineColor: ShaderNodeComponents.CombineColorNode,
};

const edgeTypes: EdgeTypes = {
  shader: ShaderEdgeComponents.ShaderEdge,
  default: ShaderEdgeComponents.DefaultEdge,
};

export function NodeEditor() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNode, setSelectedNode] = useState<Node<ShaderNodeData> | null>(null);
  const [viewport, setViewport] = useState({ x: 0, y: 0, zoom: 1 });
  const reactFlowRef = useRef<ReactFlow<ShaderNodeData>>(null);

  const onConnect = useCallback((params: Connection) => {
    if (params.sourceHandle && params.targetHandle) {
      setEdges(eds => addEdge({ ...params, type: 'shader' as any }, eds));
    }
  }, [setEdges]);

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node<ShaderNodeData>) => {
    setSelectedNode(node);
  }, []);

  const addNode = useCallback((type: string, position: { x: number; y: number }) => {
    const newNode: Node<ShaderNodeData> = {
      id: `${type}-${Date.now()}`,
      type,
      position,
      data: getDefaultNodeData(type),
    };
    setNodes(nds => [...nds, newNode]);
  }, [setNodes]);

  const deleteSelected = useCallback(() => {
    if (selectedNode) {
      setNodes(nds => nds.filter(n => n.id !== selectedNode.id));
      setEdges(eds => eds.filter(e => e.source !== selectedNode.id && e.target !== selectedNode.id));
      setSelectedNode(null);
    }
  }, [selectedNode, setNodes, setEdges]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        // Save shader graph
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        deleteSelected();
      }
      if (e.key === ' ') {
        e.preventDefault();
        // Show node search menu
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [deleteSelected]);

  return (
    <div className="h-full w-full bg-studio-bg">
      <ReactFlow<ShaderNodeData>
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onViewportChange={setViewport}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        snapToGrid
        snapGrid={[16, 16]}
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
        minZoom={0.1}
        maxZoom={4}
        connectionMode={ConnectionMode.Loose}
        nodesDraggable
        nodesConnectable
        elementsSelectable
        multiSelectionActive
      >
        <Background
          color="#2A2E39"
          gap={16}
          size={1}
          variant="dots"
        />
        <Controls />
        <MiniMap
          nodeColor={node => node.type === 'shaderOutput' ? '#00F0FF' : node.type === 'principledBSDF' ? '#FF007A' : '#6B7280'}
          maskColor="rgba(13, 14, 18, 0.9)"
        />
        <Panel position="top-left">
          <NodeToolbar onAddNode={addNode} />
        </Panel>
        <Panel position="bottom-right">
          <ViewportInfo viewport={viewport} />
        </Panel>
      </ReactFlow>

      {selectedNode && (
        <NodePropertiesPanel node={selectedNode} onUpdate={updateNodeData} />
      )}
    </div>
  );
}

function getDefaultNodeData(type: string): ShaderNodeData {
  const defaults: Record<string, ShaderNodeData> = {
    principledBSDF: {
      label: 'Principled BSDF',
      type: 'bsdf',
      inputs: [
        { name: 'Base Color', type: 'color', value: '#ffffff' },
        { name: 'Metallic', type: 'float', value: 0 },
        { name: 'Roughness', type: 'float', value: 0.5 },
        { name: 'Normal', type: 'vector' },
      ],
      outputs: [{ name: 'BSDF', type: 'shader' }],
      params: { distribution: 'ggx' },
    },
    imageTexture: {
      label: 'Image Texture',
      type: 'texture',
      inputs: [{ name: 'Vector', type: 'vector' }],
      outputs: [{ name: 'Color', type: 'color' }, { name: 'Alpha', type: 'float' }],
      params: { image: null, interpolation: 'linear' },
    },
    noiseTexture: {
      label: 'Noise Texture',
      type: 'texture',
      inputs: [{ name: 'Vector', type: 'vector' }, { name: 'Scale', type: 'float', value: 5 }, { name: 'Detail', type: 'float', value: 2 }, { name: 'Roughness', type: 'float', value: 0.5 }],
      outputs: [{ name: 'Fac', type: 'float' }, { name: 'Color', type: 'color' }],
      params: { noiseType: 'fbm', normalize: true },
    },
    math: {
      label: 'Math',
      type: 'math',
      inputs: [{ name: 'Value', type: 'float', value: 0.5 }, { name: 'Value', type: 'float', value: 0.5 }],
      outputs: [{ name: 'Value', type: 'float' }],
      params: { operation: 'add' },
    },
    mixShader: {
      label: 'Mix Shader',
      type: 'shader',
      inputs: [{ name: 'Fac', type: 'float', value: 0.5 }, { name: 'Shader', type: 'shader' }, { name: 'Shader', type: 'shader' }],
      outputs: [{ name: 'Shader', type: 'shader' }],
      params: {},
    },
  };
  return defaults[type] || { label: type, type: 'custom', inputs: [], outputs: [], params: {} };
}

function updateNodeData(nodeId: string, data: Partial<ShaderNodeData>) {
  // Update node data
}

function NodeToolbar({ onAddNode }: { onAddNode: (type: string, position: { x: number; y: number }) => void }) {
  const [open, setOpen] = useState(false);
  const categories = [
    { name: 'Shader', items: ['principledBSDF', 'diffuseBSDF', 'glossyBSDF', 'glassBSDF', 'emission', 'mixShader', 'addShader'] },
    { name: 'Texture', items: ['imageTexture', 'noiseTexture', 'voronoiTexture', 'waveTexture', 'magicTexture', 'textureCoordinate'] },
    { name: 'Color', items: ['colorRamp', 'rgbCurves', 'hueSaturation', 'gamma', 'brightnessContrast', 'invert', 'mixRGB', 'separateColor', 'combineColor'] },
    { name: 'Vector', items: ['vectorMath', 'separateXYZ', 'combineXYZ'] },
    { name: 'Math', items: ['math'] },
    { name: 'Input', items: ['value', 'color', 'vector', 'textureCoordinate'] },
    { name: 'Output', items: ['shaderOutput'] },
  ];

  return (
    <div className="studio-panel-elevated p-2">
      <div className="flex items-center gap-2 mb-2">
        <h4 className="text-xs font-medium text-studio-text-muted uppercase tracking-wider">Add Node</h4>
        <button onClick={() => setOpen(!open)} className="p-1 rounded hover:bg-studio-border transition-colors ml-auto">
          <ChevronDown className={cn('w-4 h-4', open && 'rotate-180')} />
        </button>
      </div>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2 max-h-96 overflow-y-auto"
          >
            {categories.map(cat => (
              <div key={cat.name} className="space-y-1">
                <h5 className="text-[10px] font-medium text-studio-text-muted uppercase tracking-wider px-1 mb-1">{cat.name}</h5>
                <div className="flex flex-wrap gap-1">
                  {cat.items.map(type => (
                    <button
                      key={type}
                      onClick={() => onAddNode(type, { x: 100, y: 100 })}
                      className="px-2 py-1 text-xs rounded bg-studio-bg-elevated/50 border border-studio-border hover:bg-studio-cyan/10 hover:border-studio-cyan hover:text-studio-cyan transition-all duration-150"
                    >
                      {formatNodeName(type)}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function formatNodeName(type: string): string {
  return type
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .replace('Bsdf', 'BSDF')
    .replace('Rgb', 'RGB')
    .replace('Xyz', 'XYZ');
}

function ViewportInfo({ viewport }: { viewport: { x: number; y: number; zoom: number } }) {
  return (
    <div className="studio-panel-elevated px-3 py-1.5 text-xs text-studio-text-muted font-mono flex items-center gap-4">
      <span>Zoom: {Math.round(viewport.zoom * 100)}%</span>
      <span>Pos: {Math.round(viewport.x)}, {Math.round(viewport.y)}</span>
    </div>
  );
}

function NodePropertiesPanel({ node, onUpdate }: { node: Node<ShaderNodeData>; onUpdate: (id: string, data: Partial<ShaderNodeData>) => void }) {
  return (
    <div className="absolute right-0 top-0 bottom-0 w-72 studio-panel-elevated border-l border-studio-border overflow-y-auto p-3">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium text-studio-text">{node.data.label}</h4>
        <span className="text-xs text-studio-text-muted bg-studio-bg px-1.5 py-0.5 rounded">{node.data.type}</span>
      </div>
      <div className="space-y-3">
        <PropertyGroup title="Parameters">
          {Object.entries(node.data.params).map(([key, value]) => (
            <PropertyRow key={key} label={key}>
              {typeof value === 'boolean' && (
                <input type="checkbox" checked={value} onChange={e => onUpdate(node.id, { params: { ...node.data.params, [key]: e.target.checked } })} className="w-4 h-4 accent-studio-cyan" />
              )}
              {typeof value === 'number' && (
                <input type="number" value={value} onChange={e => onUpdate(node.id, { params: { ...node.data.params, [key]: parseFloat(e.target.value) } })} className="studio-input text-xs w-full" step="0.01" />
              )}
              {typeof value === 'string' && (
                <input type="text" value={value} onChange={e => onUpdate(node.id, { params: { ...node.data.params, [key]: e.target.value } })} className="studio-input text-xs w-full" />
              )}
            </PropertyRow>
          ))}
        </PropertyGroup>
      </div>
    </div>
  );
}

function PropertyGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h5 className="text-xs font-medium text-studio-text-muted uppercase tracking-wider">{title}</h5>
      {children}
    </div>
  );
}

function PropertyRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <label className="text-xs text-studio-text-muted w-20 shrink-0">{label}</label>
      <div className="flex-1">{children}</div>
    </div>
  );
}

import { ChevronDown, ConnectionMode } from 'reactflow';