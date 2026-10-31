'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Cube, Camera, Lightbulb, Settings, Sliders, Layers, Trash2, Copy, Eye, EyeOff, Lock, Unlock, Link, Unlink, RotateCcw, Maximize, Minimize } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useStudioStore } from '@/hooks/useStudioStore';
import { useViewportStore } from '@/hooks/useViewportStore';

export function PropertiesPanel() {
  const { scene, activeObjectId, updateObject, removeObject, duplicateObject } = useStudioStore();
  const { gizmo, setGizmoMode, setGizmoSpace, setGizmoPivot, setGizmoSnap, setGizmoSnapIncrement } = useViewportStore();

  const activeObject = useMemo(() => {
    if (!activeObjectId) return null;
    return scene.objects.get(activeObjectId) || null;
  }, [scene.objects, activeObjectId]);

  const [activeTab, setActiveTab] = useState<'transform' | 'geometry' | 'material' | 'physics' | 'custom'>('transform');

  if (!activeObject) {
    return (
      <div className="flex flex-col h-full studio-panel-elevated">
        <div className="flex items-center gap-2 p-2 border-b border-studio-border">
          <h2 className="text-xs font-medium text-studio-text-muted uppercase tracking-wider flex-1">Properties</h2>
        </div>
        <div className="flex-1 flex items-center justify-center text-studio-text-muted">
          <Cube className="w-12 h-12 opacity-30" />
          <span className="text-sm">Select an object to edit properties</span>
        </div>
      </div>
    );
  }

  const geometry = activeObject.geometryId ? scene.geometries.get(activeObject.geometryId) : null;
  const material = activeObject.materialIds[0] ? scene.materials.get(activeObject.materialIds[0]) : null;
  const physicsBody = activeObject.physicsBodyId ? scene.physicsBodies.get(activeObject.physicsBodyId) : null;

  return (
    <div className="flex flex-col h-full studio-panel-elevated">
      <div className="flex items-center gap-2 p-2 border-b border-studio-border">
        <h2 className="text-xs font-medium text-studio-text-muted uppercase tracking-wider flex-1">
          {activeObject.name}
        </h2>
        <div className="flex items-center gap-1">
          <button className="p-1 rounded hover:bg-studio-border transition-colors" title="Duplicate" onClick={() => duplicateObject(activeObject.id)}>
            <Copy className="w-4 h-4" />
          </button>
          <button className="p-1 rounded hover:bg-studio-border hover:text-studio-error transition-colors" title="Delete" onClick={() => removeObject(activeObject.id)}>
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex border-b border-studio-border overflow-x-auto pb-1 px-2">
        {(['transform', 'geometry', 'material', 'physics', 'custom'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'px-3 py-1.5 text-xs font-medium rounded-md transition-colors duration-150 whitespace-nowrap',
              activeTab === tab
                ? 'bg-studio-cyan/10 text-studio-cyan border-b-2 border-studio-cyan'
                : 'text-studio-text-muted hover:text-studio-text hover:bg-studio-panel-hover'
            )}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
          >
            {activeTab === 'transform' && (
              <TransformProperties object={activeObject} gizmo={gizmo} onGizmoChange={setGizmoMode} />
            )}
            {activeTab === 'geometry' && (
              <GeometryProperties object={activeObject} geometry={geometry} />
            )}
            {activeTab === 'material' && (
              <MaterialProperties object={activeObject} material={material} scene={scene} />
            )}
            {activeTab === 'physics' && (
              <PhysicsProperties object={activeObject} physicsBody={physicsBody} scene={scene} />
            )}
            {activeTab === 'custom' && (
              <CustomProperties object={activeObject} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

function TransformProperties({ object, gizmo, onGizmoChange }: { object: any; gizmo: any; onGizmoChange: (mode: any) => void }) {
  return (
    <PropertyEditor>
      <PropertyGroup title="Transform">
        <PropertyRow label="Position">
          <VectorInput value={object.transform.position} onChange={v => updateObject(object.id, { transform: { ...object.transform, position: v } })} />
        </PropertyRow>
        <PropertyRow label="Rotation">
          <VectorInput value={object.transform.rotation} onChange={v => updateObject(object.id, { transform: { ...object.transform, rotation: v } })} />
        </PropertyRow>
        <PropertyRow label="Scale">
          <VectorInput value={object.transform.scale} onChange={v => updateObject(object.id, { transform: { ...object.transform, scale: v } })} step={0.01} />
        </PropertyRow>
      </PropertyGroup>

      <PropertyGroup title="Visibility & Selection">
        <PropertyRow label="Visible">
          <BooleanInput value={object.visible} onChange={v => updateObject(object.id, { visible: v })} />
        </PropertyRow>
        <PropertyRow label="Selectable">
          <BooleanInput value={object.selectable} onChange={v => updateObject(object.id, { selectable: v })} />
        </PropertyRow>
        <PropertyRow label="Locked">
          <BooleanInput value={object.locked} onChange={v => updateObject(object.id, { locked: v })} />
        </PropertyRow>
      </PropertyGroup>

      <PropertyGroup title="Gizmo">
        <PropertyRow label="Mode">
          <SelectInput
            value={gizmo.mode}
            options={['translate', 'rotate', 'scale'].map(m => ({ value: m, label: m.charAt(0).toUpperCase() + m.slice(1) }))}
            onChange={onGizmoChange}
          />
        </PropertyRow>
        <PropertyRow label="Space">
          <SelectInput
            value={gizmo.space}
            options={['world', 'local', 'view'].map(m => ({ value: m, label: m.charAt(0).toUpperCase() + m.slice(1) }))}
            onChange={v => {}}
          />
        </PropertyRow>
        <PropertyRow label="Pivot">
          <SelectInput
            value={gizmo.pivot}
            options={['center', 'cursor', 'active', 'median'].map(m => ({ value: m, label: m.charAt(0).toUpperCase() + m.slice(1) }))}
            onChange={v => {}}
          />
        </PropertyRow>
        <PropertyRow label="Snap">
          <BooleanInput value={gizmo.snap} onChange={v => {}} />
        </PropertyRow>
        {gizmo.snap && (
          <PropertyRow label="Increment">
            <NumberInput value={gizmo.snapIncrement} onChange={v => {}} step={0.01} min={0.01} />
          </PropertyRow>
        )}
      </PropertyGroup>
    </PropertyEditor>
  );
}

function GeometryProperties({ object, geometry }: { object: any; geometry: any }) {
  if (!geometry) {
    return (
      <PropertyEditor>
        <PropertyGroup title="Geometry">
          <div className="text-studio-text-muted text-sm text-center py-4">No geometry assigned</div>
          <button className="studio-button-primary w-full mt-2" onClick={() => {}}>Create Geometry</button>
        </PropertyGroup>
      </PropertyEditor>
    );
  }

  return (
    <PropertyEditor>
      <PropertyGroup title="Geometry Info">
        <PropertyRow label="Vertices" value={geometry.positions.length / 3} />
        <PropertyRow label="Faces" value={geometry.indices.length / 3} />
        <PropertyRow label="Groups" value={geometry.groups.length} />
        <PropertyRow label="Bounding Box">
          <div className="text-studio-text-muted text-xs font-mono">
            {geometry.boundingBox.min.x.toFixed(3)} to {geometry.boundingBox.max.x.toFixed(3)}
          </div>
        </PropertyRow>
      </PropertyGroup>

      <PropertyGroup title="Operations">
        <PropertyRow>
          <button className="studio-button-secondary w-full">Compute Normals</button>
        </PropertyRow>
        <PropertyRow>
          <button className="studio-button-secondary w-full">Generate UVs</button>
        </PropertyRow>
        <PropertyRow>
          <button className="studio-button-secondary w-full">Subdivide</button>
        </PropertyRow>
        <PropertyRow>
          <button className="studio-button-secondary w-full">Simplify</button>
        </PropertyRow>
      </PropertyGroup>
    </PropertyEditor>
  );
}

function MaterialProperties({ object, material, scene }: { object: any; material: any; scene: any }) {
  if (!material) {
    return (
      <PropertyEditor>
        <PropertyGroup title="Material">
          <div className="text-studio-text-muted text-sm text-center py-4">No material assigned</div>
          <button className="studio-button-primary w-full mt-2" onClick={() => {}}>Create Material</button>
        </PropertyGroup>
      </PropertyEditor>
    );
  }

  return (
    <PropertyEditor>
      <PropertyGroup title="Material: {material.name}">
        <PropertyRow label="Type">
          <SelectInput
            value={material.type}
            options={['pbr', 'unlit', 'subsurface', 'transmission', 'custom'].map(m => ({ value: m, label: m }))}
            onChange={v => {}}
          />
        </PropertyRow>

        <PropertyRow label="Base Color">
          <ColorInput value={material.properties.baseColor} onChange={v => {}} />
        </PropertyRow>

        <PropertyRow label="Metallic">
          <SliderInput value={material.properties.metallic} min={0} max={1} step={0.01} onChange={v => {}} />
        </PropertyRow>

        <PropertyRow label="Roughness">
          <SliderInput value={material.properties.roughness} min={0} max={1} step={0.01} onChange={v => {}} />
        </PropertyRow>

        <PropertyRow label="Emissive">
          <ColorInput value={{ x: material.properties.emissive.x, y: material.properties.emissive.y, z: material.properties.emissive.z, w: material.properties.emissiveIntensity }} onChange={v => {}} />
        </PropertyRow>

        <PropertyRow label="Normal Scale">
          <SliderInput value={material.properties.normalScale} min={0} max={5} step={0.01} onChange={v => {}} />
        </PropertyRow>

        <PropertyRow label="Clearcoat">
          <SliderInput value={material.properties.clearcoat} min={0} max={1} step={0.01} onChange={v => {}} />
        </PropertyRow>

        <PropertyRow label="Transmission">
          <SliderInput value={material.properties.transmission} min={0} max={1} step={0.01} onChange={v => {}} />
        </PropertyRow>
      </PropertyGroup>
    </PropertyEditor>
  );
}

function PhysicsProperties({ object, physicsBody, scene }: { object: any; physicsBody: any; scene: any }) {
  return (
    <PropertyEditor>
      <PropertyGroup title="Physics">
        {physicsBody ? (
          <>
            <PropertyRow label="Type">
              <SelectInput
                value={physicsBody.type}
                options={['rigid', 'soft', 'kinematic', 'static'].map(m => ({ value: m, label: m }))}
                onChange={v => {}}
              />
            </PropertyRow>
            <PropertyRow label="Mass">
              <NumberInput value={physicsBody.mass} min={0} step={0.1} onChange={v => {}} />
            </PropertyRow>
            <PropertyRow label="Friction">
              <SliderInput value={physicsBody.friction} min={0} max={1} step={0.01} onChange={v => {}} />
            </PropertyRow>
            <PropertyRow label="Restitution">
              <SliderInput value={physicsBody.restitution} min={0} max={1} step={0.01} onChange={v => {}} />
            </PropertyRow>
            <PropertyRow label="Linear Damping">
              <SliderInput value={physicsBody.linearDamping} min={0} max={1} step={0.01} onChange={v => {}} />
            </PropertyRow>
            <PropertyRow label="Angular Damping">
              <SliderInput value={physicsBody.angularDamping} min={0} max={1} step={0.01} onChange={v => {}} />
            </PropertyRow>
          </>
        ) : (
          <>
            <div className="text-studio-text-muted text-sm text-center py-4">No physics body</div>
            <button className="studio-button-primary w-full mt-2" onClick={() => {}}>Add Physics Body</button>
          </>
        )}
      </PropertyGroup>
    </PropertyEditor>
  );
}

function CustomProperties({ object }: { object: any }) {
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');

  return (
    <PropertyEditor>
      <PropertyGroup title="Custom Properties">
        {Object.entries(object.customProperties).map(([key, value]) => (
          <PropertyRow key={key} label={key}>
            <input
              type="text"
              value={String(value)}
              onChange={e => {}}
              className="studio-input flex-1 text-xs"
            />
          </PropertyRow>
        ))}
        <PropertyRow>
          <div className="flex gap-2">
            <input type="text" placeholder="Key" value={newKey} onChange={e => setNewKey(e.target.value)} className="studio-input flex-1 text-xs" />
            <input type="text" placeholder="Value" value={newValue} onChange={e => setNewValue(e.target.value)} className="studio-input flex-1 text-xs" />
            <button className="studio-button-primary px-3" onClick={() => {}}>Add</button>
          </div>
        </PropertyRow>
      </PropertyGroup>
    </PropertyEditor>
  );
}

function PropertyEditor({ children }: { children: React.ReactNode }) {
  return <div className="space-y-4">{children}</div>;
}

function PropertyGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h4 className="text-xs font-medium text-studio-text-muted uppercase tracking-wider mb-2">{title}</h4>
      {children}
    </div>
  );
}

function PropertyRow({ label, children, value }: { label: string; children?: React.ReactNode; value?: any }) {
  return (
    <div className="flex items-center gap-3">
      <label className="text-xs text-studio-text-muted w-24 shrink-0">{label}</label>
      <div className="flex-1">{children || (value !== undefined ? <span className="text-studio-text text-xs font-mono">{typeof value === 'number' ? value.toFixed(3) : String(value)}</span> : null)}</div>
    </div>
  );
}

function VectorInput({ value, onChange, step = 0.1 }: { value: { x: number; y: number; z: number; w?: number }; onChange: (v: any) => void; step?: number }) {
  const isQuat = 'w' in value;
  return (
    <div className="flex gap-1">
      {['x', 'y', 'z', ...(isQuat ? ['w'] : [])].map(axis => (
        <NumberInput
          key={axis}
          value={value[axis as keyof typeof value]}
          onChange={v => onChange({ ...value, [axis]: v })} 
          step={step}
          className="flex-1"
          placeholder={axis.toUpperCase()}
        />
      ))}
    </div>
  );
}

function NumberInput({ value, onChange, step = 1, min, max, className, placeholder }: { value: number; onChange: (v: number) => void; step?: number; min?: number; max?: number; className?: string; placeholder?: string }) {
  return (
    <input
      type="number"
      value={value}
      onChange={e => onChange(parseFloat(e.target.value) || 0)}
      step={step}
      min={min}
      max={max}
      className={cn('studio-input text-xs', className)}
      placeholder={placeholder}
    />
  );
}

function SliderInput({ value, onChange, min = 0, max = 1, step = 0.01 }: { value: number; onChange: (v: number) => void; min?: number; max?: number; step?: number }) {
  return (
    <div className="flex items-center gap-2 flex-1">
      <input
        type="range"
        value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        min={min}
        max={max}
        step={step}
        className="flex-1 accent-studio-cyan"
      />
      <NumberInput value={value} onChange={onChange} step={step} min={min} max={max} className="w-20" />
    </div>
  );
}

function BooleanInput({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <input
        type="checkbox"
        checked={value}
        onChange={e => onChange(e.target.checked)}
        className="w-4 h-4 accent-studio-cyan rounded border-studio-border bg-studio-bg"
      />
    </label>
  );
}

function SelectInput({ value, options, onChange }: { value: string; options: { value: string; label: string }[]; onChange: (v: string) => void }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="studio-input text-xs flex-1 max-w-xs"
    >
      {options.map(opt => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  );
}

function ColorInput({ value, onChange }: { value: { x: number; y: number; z: number; w?: number }; onChange: (v: any) => void }) {
  const hex = `#${Math.round(value.x * 255).toString(16).padStart(2, '0')}${Math.round(value.y * 255).toString(16).padStart(2, '0')}${Math.round(value.z * 255).toString(16).padStart(2, '0')}`;
  return (
    <div className="flex items-center gap-2">
      <input
        type="color"
        value={hex}
        onChange={e => {
          const c = e.target.value;
          onChange({
            x: parseInt(c.slice(1, 3), 16) / 255,
            y: parseInt(c.slice(3, 5), 16) / 255,
            z: parseInt(c.slice(5, 7), 16) / 255,
            w: value.w,
          });
        }}
        className="w-8 h-8 rounded border-0 cursor-pointer"
      />
      <input
        type="text"
        value={hex}
        onChange={e => {
          const c = e.target.value;
          if (c.length === 7) {
            onChange({
              x: parseInt(c.slice(1, 3), 16) / 255,
              y: parseInt(c.slice(3, 5), 16) / 255,
              z: parseInt(c.slice(5, 7), 16) / 255,
              w: value.w,
            });
          }
        }}
        className="studio-input text-xs w-20 font-mono"
      />
    </div>
  );
}