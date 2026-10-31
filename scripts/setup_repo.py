#!/usr/bin/env python3
"""
Repository Setup Script
Creates the complete directory structure and placeholder files for Reina del Sazón
"""

import os
import sys
from pathlib import Path


def create_directory_structure(root: Path):
    """Create all necessary directories"""
    dirs = [
        # Apps
        "apps/web/src/app",
        "apps/web/src/components/viewport",
        "apps/web/src/components/nodes",
        "apps/web/src/components/panels",
        "apps/web/src/components/ui",
        "apps/web/src/components/workspace",
        "apps/web/src/hooks",
        "apps/web/src/lib",
        "apps/web/src/shaders",
        "apps/web/src/workers",
        "apps/desktop/src-tauri/src",
        "apps/desktop/src-tauri/src/physics",
        
        # Packages
        "packages/core/types",
        "packages/core/math",
        "packages/core/schema",
        "packages/ml-core/depth_anything_v2",
        "packages/ml-core/mesh_reconstruction",
        "packages/ml-core/interior_generator",
        "packages/ml-core/predictive_enhancer",
        "packages/ml-core/uv_unwrapper",
        "packages/physics-core/rapier_wasm",
        "packages/physics-core/isaac_sim",
        "packages/physics-core/pybullet",
        "packages/shaders/pbr",
        "packages/shaders/sss",
        "packages/shaders/ao",
        "packages/shaders/rgb90000",
        "packages/shaders/nodes",
        
        # Scripts, Docker, Docs, Tests
        "scripts",
        "docker",
        "docs",
        "tests/e2e",
        "tests/unit",
        "tests/visual",
        ".github/workflows",
    ]
    
    for dir_path in dirs:
        full_path = root / dir_path
        full_path.mkdir(parents=True, exist_ok=True)
        print(f"Created: {dir_path}")


def create_gitignore(root: Path):
    """Create .gitignore"""
    content = """# Dependencies
node_modules/
.pnpm-store/

# Build outputs
dist/
build/
.next/
out/
target/
*.wasm

# Environment
.env
.env.local
.env.production.local
.env.development.local
.env.test.local

# IDE
.idea/
.vscode/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Logs
*.log
npm-debug.log*
pnpm-debug.log*
yarn-debug.log*
yarn-error.log*

# Test
coverage/
.nyc_output/
playwright-report/
test-results/

# Turbo
.turbo/

# TypeScript
*.tsbuildinfo

# Tauri
apps/desktop/src-tauri/target/
apps/desktop/src-tauri/gen/

# Python
__pycache__/
*.py[cod]
*$py.class
.pytest_cache/
.coverage
htmlcov/
.tox/
.venv/
venv/
env/
*.egg-info/
dist/
build/

# ML Models
packages/ml-core/**/*.pth
packages/ml-core/**/*.onnx
packages/ml-core/**/*.pt
packages/ml-core/**/*.bin
packages/ml-core/**/*.safetensors

# Docker
.docker/

# Misc
*.tgz
.cache/
.temp/
tmp/
"""
    (root / ".gitignore").write_text(content)
    print("Created: .gitignore")


def create_env_example(root: Path):
    """Create .env.example"""
    content = """# GitHub Integration
GITHUB_TOKEN=ghp_your_personal_access_token_here
GITHUB_REPOSITORY=chris100809/reina-del-sazon
GITHUB_OWNER=chris100809
GITHUB_REPO=reina-del-sazon

# ML Backend Configuration
ML_BACKEND_URL=http://localhost:8000
ML_DEVICE=cuda
ML_PRECISION=fp16
ML_BATCH_SIZE=1

# Depth-Anything-V2
DEPTH_MODEL=depth_anything_v2_vitl
DEPTH_INPUT_SIZE=518
DEPTH_MAX_DEPTH=20.0

# Mesh Reconstruction
MESH_METHOD=poisson
MESH_DEPTH=9
MESH_SAMPLES=1000000
UV_ATLAS_SIZE=4096

# Physics
PHYSICS_ENGINE=rapier
PHYSICS_SUBSTEPS=4
PHYSICS_GRAVITY=-9.81

# WebGPU
WEBGPU_POWER_PREFERENCE=high-performance
WEBGPU_CANVAS_FORMAT=rgba16float

# Development
NODE_ENV=development
DEBUG=reina:*
LOG_LEVEL=debug

# Tauri
TAURI_PLATFORM=windows
TAURI_ARCH=x86_64
"""
    (root / ".env.example").write_text(content)
    print("Created: .env.example")


