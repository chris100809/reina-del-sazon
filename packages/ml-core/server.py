"""
Reina del Sazón - ML Reconstruction Server
FastAPI server for 2D→3D reconstruction pipeline
"""
import os
import sys
import asyncio
import logging
from pathlib import Path
from contextlib import asynccontextmanager
from typing import Optional, List, Dict, Any
from dataclasses import dataclass, asdict
from datetime import datetime

import numpy as np
import cv2
from fastapi import FastAPI, File, UploadFile, HTTPException, BackgroundTasks, Form
from fastapi.responses import JSONResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import uvicorn
import torch
from loguru import logger

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from depth_anything_v2.depth_estimator import DepthEstimator
from mesh_reconstruction.mesh_generator import MeshGenerator
from interior_generator.interior_builder import InteriorBuilder
from predictive_enhancer.enhancer import PredictiveEnhancer
from uv_unwrapper.uv_unwrapper import UVUnwrapper


# Configuration
@dataclass
class MLConfig:
    device: str = "cuda" if torch.cuda.is_available() else "cpu"
    depth_model: str = "depth_anything_v2_vitl"
    mesh_method: str = "poisson"
    mesh_depth: int = 9
    samples: int = 1000000
    uv_atlas_size: int = 4096
    generate_interior: bool = True
    interior_type: str = "vehicle"
    enhance_predictive: bool = True
    target_polycount: int = 50000
    output_dir: str = "outputs"
    temp_dir: str = "temp"


config = MLConfig()

# Initialize components
depth_estimator: Optional[DepthEstimator] = None
mesh_generator: Optional[MeshGenerator] = None
interior_builder: Optional[InteriorBuilder] = None
predictive_enhancer: Optional[PredictiveEnhancer] = None
uv_unwrapper: Optional[UVUnwrapper] = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global depth_estimator, mesh_generator, interior_builder, predictive_enhancer, uv_unwrapper
    
    logger.info(f"Starting ML server on {config.device}")
    
    # Initialize models
    depth_estimator = DepthEstimator(config.depth_model, config.device)
    await depth_estimator.load()
    
    mesh_generator = MeshGenerator(config.mesh_method, config.mesh_depth, config.samples)
    
    interior_builder = InteriorBuilder(config.interior_type)
    
    predictive_enhancer = PredictiveEnhancer(config.device)
    await predictive_enhancer.load()
    
    uv_unwrapper = UVUnwrapper(config.uv_atlas_size)
    
    # Create output directories
    Path(config.output_dir).mkdir(exist_ok=True)
    Path(config.temp_dir).mkdir(exist_ok=True)
    
    logger.info("ML server ready")
    yield
    
    logger.info("Shutting down ML server")


