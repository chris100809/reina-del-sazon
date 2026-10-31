#!/usr/bin/env python3
"""
GitHub Auto-Sync Script
Automatically commits and pushes the entire codebase to GitHub
"""

import os
import sys
import subprocess
import asyncio
import aiohttp
import json
from pathlib import Path
from typing import Optional, List, Dict, Any
from dataclasses import dataclass
from datetime import datetime
import base64


@dataclass
class GitHubConfig:
    owner: str
    repo: str
    token: str
    branch: str = "main"
    commit_message: str = "feat: update Reina del Sazón codebase"
    author_name: str = "Reina Bot"
    author_email: str = "bot@reina-del-sazon.dev"


class GitHubSync:
    """Handles GitHub repository synchronization"""
    
    def __init__(self, config: GitHubConfig):
        self.config = config
        self.api_base = "https://api.github.com"
        self.headers = {
            "Authorization": f"token {config.token}",
            "Accept": "application/vnd.github.v3+json",
            "User-Agent": "Reina-del-Sazon-Sync/1.0",
        }
    
    async def sync_repository(self, local_path: Path, force: bool = False) -> bool:
        """Main sync function - creates repo if needed, commits all files"""
        print(f"🔄 Syncing repository {self.config.owner}/{self.config.repo}...")
        
        # Check if repo exists
        repo_exists = await self._check_repo_exists()
        
        if not repo_exists:
            print("📦 Repository doesn't exist, creating...")
            await self._create_repository()
        
        # Initialize git if needed
        await self._init_git(local_path)
        
        # Add all files
        await self._git_add_all(local_path)
        
        # Commit
        commit_sha = await self._git_commit(local_path)
        if not commit_sha and not force:
            print("✅ No changes to commit")
            return True
        
        # Push
        await self._git_push(local_path)
        
        print(f"✅ Successfully synced to {self.config.owner}/{self.config.repo}")
        return True
    
    async def _check_repo_exists(self) -> bool:
        """Check if GitHub repository exists"""
        async with aiohttp.ClientSession(headers=self.headers) as session:
            url = f"{self.api_base}/repos/{self.config.owner}/{self.config.repo}"
            async with session.get(url) as resp:
                return resp.status == 200
    
    async def _create_repository(self):
        """Create new GitHub repository"""
        async with aiohttp.ClientSession(headers=self.headers) as session:
            data = {
                "name": self.config.repo,
                "description": "Enterprise-grade 2D→3D Reconstruction Studio",
                "private": False,
                "has_issues": True,
                "has_projects": True,
                "has_wiki": True,
                "auto_init": False,
            }
            url = f"{self.api_base}/user/repos"
            async with session.post(url, json=data) as resp:
                if resp.status not in (200, 201):
                    text = await resp.text()
                    raise RuntimeError(f"Failed to create repo: {resp.status} - {text}")
                print(f"✅ Created repository: {self.config.owner}/{self.config.repo}")
    
    async def _init_git(self, local_path: Path):
        """Initialize git repository"""
        git_dir = local_path / ".git"
        if not git_dir.exists():
            print("🔧 Initializing git repository...")
            await self._run_cmd(["git", "init"], cwd=local_path)
            await self._run_cmd(["git", "config", "user.name", self.config.author_name], cwd=local_path)
            await self._run_cmd(["git", "config", "user.email", self.config.author_email], cwd=local_path)
            await self._run_cmd(["git", "branch", "-M", self.config.branch], cwd=local_path)
            
            # Add remote
            remote_url = f"https://{self.config.token}@github.com/{self.config.owner}/{self.config.repo}.git"
            await self._run_cmd(["git", "remote", "add", "origin", remote_url], cwd=local_path)
        else:
            # Ensure remote is correct
            remote_url = f"https://{self.config.token}@github.com/{self.config.owner}/{self.config.repo}.git"
            await self._run_cmd(["git", "remote", "set-url", "origin", remote_url], cwd=local_path)
    
    async def _git_add_all(self, local_path: Path):
        """Add all files to git"""
        print("📁 Adding files to git...")
        await self._run_cmd(["git", "add", "-A"], cwd=local_path)
    
    async def _git_commit(self, local_path: Path) -> Optional[str]:
        """Commit changes"""
        # Check if there are changes
        result = await self._run_cmd(["git", "status", "--porcelain"], cwd=local_path, capture_output=True)
        if not result.stdout.strip():
            return None
        
        # Get file stats for commit message
        stats_result = await self._run_cmd(["git", "diff", "--cached", "--stat"], cwd=local_path, capture_output=True)
        
        # Create commit message
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        commit_msg = f"{self.config.commit_message}\n\nAuto-synced at {timestamp}\n\n{stats_result.stdout}"
        
        print("💾 Committing changes...")
        await self._run_cmd(["git", "commit", "-m", commit_msg], cwd=local_path)
        
        # Get commit SHA
        sha_result = await self._run_cmd(["git", "rev-parse", "HEAD"], cwd=local_path, capture_output=True)
        return sha_result.stdout.strip()
    
    async def _git_push(self, local_path: Path):
        """Push to GitHub"""
        print("🚀 Pushing to GitHub...")
        await self._run_cmd(["git", "push", "-u", "origin", self.config.branch], cwd=local_path)
    
    async def _run_cmd(
        self, 
        cmd: List[str], 
        cwd: Path, 
        capture_output: bool = False
    ) -> subprocess.CompletedProcess:
        """Run shell command asynchronously"""
        proc = await asyncio.create_subprocess_exec(
            *cmd,
            cwd=cwd,
            stdout=asyncio.subprocess.PIPE if capture_output else None,
            stderr=asyncio.subprocess.PIPE if capture_output else None,
        )
        stdout, stderr = await proc.communicate()
        
        if proc.returncode != 0:
            error_msg = stderr.decode() if stderr else "Unknown error"
            raise RuntimeError(f"Command failed: {' '.join(cmd)}\n{error_msg}")
        
        return subprocess.CompletedProcess(
            args=cmd,
            returncode=proc.returncode,
            stdout=stdout.decode() if stdout else "",
            stderr=stderr.decode() if stderr else "",
        )


