"""
Mesh Reconstruction from Depth Maps
Supports Poisson, Marching Cubes, Delaunay, and Tetrahedral methods
"""
import asyncio
import logging
from pathlib import Path
from typing import Optional, Tuple, List, Dict, Any
from dataclasses import dataclass
from enum import Enum

import numpy as np
import open3d as o3d
import trimesh
from loguru import logger
from scipy.spatial import Delaunay
from skimage import measure


class MeshMethod(Enum):
    POISSON = "poisson"
    MARCHING_CUBES = "marching_cubes"
    DELAUNAY = "delaunay"
    TETRAHEDRAL = "tetrahedral"


@dataclass
class Mesh:
    vertices: np.ndarray  # Nx3
    faces: np.ndarray     # Mx3
    normals: Optional[np.ndarray] = None  # Nx3
    uvs: Optional[np.ndarray] = None      # Nx2
    colors: Optional[np.ndarray] = None   # Nx3 or Nx4
    materials: Optional[List[Dict]] = None
    
    def export(self, path: str):
        """Export mesh to file"""
        mesh = trimesh.Trimesh(
            vertices=self.vertices,
            faces=self.faces,
            vertex_normals=self.normals,
            vertex_attributes={"uv": self.uvs} if self.uvs is not None else None,
            vertex_colors=self.colors,
            process=False,
        )
        mesh.export(path)
    
    @property
    def vertex_count(self) -> int:
        return len(self.vertices)
    
    @property
    def face_count(self) -> int:
        return len(self.faces)