def create_root_package_json(root: Path):
    """Create root package.json"""
    content = """{
  "name": "reina-del-sazon",
  "version": "1.0.0",
  "description": "Enterprise-grade 2D→3D Reconstruction Studio",
  "private": true,
  "workspaces": [
    "apps/*",
    "packages/*"
  ],
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "build:web": "turbo run build --filter=@reina/web",
    "build:desktop": "turbo run build --filter=@reina/desktop",
    "build:ml": "turbo run build --filter=@reina/ml-core",
    "test": "turbo run test",
    "lint": "turbo run lint",
    "typecheck": "turbo run typecheck",
    "docker:build": "docker compose -f docker/docker-compose.yml build",
    "docker:up": "docker compose -f docker/docker-compose.yml up -d",
    "github:sync": "python scripts/github_sync.py",
    "setup": "python scripts/setup_repo.py"
  },
  "devDependencies": {
    "turbo": "^2.0.0",
    "typescript": "^5.5.0",
    "@types/node": "^22.0.0",
    "eslint": "^9.0.0",
    "prettier": "^3.3.0",
    "vitest": "^2.0.0",
    "@vitest/ui": "^2.0.0",
    "playwright": "^1.45.0",
    "@chromatic/storybook": "^1.0.0"
  },
  "engines": {
    "node": ">=20.0.0",
    "pnpm": ">=9.0.0"
  },
  "packageManager": "pnpm@9.6.0"
}"""
    (root / "package.json").write_text(content)
    print("Created: package.json")


def create_pnpm_workspace(root: Path):
    """Create pnpm-workspace.yaml"""
    content = """packages:
  - "apps/*"
  - "packages/*"

catalog:
  typescript: "^5.5.0"
  zod: "^3.23.0"
  valibot: "^0.31.0"
  react: "^18.3.0"
  react-dom: "^18.3.0"
  next: "^14.2.0"
  "@types/react": "^18.3.0"
  "@types/react-dom": "^18.3.0"
  tailwindcss: "^3.4.0"
  "@tailwindcss/forms": "^0.5.0"
  "@tailwindcss/typography": "^0.5.0"
  "@radix-ui/react-slot": "^1.1.0"
  "@radix-ui/react-dialog": "^1.1.0"
  "@radix-ui/react-dropdown-menu": "^2.1.0"
  "@radix-ui/react-tabs": "^1.1.0"
  "@radix-ui/react-tooltip": "^1.1.0"
  "@radix-ui/react-separator": "^1.1.0"
  "@radix-ui/react-scroll-area": "^1.1.0"
  "@radix-ui/react-resizable": "^1.1.0"
  "class-variance-authority": "^0.7.0"
  "clsx": "^2.1.0"
  "tailwind-merge": "^2.4.0"
  "framer-motion": "^11.3.0"
  "lucide-react": "^0.400.0"
  three: "^0.168.0"
  "@types/three": "^0.168.0"
  "@react-three/fiber": "^8.16.0"
  "@react-three/drei": "^9.110.0"
  "@react-three/rapier": "^1.4.0"
  "@react-three/postprocessing": "^2.16.0"
  "webgpu-types": "^0.1.44"
  reactflow: "^11.11.0"
  "@xyflow/system": "^0.0.0"
  zustand: "^4.5.0"
  jotai: "^2.9.0"
  "@tanstack/react-query": "^5.50.0"
  "axios": "^1.7.0"
  "gl-matrix": "^3.4.3"
  "three-mesh-bvh": "^0.7.0"
  "xatlas": "^1.0.0"
  "pyodide": "^0.26.0"
  "eslint": "^9.0.0"
  "prettier": "^3.3.0"
  "@typescript-eslint/eslint-plugin": "^8.0.0"
  "@typescript-eslint/parser": "^8.0.0"
  "eslint-plugin-react": "^7.35.0"
  "eslint-plugin-react-hooks": "^4.6.0"
  "eslint-plugin-tailwindcss": "^0.5.0"
  "vitest": "^2.0.0"
  "@vitest/ui": "^2.0.0"
  "playwright": "^1.45.0"
  "@playwright/test": "^1.45.0"
  "storybook": "^8.2.0"
  "@storybook/react": "^8.2.0"
  "@storybook/nextjs": "^8.2.0"
  "@tauri-apps/api": "^2.0.0"
  "@tauri-apps/cli": "^2.0.0"
  "@octokit/rest": "^20.1.0"
  "@octokit/graphql": "^7.1.0"
  "octokit": "^4.0.0"
"""
    (root / "pnpm-workspace.yaml").write_text(content)
    print("Created: pnpm-workspace.yaml")