app = FastAPI(
    title="Reina del Sazón ML API",
    description="2D→3D Reconstruction Pipeline",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Request/Response Models
class ReconstructionRequest(BaseModel):
    depth_model: str = Field(default="depth_anything_v2_vitl")
    mesh_method: str = Field(default="poisson")
    mesh_depth: int = Field(default=9, ge=6, le=12)
    samples: int = Field(default=1000000, ge=100000, le=5000000)
    generate_interior: bool = Field(default=True)
    interior_type: str = Field(default="vehicle")
    enhance_predictive: bool = Field(default=True)
    enhance_types: List[str] = Field(default=["aerodynamic", "ergonomic", "aesthetic"])
    uv_unwrap: bool = Field(default=True)
    uv_atlas_size: int = Field(default=4096)
    target_polycount: int = Field(default=50000)
    simplify: bool = Field(default=False)


class ReconstructionResponse(BaseModel):
    job_id: str
    status: str
    message: str
    result_url: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


class JobStatus(BaseModel):
    job_id: str
    status: str  # pending, processing, completed, failed
    progress: float
    message: str
    result: Optional[Dict[str, Any]] = None
    error: Optional[str] = None


# In-memory job storage (use Redis in production)
jobs: Dict[str, JobStatus] = {}


async def process_reconstruction(job_id: str, image_path: str, request: ReconstructionRequest):
    """Background task for reconstruction pipeline"""
    job = jobs[job_id]
    
    try:
        job.status = "processing"
        job.progress = 0.1
        job.message = "Loading image..."
        
        # Load image
        image = cv2.imread(image_path)
        if image is None:
            raise ValueError("Failed to load image")
        image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        
        # Step 1: Depth Estimation
        job.progress = 0.2
        job.message = "Estimating depth..."
        depth_map, confidence = await depth_estimator.estimate(image)
        
        # Step 2: Mesh Reconstruction
        job.progress = 0.4
        job.message = "Generating mesh..."
        mesh = await mesh_generator.generate(image, depth_map, confidence)
        
        # Step 3: UV Unwrapping
        if request.uv_unwrap:
            job.progress = 0.55
            job.message = "Unwrapping UVs..."
            mesh = await uv_unwrapper.unwrap(mesh)
        
        # Step 4: Interior Generation
        interior = None
        if request.generate_interior:
            job.progress = 0.7
            job.message = "Generating interior..."
            interior = await interior_builder.generate(mesh, depth_map)
        
        # Step 5: Predictive Enhancement
        enhancements = []
        if request.enhance_predictive:
            job.progress = 0.85
            job.message = "Applying AI enhancements..."
            mesh, enhancements = await predictive_enhancer.enhance(
                mesh, request.enhance_types, request.interior_type
            )
        
        # Step 6: Simplification
        if request.simplify:
            job.progress = 0.9
            job.message = "Simplifying mesh..."
            mesh = await mesh_generator.simplify(mesh, request.target_polycount)
        
        # Step 7: Export
        job.progress = 0.95
        job.message = "Exporting results..."
        
        output_dir = Path(config.output_dir) / job_id
        output_dir.mkdir(exist_ok=True)
        
        # Export mesh as GLB
        import pygltflib
        glb_path = output_dir / "model.glb"
        mesh.export(str(glb_path))
        
        if interior:
            interior_path = output_dir / "interior.glb"
            interior.export(str(interior_path))
        
        # Save metadata
        metadata = {
            "job_id": job_id,
            "timestamp": datetime.now().isoformat(),
            "vertices": len(mesh.vertices),
            "faces": len(mesh.faces),
            "materials": len(mesh.materials) if hasattr(mesh, 'materials') else 1,
            "has_interior": interior is not None,
            "enhancements": enhancements,
            "depth_model": request.depth_model,
            "mesh_method": request.mesh_method,
        }
        
        import json
        with open(output_dir / "metadata.json", "w") as f:
            json.dump(metadata, f, indent=2)
        
        job.status = "completed"
        job.progress = 1.0
        job.message = "Reconstruction completed successfully"
        job.result = {
            "model_url": f"/api/download/{job_id}/model.glb",
            "interior_url": f"/api/download/{job_id}/interior.glb" if interior else None,
            "metadata_url": f"/api/download/{job_id}/metadata.json",
            "metadata": metadata,
        }
        
    except Exception as e:
        logger.error(f"Reconstruction failed for job {job_id}: {e}")
        job.status = "failed"
        job.progress = 0.0
        job.message = "Reconstruction failed"
        job.error = str(e)


@app.post("/api/reconstruct", response_model=ReconstructionResponse)
async def reconstruct(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    depth_model: str = Form(default="depth_anything_v2_vitl"),
    mesh_method: str = Form(default="poisson"),
    mesh_depth: int = Form(default=9),
    samples: int = Form(default=1000000),
    generate_interior: bool = Form(default=True),
    interior_type: str = Form(default="vehicle"),
    enhance_predictive: bool = Form(default=True),
    enhance_types: str = Form(default="aerodynamic,ergonomic,aesthetic"),
    uv_unwrap: bool = Form(default=True),
    uv_atlas_size: int = Form(default=4096),
    target_polycount: int = Form(default=50000),
    simplify: bool = Form(default=False),
):
    """Start 2D→3D reconstruction from uploaded image"""
    
    # Validate file
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(400, "File must be an image")
    
    # Generate job ID
    job_id = f"recon_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{np.random.randint(1000, 9999)}"
    
    # Save uploaded file
    temp_path = Path(config.temp_dir) / f"{job_id}_{file.filename}"
    temp_path.parent.mkdir(exist_ok=True)
    
    content = await file.read()
    with open(temp_path, "wb") as f:
        f.write(content)
    
    # Parse enhance_types
    enhance_list = [t.strip() for t in enhance_types.split(",")]
    
    # Create request
    request = ReconstructionRequest(
        depth_model=depth_model,
        mesh_method=mesh_method,
        mesh_depth=mesh_depth,
        samples=samples,
        generate_interior=generate_interior,
        interior_type=interior_type,
        enhance_predictive=enhance_predictive,
        enhance_types=enhance_list,
        uv_unwrap=uv_unwrap,
        uv_atlas_size=uv_atlas_size,
        target_polycount=target_polycount,
        simplify=simplify,
    )
    
    # Create job
    job = JobStatus(
        job_id=job_id,
        status="pending",
        progress=0.0,
        message="Job queued",
    )
    jobs[job_id] = job
    
    # Start background processing
    background_tasks.add_task(process_reconstruction, job_id, str(temp_path), request)
    
    return ReconstructionResponse(
        job_id=job_id,
        status="pending",
        message="Reconstruction started",
    )


@app.get("/api/status/{job_id}", response_model=JobStatus)
async def get_status(job_id: str):
    """Get reconstruction job status"""
    if job_id not in jobs:
        raise HTTPException(404, "Job not found")
    return jobs[job_id]


@app.get("/api/download/{job_id}/{filename}")
async def download_file(job_id: str, filename: str):
    """Download reconstruction output file"""
    file_path = Path(config.output_dir) / job_id / filename
    if not file_path.exists():
        raise HTTPException(404, "File not found")
    return FileResponse(file_path, filename=filename)


@app.get("/api/models")
async def list_models():
    """List available models"""
    return {
        "depth_models": [
            "depth_anything_v2_vits",
            "depth_anything_v2_vitb",
            "depth_anything_v2_vitl",
            "depth_anything_v2_metric_vits",
            "depth_anything_v2_metric_vitb",
            "depth_anything_v2_metric_vitl",
        ],
        "mesh_methods": ["poisson", "marching_cubes", "delaunay", "tetrahedral"],
        "interior_types": ["vehicle", "architectural", "product", "organic"],
        "enhancement_types": ["aerodynamic", "ergonomic", "aesthetic", "structural"],
    }


@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "device": config.device,
        "cuda_available": torch.cuda.is_available(),
        "gpu_name": torch.cuda.get_device_name(0) if torch.cuda.is_available() else None,
        "models_loaded": {
            "depth": depth_estimator is not None,
            "enhancer": predictive_enhancer is not None,
        },
    }


@app.get("/")
async def root():
    return {
        "name": "Reina del Sazón ML API",
        "version": "1.0.0",
        "description": "2D→3D Reconstruction Pipeline",
        "docs": "/docs",
    }


if __name__ == "__main__":
    uvicorn.run(
        "server:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info",
    )