class MeshGenerator:
    """Generate watertight meshes from depth maps and RGB images"""
    
    def __init__(
        self,
        method: str = "poisson",
        depth: int = 9,
        samples: int = 1000000,
        min_density: float = 0.1,
    ):
        self.method = MeshMethod(method)
        self.depth = depth
        self.samples = samples
        self.min_density = min_density
    
    async def generate(
        self,
        image: np.ndarray,
        depth_map: np.ndarray,
        confidence: Optional[np.ndarray] = None,
        focal_length: Optional[float] = None,
    ) -> Mesh:
        """
        Generate mesh from RGB image and depth map
        
        Args:
            image: HxWx3 RGB image
            depth_map: HxW normalized depth (0-1)
            confidence: HxW confidence map (0-1)
            focal_length: Camera focal length in pixels
            
        Returns:
            Mesh object
        """
        h, w = depth_map.shape
        
        if focal_length is None:
            focal_length = max(h, w) * 1.2
        
        # Back-project depth to 3D points
        points, colors = self._depth_to_pointcloud(image, depth_map, confidence, focal_length)
        
        # Filter by confidence
        if confidence is not None:
            mask = confidence > self.min_density
            points = points[mask]
            colors = colors[mask]
        
        # Create Open3D point cloud
        pcd = o3d.geometry.PointCloud()
        pcd.points = o3d.utility.Vector3dVector(points)
        pcd.colors = o3d.utility.Vector3dVector(colors / 255.0)
        
        # Estimate normals
        pcd.estimate_normals(
            search_param=o3d.geometry.KDTreeSearchParamHybrid(radius=0.1, max_nn=30)
        )
        pcd.orient_normals_consistent_tangent_plane(100)
        
        # Generate mesh based on method
        if self.method == MeshMethod.POISSON:
            mesh = await self._poisson_reconstruction(pcd)
        elif self.method == MeshMethod.MARCHING_CUBES:
            mesh = await self._marching_cubes(pcd, depth_map.shape)
        elif self.method == MeshMethod.DELAUNAY:
            mesh = await self._delaunay_triangulation(pcd)
        elif self.method == MeshMethod.TETRAHEDRAL:
            mesh = await self._tetrahedral_reconstruction(pcd)
        else:
            raise ValueError(f"Unknown method: {self.method}")
        
        # Convert to our Mesh format
        return self._to_mesh(mesh, image.shape[:2])
    
    def _depth_to_pointcloud(
        self,
        image: np.ndarray,
        depth_map: np.ndarray,
        confidence: Optional[np.ndarray],
        focal_length: float,
    ) -> Tuple[np.ndarray, np.ndarray]:
        """Back-project depth map to 3D point cloud"""
        h, w = depth_map.shape
        
        # Create pixel coordinates
        u, v = np.meshgrid(np.arange(w), np.arange(h))
        
        # Normalize depth to meters (assuming max depth ~10m)
        max_depth = 10.0
        z = depth_map * max_depth
        
        # Back-project
        cx, cy = w / 2, h / 2
        x = (u - cx) * z / focal_length
        y = (v - cy) * z / focal_length
        
        # Stack coordinates
        points = np.stack([x, y, z], axis=-1).reshape(-1, 3)
        colors = image.reshape(-1, 3)
        
        # Filter valid points
        valid = (z > 0.01) & (z < max_depth) & np.isfinite(z).reshape(-1)
        if confidence is not None:
            valid = valid & (confidence.reshape(-1) > self.min_density)
        
        return points[valid], colors[valid]
    
    async def _poisson_reconstruction(self, pcd: o3d.geometry.PointCloud) -> o3d.geometry.TriangleMesh:
        """Poisson Surface Reconstruction"""
        logger.info(f"Running Poisson reconstruction (depth={self.depth})")
        
        # Run in thread pool to avoid blocking
        loop = asyncio.get_event_loop()
        mesh, densities = await loop.run_in_executor(
            None,
            lambda: o3d.geometry.TriangleMesh.create_from_point_cloud_poisson(
                pcd, depth=self.depth, width=0, scale=1.1, linear_fit=False
            )
        )
        
        # Remove low-density vertices
        densities = np.asarray(densities)
        density_threshold = np.quantile(densities, 0.01)
        vertices_to_remove = densities < density_threshold
        mesh.remove_vertices_by_mask(vertices_to_remove)
        
        # Clean up
        mesh.remove_degenerate_triangles()
        mesh.remove_duplicated_triangles()
        mesh.remove_duplicated_vertices()
        mesh.remove_non_manifold_edges()
        
        return mesh
    
    async def _marching_cubes(
        self, pcd: o3d.geometry.PointCloud, shape: Tuple[int, int]
    ) -> o3d.geometry.TriangleMesh:
        """Marching Cubes on voxel grid"""
        logger.info("Running Marching Cubes reconstruction")
        
        # Create voxel grid
        voxel_size = 0.02
        voxel_grid = o3d.geometry.VoxelGrid.create_from_point_cloud(pcd, voxel_size)
        
        # Convert to dense grid for marching cubes
        # This is a simplified version - in production use a proper TSDF
        points = np.asarray(pcd.points)
        colors = np.asarray(pcd.colors)
        
        # Create bounds
        min_bound = points.min(axis=0) - 0.1
        max_bound = points.max(axis=0) + 0.1
        
        # Use trimesh for marching cubes (simplified)
        loop = asyncio.get_event_loop()
        mesh = await loop.run_in_executor(
            None,
            lambda: self._marching_cubes_trimesh(points, colors, min_bound, max_bound, voxel_size)
        )
        
        return mesh
    
    def _marching_cubes_trimesh(
        self,
        points: np.ndarray,
        colors: np.ndarray,
        min_bound: np.ndarray,
        max_bound: np.ndarray,
        voxel_size: float,
    ) -> o3d.geometry.TriangleMesh:
        """Marching cubes using trimesh"""
        # Create a simple voxel grid and run marching cubes
        # This is a placeholder - real implementation would use TSDF fusion
        dims = ((max_bound - min_bound) / voxel_size).astype(int)
        dims = np.clip(dims, 32, 256)
        
        # Use trimesh's voxelization
        cloud = trimesh.PointCloud(points)
        voxelized = cloud.voxelized(voxel_size)
        
        # Marching cubes on the voxel grid
        mesh = voxelized.marching_cubes
        
        # Convert to Open3D
        o3d_mesh = o3d.geometry.TriangleMesh()
        o3d_mesh.vertices = o3d.utility.Vector3dVector(mesh.vertices)
        o3d_mesh.triangles = o3d.utility.Vector3iVector(mesh.faces)
        o3d_mesh.compute_vertex_normals()
        
        return o3d_mesh
    
    async def _delaunay_triangulation(self, pcd: o3d.geometry.PointCloud) -> o3d.geometry.TriangleMesh:
        """Delaunay triangulation for surface reconstruction"""
        logger.info("Running Delaunay triangulation")
        
        points = np.asarray(pcd.points)
        
        # 2.5D Delaunay (project to best plane)
        # Find dominant plane using PCA
        from sklearn.decomposition import PCA
        pca = PCA(n_components=3)
        pca.fit(points)
        normal = pca.components_[2]  # Smallest variance direction
        
        # Project to plane
        center = points.mean(axis=0)
        projected = points - center
        projected = projected - np.outer(projected @ normal, normal)
        
        # 2D Delaunay
        coords_2d = projected[:, :2]  # Simplified - should use proper basis
        tri = Delaunay(coords_2d)
        
        # Create mesh
        mesh = o3d.geometry.TriangleMesh()
        mesh.vertices = o3d.utility.Vector3dVector(points)
        mesh.triangles = o3d.utility.Vector3iVector(tri.simplices)
        mesh.compute_vertex_normals()
        
        return mesh
    
    async def _tetrahedral_reconstruction(self, pcd: o3d.geometry.PointCloud) -> o3d.geometry.TriangleMesh:
        """Tetrahedral reconstruction (requires CGAL or similar)"""
        logger.info("Running Tetrahedral reconstruction (fallback to Poisson)")
        return await self._poisson_reconstruction(pcd)
    
    def _to_mesh(self, o3d_mesh: o3d.geometry.TriangleMesh, image_shape: Tuple[int, int]) -> Mesh:
        """Convert Open3D mesh to our Mesh format"""
        vertices = np.asarray(o3d_mesh.vertices)
        faces = np.asarray(o3d_mesh.triangles)
        normals = np.asarray(o3d_mesh.vertex_normals) if o3d_mesh.has_vertex_normals() else None
        colors = np.asarray(o3d_mesh.vertex_colors) if o3d_mesh.has_vertex_colors() else None
        
        if colors is not None:
            colors = (colors * 255).astype(np.uint8)
        
        return Mesh(
            vertices=vertices,
            faces=faces,
            normals=normals,
            colors=colors,
        )
    
    async def simplify(self, mesh: Mesh, target_faces: int) -> Mesh:
        """Simplify mesh to target face count using quadric decimation"""
        if mesh.face_count <= target_faces:
            return mesh
        
        logger.info(f"Simplifying mesh from {mesh.face_count} to {target_faces} faces")
        
        tm_mesh = trimesh.Trimesh(vertices=mesh.vertices, faces=mesh.faces, process=False)
        simplified = tm_mesh.simplify_quadric_decimation(target_faces)
        
        return Mesh(
            vertices=simplified.vertices,
            faces=simplified.faces,
            normals=simplified.vertex_normals if hasattr(simplified, 'vertex_normals') else None,
        )
    
    async def remesh(self, mesh: Mesh, target_edge_length: float) -> Mesh:
        """Remesh to uniform edge length (requires pymeshlab)"""
        try:
            import pymeshlab
            
            ms = pymeshlab.MeshSet()
            ms.add_mesh(pymeshlab.Mesh(mesh.vertices, mesh.faces))
            ms.apply_filter("meshing_isotropic_explicit_remeshing", targetlen=pymeshlab.Percentage(target_edge_length))
            
            m = ms.current_mesh()
            return Mesh(
                vertices=m.vertex_matrix(),
                faces=m.face_matrix(),
            )
        except ImportError:
            logger.warning("pymeshlab not available, skipping remesh")
            return mesh