def create_turbo_json(root: Path):
    """Create turbo.json"""
    content = """{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**", "build/**", "target/**"],
      "cache": true
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "test": {
      "dependsOn": ["build"],
      "outputs": ["coverage/**"],
      "cache": true
    },
    "lint": {
      "cache": true
    },
    "typecheck": {
      "dependsOn": ["^build"],
      "cache": true
    },
    "docker:build": {
      "cache": true
    }
  },
  "globalEnv": ["NODE_ENV", "GITHUB_TOKEN", "GITHUB_REPOSITORY"],
  "globalDependencies": [".env*"]
}"""
    (root / "turbo.json").write_text(content)
    print("Created: turbo.json")


def create_tsconfig(root: Path):
    """Create tsconfig.json"""
    content = """{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "preserve",
    "strict": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true,
    "baseUrl": ".",
    "paths": {
      "@reina/*": ["packages/*/src"],
      "@reina/web/*": ["apps/web/src/*"],
      "@reina/desktop/*": ["apps/desktop/src/*"],
      "@reina/core/*": ["packages/core/*"],
      "@reina/ml/*": ["packages/ml-core/*"],
      "@reina/physics/*": ["packages/physics-core/*"],
      "@reina/shaders/*": ["packages/shaders/*"]
    },
    "types": ["node", "vitest/globals", "@types/react", "@types/react-dom", "webgpu-types"]
  },
  "exclude": ["node_modules", "dist", "build", ".next", "target"],
  "references": [
    { "path": "./packages/core/types" },
    { "path": "./packages/core/math" },
    { "path": "./packages/core/schema" },
    { "path": "./packages/ml-core" },
    { "path": "./packages/physics-core" },
    { "path": "./packages/shaders" },
    { "path": "./apps/web" },
    { "path": "./apps/desktop" }
  ]
}"""
    (root / "tsconfig.json").write_text(content)
    print("Created: tsconfig.json")


def create_tailwind_config(root: Path):
    """Create tailwind.config.js"""
    content = """/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './apps/web/src/**/*.{js,ts,jsx,tsx,mdx}',
    './apps/desktop/src/**/*.{js,ts,jsx,tsx,mdx}',
    './packages/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        studio: {
          bg: '#0D0E12',
          bgElevated: '#131419',
          panel: '#1A1D24',
          panelHover: '#1E222A',
          border: '#2A2E39',
          borderActive: '#00F0FF',
          borderAccent: '#FF007A',
          text: '#E8EAF0',
          textMuted: '#6B7280',
          textInverse: '#0D0E12',
          cyan: '#00F0FF',
          cyanGlow: '#00F0FF40',
          magenta: '#FF007A',
          magentaGlow: '#FF007A40',
          amber: '#FFB800',
          amberGlow: '#FFB80040',
          emerald: '#00FF88',
          emeraldGlow: '#00FF8840',
          success: '#00FF88',
          warning: '#FFB800',
          error: '#FF3366',
          info: '#00F0FF',
        },
        background: 'var(--studio-bg)',
        foreground: 'var(--studio-text)',
        primary: {
          DEFAULT: 'var(--studio-cyan)',
          foreground: 'var(--studio-textInverse)',
        },
        secondary: {
          DEFAULT: 'var(--studio-magenta)',
          foreground: 'var(--studio-textInverse)',
        },
        accent: {
          DEFAULT: 'var(--studio-amber)',
          foreground: 'var(--studio-textInverse)',
        },
        muted: {
          DEFAULT: 'var(--studio-panel)',
          foreground: 'var(--studio-textMuted)',
        },
        border: 'var(--studio-border)',
        ring: 'var(--studio-cyan)',
      },
      fontFamily: {
        sans: ['JetBrains Mono', 'Fira Code', 'SF Mono', 'Monospace'],
        mono: ['JetBrains Mono', 'Fira Code', 'SF Mono', 'Monospace'],
        ui: ['Inter', 'SF Pro', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
}"""
    (root / "tailwind.config.js").write_text(content)
    print("Created: tailwind.config.js")