async def create_github_workflow_files(repo_path: Path):
    """Create GitHub Actions workflow files"""
    workflows_dir = repo_path / ".github" / "workflows"
    workflows_dir.mkdir(parents=True, exist_ok=True)
    
    # CI Workflow
    ci_workflow = f"""name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  NODE_VERSION: '20'
  PYTHON_VERSION: '3.11'
  RUST_VERSION: '1.79'

jobs:
  lint-and-typecheck:
    name: Lint & TypeCheck
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup pnpm
        uses: pnpm/action-setup@v3
        with:
          version: 9
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{{{ env.NODE_VERSION }}}}
          cache: 'pnpm'
      
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
      
      - name: Run lint
        run: pnpm lint
      
      - name: Run typecheck
        run: pnpm typecheck

  test-web:
    name: Test Web App
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup pnpm
        uses: pnpm/action-setup@v3
        with:
          version: 9
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{{{ env.NODE_VERSION }}}}
          cache: 'pnpm'
      
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
      
      - name: Run tests
        run: pnpm --filter=@reina/web test
      
      - name: Run E2E tests
        run: pnpm --filter=@reina/web test:e2e

  test-ml:
    name: Test ML Core
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Python
        uses: actions/setup-python@v5
        with:
          python-version: ${{{{ env.PYTHON_VERSION }}}}
      
      - name: Install dependencies
        run: |
          cd packages/ml-core
          pip install -r requirements.txt
      
      - name: Run tests
        run: |
          cd packages/ml-core
          pytest -v

  build-web:
    name: Build Web App
    runs-on: ubuntu-latest
    needs: [lint-and-typecheck, test-web]
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup pnpm
        uses: pnpm/action-setup@v3
        with:
          version: 9
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{{{ env.NODE_VERSION }}}}
          cache: 'pnpm'
      
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
      
      - name: Build web app
        run: pnpm build:web
      
      - name: Upload build artifacts
        uses: actions/upload-artifact@v4
        with:
          name: web-build
          path: apps/web/.next/
          retention-days: 7

  build-desktop:
    name: Build Desktop App
    runs-on: ${{{{ matrix.os }}}}
    needs: [lint-and-typecheck]
    strategy:
      matrix:
        os: [ubuntu-latest, windows-latest, macos-latest]
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup pnpm
        uses: pnpm/action-setup@v3
        with:
          version: 9
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{{{ env.NODE_VERSION }}}}
          cache: 'pnpm'
      
      - name: Setup Rust
        uses: actions-rs/toolchain@v1
        with:
          toolchain: ${{{{ env.RUST_VERSION }}}}
          override: true
      
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
      
      - name: Build desktop app
        run: pnpm build:desktop
        env:
          TAURI_PLATFORM: ${{{{ matrix.os == 'windows-latest' && 'windows' || matrix.os == 'macos-latest' && 'macos' || 'linux' }}}}

  docker:
    name: Build Docker Images
    runs-on: ubuntu-latest
    needs: [test-web, test-ml]
    if: github.event_name == 'push'
    steps:
      - uses: actions/checkout@v4
      
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3
      
      - name: Login to GHCR
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{{{ github.actor }}}}
          password: ${{{{ secrets.GITHUB_TOKEN }}}}
      
      - name: Build and push web image
        uses: docker/build-push-action@v5
        with:
          context: .
          file: docker/Dockerfile.web
          push: true
          tags: ghcr.io/{self.config.owner}/{self.config.repo}/web:latest
          cache-from: type=gha
          cache-to: type=gha,mode=max
      
      - name: Build and push ML image
        uses: docker/build-push-action@v5
        with:
          context: .
          file: docker/Dockerfile.gpu
          push: true
          tags: ghcr.io/{self.config.owner}/{self.config.repo}/ml:latest
          cache-from: type=gha
          cache-to: type=gha,mode=max

  notify:
    name: Notify
    runs-on: ubuntu-latest
    needs: [build-web, build-desktop, docker]
    if: always()
    steps:
      - name: Send notification
        if: failure()
        run: |
          echo "Build failed! Check GitHub Actions for details."
"""
    
    (workflows_dir / "ci.yml").write_text(ci_workflow)
    
    # Release Workflow
    release_workflow = f"""name: Release

on:
  push:
    tags:
      - 'v*'

jobs:
  release:
    name: Create Release
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      
      - name: Setup pnpm
        uses: pnpm/action-setup@v3
        with:
          version: 9
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
      
      - name: Build all
        run: pnpm build
      
      - name: Build Desktop (all platforms)
        uses: tauri-apps/tauri-action@v0
        env:
          GITHUB_TOKEN: ${{{{ secrets.GITHUB_TOKEN }}}}
        with:
          tagName: ${{{{ github.ref_name }}}}
          releaseName: "Reina del Sazón ${{{{ github.ref_name }}}}"
          releaseBody: |
            ## Reina del Sazón ${{{{ github.ref_name }}}}
            
            Enterprise-grade 2D→3D Reconstruction Studio
            
            ### Changes
            - See CHANGELOG.md for details
            
            ### Downloads
            - Windows: .msi installer
            - macOS: .dmg and .app.tar.gz
            - Linux: .AppImage and .deb
      
      - name: Build Docker images
        run: |
          docker build -f docker/Dockerfile.web -t ghcr.io/{self.config.owner}/{self.config.repo}/web:${{{{ github.ref_name }}}} .
          docker build -f docker/Dockerfile.gpu -t ghcr.io/{self.config.owner}/{self.config.repo}/ml:${{{{ github.ref_name }}}} .
      
      - name: Push Docker images
        run: |
          echo ${{{{ secrets.GITHUB_TOKEN }}}} | docker login ghcr.io -u ${{{{ github.actor }}}} --password-stdin
          docker push ghcr.io/{self.config.owner}/{self.config.repo}/web:${{{{ github.ref_name }}}}
          docker push ghcr.io/{self.config.owner}/{self.config.repo}/ml:${{{{ github.ref_name }}}}
"""
    
    (workflows_dir / "release.yml").write_text(release_workflow)
    
    # Docker Workflow
    docker_workflow = f"""name: Docker

on:
  schedule:
    - cron: '0 2 * * 0'  # Weekly on Sunday
  workflow_dispatch:

jobs:
  docker:
    name: Build & Push Docker Images
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3
      
      - name: Login to GHCR
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{{{ github.actor }}}}
          password: ${{{{ secrets.GITHUB_TOKEN }}}}
      
      - name: Build and push web image
        uses: docker/build-push-action@v5
        with:
          context: .
          file: docker/Dockerfile.web
          push: true
          tags: |
            ghcr.io/{self.config.owner}/{self.config.repo}/web:latest
            ghcr.io/{self.config.owner}/{self.config.repo}/web:weekly-${{{{ github.run_number }}}}
          cache-from: type=gha
          cache-to: type=gha,mode=max
      
      - name: Build and push ML image
        uses: docker/build-push-action@v5
        with:
          context: .
          file: docker/Dockerfile.gpu
          push: true
          tags: |
            ghcr.io/{self.config.owner}/{self.config.repo}/ml:latest
            ghcr.io/{self.config.owner}/{self.config.repo}/ml:weekly-${{{{ github.run_number }}}}
          cache-from: type=gha
          cache-to: type=gha,mode=max
"""
    
    (workflows_dir / "docker.yml").write_text(docker_workflow)
    
    print(f"✅ Created GitHub workflows in {workflows_dir}")


