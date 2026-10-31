# 🎨 Reina del Sazón — 2D→3D Reconstruction Studio

> **Enterprise-grade, production-ready software suite** that transforms any 2D visual input (drawings, vehicle side-profiles, arbitrary images) into fully tactile, 3D interactive models with professional Blender-style procedural geometry, physics, automatic interior generation, and predictive AI improvements.

[![CI](https://github.com/chris100809/reina-del-sazon/actions/workflows/ci.yml/badge.svg)](https://github.com/chris100809/reina-del-sazon/actions/workflows/ci.yml)
[![Release](https://github.com/chris100809/reina-del-sazon/actions/workflows/release.yml/badge.svg)](https://github.com/chris100809/reina-del-sazon/actions/workflows/release.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Node](https://img.shields.io/badge/Node-%3E%3D20-brightgreen)](https://nodejs.org)
[![Python](https://img.shields.io/badge/Python-%3E%3D3.11-blue)](https://python.org)
[![Rust](https://img.shields.io/badge/Rust-%3E%3D1.79-orange)](https://rust-lang.org)

---

## ✨ Features

### 🎬 Blender-Grade Studio Interface
- **Dark Glassmorphism Workspace** — `#0D0E12` background, slate panels `#1A1D24`, neon cyan `#00F0FF` / magenta `#FF007A` accents
- **Dockable Window System** — 3D Viewport with Gizmos, Scene Outliner, Node Graph Editor, Properties Panel
- **Tactile Viewport Controls** — Smooth orbit/pan/zoom, camera framing, wireframe/solid/rendered shading, interactive mesh slicing
- **Real-time Node Editor** — React Flow based shader graph with GLSL live compilation

### 🔬 2D→3D Reconstruction Pipeline
- **Depth-Anything-V2** — State-of-the-art monocular depth estimation (ViT-L backbone)
- **Watertight Mesh Generation** — Poisson Surface Reconstruction + Marching Cubes fallback
- **Quad Topology Optimization** — Instant Meshes remeshing + xatlas UV unwrapping
- **Auto Subdivision Surfaces** — Catmull-Clark with crease preservation

### 🏠 Automated Interior Generation
- **Procedural Grammar Engine** — Rule-based interior synthesis from exterior contours
- **Vehicle Interiors** — Cockpits, seats, dashboards, engines, steering columns
- **Architectural Interiors** — Furniture, beams, lighting, HVAC, circulation paths
- **Constraint Solving** — Ergonomic clearance, structural integrity, accessibility

### 🤖 Predictive AI Design Enhancer
- **Aerodynamic Analysis** — CFD-informed mesh morphing for drag reduction
- **Ergonomic Optimization** — Human factors simulation for reach/visibility
- **Aesthetic Refinement** — Diffusion-based style transfer preserving function
- **Structural Validation** — FEA-informed reinforcement suggestions

### ⚡ High-Performance Physics & Lighting
- **Rapier WASM** — Real-time rigid body dynamics in browser (collision, friction, joints)
- **Isaac Sim / PyBullet** — High-fidelity GPU physics for validation (Python backend)
- **PBR Shader Pipeline** — Disney BRDF, Clearcoat, Sheen, Anisotropy, Iridescence
- **Advanced Effects** — Subsurface Scattering, Screen-Space AO, Real-time Reflections, Volumetric Lighting
- **RGB 90000 HDR** — Custom wide-gamut color space with perceptual encoding

### 🚀 Autonomous DevOps
- **GitHub API Integration** — Auto-repo scaffolding, commits, releases, PR management
- **Multi-platform CI/CD** — Linux/macOS/Windows, Web + Desktop + Docker
- **Automated Testing** — Unit, Integration, Visual Regression, E2E (Playwright)
- **Performance Profiling** — WebGL/GPU timers, Memory tracking, Bundle analysis

---

## 🏗 Architecture

```
reina-del-sazon/
├── apps/
│   ├── web/                    # Next.js 14 + Three.js + React Flow (PWA)
│   └── desktop/                # Tauri 2.0 + Rust + Python embedding
├── packages/
│   ├── core/                   # Shared types, math, validation
│   ├── ml-core/                # Python ML pipeline (Depth, Mesh, Interior, Enhancer)
│   ├── physics-core/           # Rapier WASM + Isaac Sim + PyBullet
│   └── shaders/                # GLSL/WGSL library (PBR, SSS, AO, RGB-90000)
├── scripts/                    # GitHub sync, repo setup, dev orchestration
├── docker/                     # GPU-enabled containers
├── docs/                       # Architecture, API, Contributing
└── tests/                      # E2E, Unit, Visual regression
```

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** ≥ 20 (via [fnm](https://github.com/Schniz/fnm) or [nvm](https://github.com/nvm-sh/nvm))
- **pnpm** ≥ 9 (`corepack enable && corepack prepare pnpm@latest --activate`)
- **Python** ≥ 3.11 (via [pyenv](https://github.com/pyenv/pyenv))
- **Rust** ≥ 1.79 (via [rustup](https://rustup.rs))
- **CUDA** ≥ 12.1 (for ML backend) — or use CPU fallback
- **Git** ≥ 2.40

### 1. Clone & Install
```bash
git clone https://github.com/chris100809/reina-del-sazon.git
cd reina-del-sazon
pnpm install
```

### 2. Configure Environment
```bash
cp .env.example .env
# Edit .env with your GitHub PAT and ML settings
```

### 3. Start Development (All Platforms)
```bash
# Terminal 1: Web App (Next.js + Three.js)
pnpm --filter=@reina/web dev

# Terminal 2: ML Backend (FastAPI + PyTorch)
cd packages/ml-core && pip install -r requirements.txt && python -m uvicorn server:app --reload --port 8000

# Terminal 3: Desktop App (Tauri)
pnpm --filter=@reina/desktop dev

# Or all at once:
pnpm dev
```

### 4. Build for Production
```bash
# Web (static export + Docker)
pnpm build:web && pnpm docker:build

# Desktop (Tauri bundles)
pnpm build:desktop

# ML (ONNX export + quantization)
cd packages/ml-core && python export_onnx.py
```

---

## 🎮 Usage

### Web Studio
1. Open `http://localhost:3000`
2. Drag & drop any 2D image (vehicle sketch, architectural plan, product photo)
3. Watch real-time 3D reconstruction with live depth preview
4. Adjust reconstruction parameters in Properties panel
5. Edit materials in Node Shader Editor
6. Simulate physics in Viewport
7. Export: GLTF, USDZ, OBJ, STL, 3MF

### Desktop App
- Native file system access
- Offline ML inference (ONNX Runtime)
- System-level GPU acceleration
- Multi-window workflows

### Python API
```python
from reina_ml import ReconstructionPipeline

pipeline = ReconstructionPipeline(
    depth_model='depth_anything_v2_vitl',
    mesh_method='poisson',
    uv_unwrap=True,
    generate_interior=True,
    enhance_predictive=True
)

result = pipeline.process(
    image_path='car_side_view.jpg',
    output_dir='output/car_model'
)

# result.mesh, result.interior, result.materials, result.uv_maps
```

---

## 📦 Deployment

### Docker (GPU)
```bash
docker compose -f docker/docker-compose.yml up -d
# Access: http://localhost:3000 (web), http://localhost:8000 (ML API)
```

### Cloud (Vercel + Modal/RunPod)
```bash
# Web frontend
vercel deploy apps/web

# ML backend
modal deploy packages/ml-core/modal_app.py
```

### Desktop Distribution
```bash
pnpm build:desktop
# Output: apps/desktop/src-tauri/target/release/bundle/
```

---

## 🧪 Testing

```bash
# Unit tests
pnpm test

# E2E tests (Playwright)
pnpm test:e2e

# Visual regression (Chromatic)
pnpm test:visual

# Type checking
pnpm typecheck

# Linting
pnpm lint
```

---

## 📚 Documentation

- [Architecture Overview](docs/architecture.md)
- [API Reference](docs/api.md)
- [Contributing Guide](docs/contributing.md)
- [Shader Authoring](docs/shaders.md)
- [Physics Integration](docs/physics.md)
- [ML Pipeline](docs/ml-pipeline.md)

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

See [Contributing Guide](docs/contributing.md) for details.

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

## 🙏 Acknowledgments

- **Depth-Anything-V2** by TikTok Research
- **Three.js** by Ricardo Cabello & contributors
- **Rapier** by Dimercelo & Bevy contributors
- **Tauri** by Tauri Programme within The Commons Conservancy
- **React Flow** by xyflow
- **xatlas** by jpcy
- **Instant Meshes** by Wenzel Jakob et al.

---

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/chris100809/reina-del-sazon/issues)
- **Discussions**: [GitHub Discussions](https://github.com/chris100809/reina-del-sazon/discussions)
- **Security**: security@reina-del-sazon.dev

---

<div align="center">
  <strong>Built with ❤️ by the Reina del Sazón team</strong>
  <br>
  <sub>Transforming 2D vision into 3D reality</sub>
</div>