def create_postcss_config(root: Path):
    """Create postcss.config.js"""
    content = """module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
    'postcss-nested': {},
    'postcss-custom-media': {},
    'postcss-custom-properties': {},
  },
}"""
    (root / "postcss.config.js").write_text(content)
    print("Created: postcss.config.js")


def create_eslint_config(root: Path):
    """Create eslint.config.js"""
    content = """module.exports = {
  root: true,
  env: { browser: true, es2022: true, node: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended-type-checked',
    'plugin:@typescript-eslint/stylistic-type-checked',
    'plugin:react-hooks/recommended',
    'plugin:tailwindcss/recommended',
    'prettier',
  ],
  ignorePatterns: ['dist/', 'build/', '.next/', 'target/', 'node_modules/', '*.config.*', '*.md'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    project: ['./tsconfig.json', './apps/*/tsconfig.json', './packages/*/tsconfig.json'],
    tsconfigRootDir: __dirname,
  },
  plugins: ['react-refresh', '@typescript-eslint', 'tailwindcss'],
  rules: {
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/consistent-type-imports': 'warn',
    '@typescript-eslint/no-floating-promises': 'warn',
    'tailwindcss/no-custom-classname': 'off',
    'tailwindcss/enforce-negative-values': 'warn',
  },
}"""
    (root / "eslint.config.js").write_text(content)
    print("Created: eslint.config.js")


def create_prettier_config(root: Path):
    """Create prettier.config.js"""
    content = """module.exports = {
  semi: true,
  singleQuote: true,
  tabWidth: 2,
  trailingComma: 'es5',
  printWidth: 100,
  bracketSpacing: true,
  arrowParens: 'always',
  endOfLine: 'lf',
  plugins: ['prettier-plugin-tailwindcss'],
  tailwindConfig: './tailwind.config.js',
  overrides: [
    {
      files: ['*.md', '*.mdx'],
      options: { printWidth: 120, proseWrap: 'always' },
    },
    {
      files: ['*.json', '*.jsonc'],
      options: { printWidth: 200 },
    },
    {
      files: ['*.yml', '*.yaml'],
      options: { tabWidth: 2, singleQuote: false },
    },
  ],
}"""
    (root / "prettier.config.js").write_text(content)
    print("Created: prettier.config.js")


def create_readme(root: Path):
    """Create README.md"""
    content = """# 🎨 Reina del Sazón — 2D→3D Reconstruction Studio

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
"""
    (root / "README.md").write_text(content)
    print("Created: README.md")


def create_license(root: Path):
    """Create LICENSE"""
    content = """MIT License

Copyright (c) 2024 Reina del Sazón Team

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
"""
    (root / "LICENSE").write_text(content)
    print("Created: LICENSE")


def main():
    """Main entry point"""
    root = Path(__file__).parent.parent
    print(f"Setting up repository at: {root}")
    
    create_directory_structure(root)
    create_gitignore(root)
    create_env_example(root)
    create_root_package_json(root)
    create_pnpm_workspace(root)
    create_turbo_json(root)
    create_tsconfig(root)
    create_tailwind_config(root)
    create_postcss_config(root)
    create_eslint_config(root)
    create_prettier_config(root)
    create_readme(root)
    create_license(root)
    
    print("\n✅ Repository structure created successfully!")
    print("\nNext steps:")
    print("  1. cd into the repository")
    print("  2. Run: pnpm install")
    print("  3. Configure .env with your GitHub PAT")
    print("  4. Run: python scripts/github_sync.py --token YOUR_PAT --create-workflows --create-docker --create-docs")


if __name__ == "__main__":
    main()