async def create_docker_files(repo_path: Path):
    """Create Dockerfiles"""
    docker_dir = repo_path / "docker"
    docker_dir.mkdir(parents=True, exist_ok=True)
    
    # Web Dockerfile
    web_dockerfile = """# Web App Dockerfile
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/web/package.json ./apps/web/
COPY packages/*/package.json ./packages/*/

RUN corepack enable && corepack prepare pnpm@9.6.0 --activate
RUN pnpm install --frozen-lockfile --filter=@reina/web...

# Generate Prisma client (if needed)
# RUN pnpm prisma generate

# Builder
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm build:web

# Runner
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/apps/web/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
"""
    
    (docker_dir / "Dockerfile.web").write_text(web_dockerfile)
    
    # GPU Dockerfile
    gpu_dockerfile = """# ML GPU Dockerfile
FROM nvidia/cuda:12.2-devel-ubuntu22.04 AS base

# Install system dependencies
RUN apt-get update && apt-get install -y \\
    python3.11 python3.11-venv python3.11-dev \\
    git curl wget \\
    libgl1-mesa-glx libglib2.0-0 \\
    && rm -rf /var/lib/apt/lists/*

# Create python venv
RUN python3.11 -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Upgrade pip
RUN pip install --no-cache-dir --upgrade pip setuptools wheel

# Copy ML requirements
COPY packages/ml-core/requirements.txt /tmp/requirements.txt
RUN pip install --no-cache-dir -r /tmp/requirements.txt

# Copy ML source
COPY packages/ml-core /app/ml-core
WORKDIR /app/ml-core

# Expose ports
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \\
    CMD curl -f http://localhost:8000/api/health || exit 1

# Run server
CMD ["python", "server.py"]
"""
    
    (docker_dir / "Dockerfile.gpu").write_text(gpu_dockerfile)
    
    # Docker Compose
    docker_compose = """version: '3.8'

services:
  web:
    build:
      context: ..
      dockerfile: docker/Dockerfile.web
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - ML_BACKEND_URL=http://ml:8000
    depends_on:
      - ml
    restart: unless-stopped
    networks:
      - reina-network

  ml:
    build:
      context: ..
      dockerfile: docker/Dockerfile.gpu
    ports:
      - "8000:8000"
    environment:
      - CUDA_VISIBLE_DEVICES=0
      - ML_DEVICE=cuda
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]
    restart: unless-stopped
    networks:
      - reina-network

  # Optional: Redis for caching
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    restart: unless-stopped
    networks:
      - reina-network

networks:
  reina-network:
    driver: bridge

volumes:
  ml-cache:
  redis-data:
"""
    
    (docker_dir / "docker-compose.yml").write_text(docker_compose)
    
    print(f"✅ Created Docker files in {docker_dir}")