class MeshProcessor:
    """Additional mesh processing utilities"""
    
    @staticmethod
    def compute_bounding_box(mesh: Mesh) -> Tuple[np.ndarray, np.ndarray]:
        """Compute axis-aligned bounding box"""
        return mesh.vertices.min(axis=0), mesh.vertices.max(axis=0)
    
    @staticmethod
    def center_mesh(mesh: Mesh) -> Mesh:
        """Center mesh at origin"""
        center = mesh.vertices.mean(axis=0)
        centered_vertices = mesh.vertices - center
        return Mesh(
            vertices=centered_vertices,
            faces=mesh.faces,
            normals=mesh.normals,
            uvs=mesh.uvs,
            colors=mesh.colors,
        )
    
    @staticmethod
    def scale_mesh(mesh: Mesh, scale: float) -> Mesh:
        """Scale mesh uniformly"""
        return Mesh(
            vertices=mesh.vertices * scale,
            faces=mesh.faces,
            normals=mesh.normals,
            uvs=mesh.uvs,
            colors=mesh.colors,
        )
    
    @staticmethod
    def merge_meshes(meshes: List[Mesh]) -> Mesh:
        """Merge multiple meshes"""
        all_vertices = []
        all_faces = []
        vertex_offset = 0
        
        for m in meshes:
            all_vertices.append(m.vertices)
            all_faces.append(m.faces + vertex_offset)
            vertex_offset += len(m.vertices)
        
        return Mesh(
            vertices=np.vstack(all_vertices),
            faces=np.vstack(all_faces),
        )
    
    @staticmethod
    def repair_mesh(mesh: Mesh) -> Mesh:
        """Repair mesh (fill holes, fix normals, etc.)"""
        tm_mesh = trimesh.Trimesh(vertices=mesh.vertices, faces=mesh.faces, process=True)
        tm_mesh.fill_holes()
        tm_mesh.fix_normals()
        
        return Mesh(
            vertices=tm_mesh.vertices,
            faces=tm_mesh.faces,
            normals=tm_mesh.vertex_normals,
        )


if __name__ == "__main__":
    # Test
    async def test():
        generator = MeshGenerator(method="poisson", depth=8)
        # Create dummy data
        image = np.random.randint(0, 255, (480, 640, 3), dtype=np.uint8)
        depth = np.random.rand(480, 640).astype(np.float32)
        mesh = await generator.generate(image, depth)
        print(f"Generated mesh: {mesh.vertex_count} vertices, {mesh.face_count} faces")
    
    asyncio.run(test())