async def create_documentation(repo_path: Path):
    """Create documentation files"""
    docs_dir = repo_path / "docs"
    docs_dir.mkdir(parents=True, exist_ok=True)
    
    # Architecture
    arch_doc = """# Architecture Overview

## System Architecture

Reina del Sazón follows a modular, multi-platform architecture:

```
┌─────────────────────────────────────────────────────────────┐
│                    Reina del Sazón Studio                    │
├─────────────────┬─────────────────┬─────────────────────────┤
│   Web App       │  Desktop App    │    ML Backend           │
│   (Next.js)     │   (Tauri)       │   (FastAPI + PyTorch)   │
└────────┬────────┴────────┬────────┴───────────┬────────────┘
         │                 │                    │
         └─────────────────┼────────────────────┘
                           │
              ┌────────────▼────────────┐
              │    Shared Packages      │
              │  • @reina/core          │
              │  • @reina/ml-core       │
              │  • @reina/physics-core  │
              │  • @reina/shaders       │
              └─────────────────────────┘
```

## Package Structure

### @reina/core
Core types, math utilities, and validation schemas shared across all platforms.

### @reina/ml-core
Python ML pipeline including:
- Depth estimation (Depth-Anything-V2)
- Mesh reconstruction (Poisson, Marching Cubes)
- Interior generation (procedural)
- Predictive enhancement (AI-driven)
- UV unwrapping (xatlas)

### @reina/physics-core
Physics engine abstractions:
- Rapier WASM (browser)
- Isaac Sim / PyBullet (Python backend)

### @reina/shaders
GLSL/WGSL shader library:
- PBR materials
- Subsurface scattering
- Screen-space effects
- RGB-90000 HDR color space

## Data Flow

### 2D→3D Reconstruction Pipeline

```
Input Image
    │
    ▼
┌─────────────┐
│  Depth      │  ← Depth-Anything-V2 ViT-L
│  Estimation │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Point      │  ← Back-projection using
│  Cloud      │    camera intrinsics
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Mesh       │  ← Poisson Surface Reconstruction
│  Generation │    (or Marching Cubes fallback)
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  UV         │  ← xatlas automatic unwrapping
│  Unwrapping │
└──────┬──────┘
       │
       ▼
┌─────────────┐     ┌─────────────┐
│  Interior   │     │ Predictive  │
│  Generation │     │ Enhancement │
└──────┬──────┘     └──────┬──────┘
       │                   │
       └─────────┬─────────┘
                 │
                 ▼
        ┌─────────────┐
        │  Export     │  ← GLTF, USDZ, OBJ, STL, 3MF
        └─────────────┘
```

## Technology Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14, React 18, TypeScript |
| 3D Graphics | Three.js r168, React Three Fiber |
| Physics | Rapier WASM, Isaac Sim |
| ML | PyTorch 2.2, Transformers, ONNX |
| Desktop | Tauri 2.0, Rust 1.79 |
| Build | Turborepo, pnpm 9 |
| CI/CD | GitHub Actions |
| Container | Docker, NVIDIA CUDA |
"""
    
    (docs_dir / "architecture.md").write_text(arch_doc)
    
    # API Documentation
    api_doc = """# API Reference

## ML Backend API (FastAPI)

Base URL: `http://localhost:8000`

### Endpoints

#### POST /api/reconstruct
Start 2D→3D reconstruction from uploaded image.

**Request:**
- `file` (multipart/form-data): Image file (JPG, PNG, etc.)
- `depth_model` (form): Depth model to use (default: depth_anything_v2_vitl)
- `mesh_method` (form): Mesh method (poisson|marching_cubes|delaunay|tetrahedral)
- `generate_interior` (form): Generate interior (default: true)
- `enhance_predictive` (form): Apply AI enhancements (default: true)

**Response:**
```json
{
  "job_id": "recon_20240115_123456_1234",
  "status": "pending",
  "message": "Reconstruction started"
}
```

#### GET /api/status/{job_id}
Get reconstruction job status.

**Response:**
```json
{
  "job_id": "recon_20240115_123456_1234",
  "status": "processing",
  "progress": 0.65,
  "message": "Generating mesh...",
  "result": null,
  "error": null
}
```

#### GET /api/download/{job_id}/{filename}
Download output file (model.glb, interior.glb, metadata.json).

#### GET /api/models
List available models and options.

#### GET /api/health
Health check endpoint.

## WebSocket API (Planned)

Real-time updates for reconstruction progress.

## TypeScript Types (Shared)

```typescript
// Core types available in @reina/core
interface Vec3 { x: number; y: number; z: number }
interface MeshGeometry { positions: Float32Array; ... }
interface MaterialDefinition { ... }
interface ReconstructionOptions { ... }
interface ReconstructionResult { ... }
```
"""
    
    (docs_dir / "api.md").write_text(api_doc)
    
    # Contributing
    contrib_doc = """# Contributing Guide

## Getting Started

### Prerequisites
- Node.js ≥ 20
- pnpm ≥ 9
- Python ≥ 3.11
- Rust ≥ 1.79
- CUDA ≥ 12.1 (for GPU ML)

### Development Setup

```bash
# Clone repository
git clone https://github.com/chris100809/reina-del-sazon.git
cd reina-del-sazon

# Install dependencies
pnpm install

# Install ML dependencies
cd packages/ml-core
pip install -r requirements.txt

# Start development servers
# Terminal 1: Web app
pnpm --filter=@reina/web dev

# Terminal 2: ML backend
cd packages/ml-core && python -m uvicorn server:app --reload --port 8000

# Terminal 3: Desktop app
pnpm --filter=@reina/desktop dev
```

## Code Style

### TypeScript/JavaScript
- ESLint + Prettier configured
- Run `pnpm lint` and `pnpm typecheck` before committing

### Python
- Black formatter (line length 100)
- Ruff linter
- Type hints required for public APIs

### Rust
- rustfmt
- clippy

### GLSL
- 4 spaces indentation
- Descriptive variable names
- Comments for complex math

## Commit Convention

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting
- `refactor`: Code restructuring
- `perf`: Performance
- `test`: Tests
- `chore`: Maintenance

Example:
```
feat(viewport): add wireframe overlay toggle

- Add wireframe overlay option to viewport shading menu
- Implement keyboard shortcut 'W' for quick toggle
- Update status bar to show active overlays

Closes #123
```

## Pull Request Process

1. Fork the repository
2. Create feature branch from `develop`
3. Make changes with tests
4. Run full test suite: `pnpm test && pnpm test:e2e`
5. Ensure linting passes: `pnpm lint && pnpm typecheck`
6. Submit PR with clear description
6. Address review comments
7. Squash and merge

## Testing

### Unit Tests
```bash
# TypeScript
pnpm test

# Python
cd packages/ml-core && pytest -v
```

### E2E Tests
```bash
pnpm test:e2e
```

### Visual Regression
```bash
pnpm test:visual
```

## Release Process

1. Update version in `package.json` files
2. Update CHANGELOG.md
3. Create git tag: `git tag v1.0.0`
4. Push tag: `git push origin v1.0.0`
5. GitHub Actions builds and creates release

## Reporting Issues

Use GitHub Issues with templates:
- Bug Report
- Feature Request
- Documentation Issue
- Performance Issue

## Security

Report security vulnerabilities to: security@reina-del-sazon.dev

Do NOT create public issues for security vulnerabilities.
"""
    
    (docs_dir / "contributing.md").write_text(contrib_doc)
    
    print(f"✅ Created documentation in {docs_dir}")


async def main():
    """Main entry point"""
    import argparse
    
    parser = argparse.ArgumentParser(description="GitHub Auto-Sync for Reina del Sazón")
    parser.add_argument("--owner", default="chris100809", help="GitHub owner")
    parser.add_argument("--repo", default="reina-del-sazon", help="GitHub repository")
    parser.add_argument("--token", required=True, help="GitHub Personal Access Token")
    parser.add_argument("--branch", default="main", help="Git branch")
    parser.add_argument("--path", default=".", help="Local repository path")
    parser.add_argument("--force", action="store_true", help="Force push even if no changes")
    parser.add_argument("--create-workflows", action="store_true", help="Create GitHub workflow files")
    parser.add_argument("--create-docker", action="store_true", help="Create Docker files")
    parser.add_argument("--create-docs", action="store_true", help="Create documentation")
    
    args = parser.parse_args()
    
    local_path = Path(args.path).resolve()
    
    config = GitHubConfig(
        owner=args.owner,
        repo=args.repo,
        token=args.token,
        branch=args.branch,
    )
    
    sync = GitHubSync(config)
    
    try:
        # Create auxiliary files if requested
        if args.create_workflows:
            await create_github_workflow_files(local_path)
        
        if args.create_docker:
            await create_docker_files(local_path)
        
        if args.create_docs:
            await create_documentation(local_path)
        
        # Sync repository
        await sync.sync_repository(local_path, force=args.force)
        
    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())