"""
UV Unwrapper
Automatic UV unwrapping with xatlas and custom algorithms
"""
import asyncio
import logging
from pathlib import Path
from typing import Optional, List, Dict, Any, Tuple
from dataclasses import dataclass

import numpy as np
import trimesh
from loguru import logger

try:
    import xatlas
    XATLAS_AVAILABLE = True
except ImportError:
    XATLAS_AVAILABLE = False
    logger.warning("xatlas not available, using fallback UV unwrapping")


@dataclass
class UVChart:
    id: int
    faces: np.ndarray  # Face indices
    uvs: np.ndarray    # UV coordinates for chart vertices
    bounds: Tuple[np.ndarray, np.ndarray]  # min, max in UV space
    area: float
    stretch: float


@dataclass
class UVAtlas:
    uvs: np.ndarray           # Nx2 UV coordinates per vertex
    charts: List[UVChart]     # Chart information
    atlas_size: int           # Texture atlas resolution
    material_ids: np.ndarray  # Per-face material ID


class UVUnwrapper:
    """Automatic UV unwrapping with multiple algorithms"""
    
    def __init__(
        self,
        atlas_size: int = 4096,
        gutter: int = 4,
        max_charts: int = 128,
        normal_seam_angle: float = 1.047,  # 60 degrees
        texture_seam_angle: float = 0.524,  # 30 degrees
    ):
        self.atlas_size = atlas_size
        self.gutter = gutter
        self.max_charts = max_charts
        self.normal_seam_angle = normal_seam_angle
        self.texture_seam_angle = texture_seam_angle
    
    async def unwrap(self, mesh: trimesh.Trimesh) -> UVAtlas:
        """
        Unwrap mesh UVs
        
        Args:
            mesh: Input mesh (should be watertight)
            
        Returns:
            UVAtlas with unwrapped UVs
        """
        logger.info(f"Unwrapping mesh: {len(mesh.vertices)} vertices, {len(mesh.faces)} faces")
        
        if XATLAS_AVAILABLE:
            return await self._unwrap_xatlas(mesh)
        else:
            return await self._unwrap_fallback(mesh)
    
    async def _unwrap_xatlas(self, mesh: trimesh.Trimesh) -> UVAtlas:
        """Unwrap using xatlas (industry standard)"""
        logger.info("Using xatlas for UV unwrapping")
        
        # Prepare data for xatlas
        vertices = mesh.vertices.astype(np.float32)
        indices = mesh.faces.astype(np.uint32).flatten()
        
        # Configure xatlas
        atlas = xatlas.Atlas()
        atlas.add_mesh(vertices, indices)
        
        # Set parameters
        params = xatlas.PackOptions()
        params.bilinear = True
        params.blockAlign = True
        params.bruteForce = False
        params.chartOptions = xatlas.ChartOptions()
        params.chartOptions.maxChartArea = 0
        params.chartOptions.maxBoundaryLength = 0
        params.chartOptions.normalDeviationWeight = 2.0
        params.chartOptions.roundnessWeight = 0.01
        params.chartOptions.straightnessWeight = 6.0
        params.chartOptions.normalSeamAngle = self.normal_seam_angle
        params.chartOptions.textureSeamAngle = self.texture_seam_angle
        params.chartOptions.maxCost = 4.0
        params.chartOptions.maxIterations = 4
        params.chartOptions.useInputMeshUvs = False
        params.chartOptions.fixWinding = True
        
        params.maxChartCount = self.max_charts
        params.padding = self.gutter
        params.resolution = self.atlas_size
        params.texelsPerUnit = 10.0
        
        # Generate atlas
        logger.info("Generating UV atlas...")
        atlas.generate(atlas_size=self.atlas_size, options=params)
        
        # Get results
        vmapping, indices_out, uvs = atlas[0]
        
        # Remap vertices
        new_vertices = vertices[vmapping]
        new_faces = indices_out.reshape(-1, 3)
        new_uvs = uvs
        
        # Create chart information
        charts = self._extract_charts(atlas, new_faces, new_uvs)
        
        return UVAtlas(
            uvs=new_uvs,
            charts=charts,
            atlas_size=self.atlas_size,
            material_ids=np.zeros(len(new_faces), dtype=np.uint32),
        )
    
    def _extract_charts(self, atlas: xatlas.Atlas, faces: np.ndarray, uvs: np.ndarray) -> List[UVChart]:
        """Extract chart information from xatlas"""
        charts = []
        
        # xatlas doesn't directly expose chart info, so we infer from UV discontinuities
        # This is a simplified version
        chart_id = 0
        chart_faces = {}
        
        for i, face in enumerate(faces):
            # Get UV bounds for this face
            face_uvs = uvs[face]
            uv_min = face_uvs.min(axis=0)
            uv_max = face_uvs.max(axis=0)
            
            # Simple clustering by UV position
            uv_center = (uv_min + uv_max) / 2
            chart_key = (int(uv_center[0] * 10), int(uv_center[1] * 10))
            
            if chart_key not in chart_faces:
                chart_faces[chart_key] = []
            chart_faces[chart_key].append(i)
        
        for chart_key, face_indices in chart_faces.items():
            face_indices = np.array(face_indices)
            chart_uvs = uvs[faces[face_indices].flatten()]
            unique_verts, inverse = np.unique(faces[face_indices], return_inverse=True)
            
            chart = UVChart(
                id=chart_id,
                faces=face_indices,
                uvs=chart_uvs,
                bounds=(chart_uvs.min(axis=0), chart_uvs.max(axis=0)),
                area=float(len(face_indices)),
                stretch=1.0,  # Would compute actual stretch
            )
            charts.append(chart)
            chart_id += 1
        
        return charts
    
    async def _unwrap_fallback(self, mesh: trimesh.Trimesh) -> UVAtlas:
        """Fallback UV unwrapping using simple algorithms"""
        logger.info("Using fallback UV unwrapping")
        
        # Try different strategies based on mesh topology
        if self._is_simple_topology(mesh):
            return await self._unwrap_planar(mesh)
        else:
            return await self._unwrap_smart_project(mesh)
    
    def _is_simple_topology(self, mesh: trimesh.Trimesh) -> bool:
        """Check if mesh has simple topology (box-like, cylindrical, etc.)"""
        # Check genus (should be 0 for simple)
        euler = mesh.euler_number
        return euler == 2  # Sphere topology
    
    async def _unwrap_planar(self, mesh: trimesh.Trimesh) -> UVAtlas:
        """Planar projection unwrapping"""
        # Find best projection plane using PCA
        from sklearn.decomposition import PCA
        
        pca = PCA(n_components=3)
        pca.fit(mesh.vertices)
        
        # Project to first two principal components
        projected = pca.transform(mesh.vertices)[:, :2]
        
        # Normalize to 0-1
        min_vals = projected.min(axis=0)
        max_vals = projected.max(axis=0)
        uvs = (projected - min_vals) / (max_vals - min_vals + 1e-8)
        
        # Add margin
        margin = 0.01
        uvs = uvs * (1 - 2 * margin) + margin
        
        return UVAtlas(
            uvs=uvs,
            charts=[UVChart(
                id=0,
                faces=np.arange(len(mesh.faces)),
                uvs=uvs,
                bounds=(min_vals, max_vals),
                area=1.0,
                stretch=1.0,
            )],
            atlas_size=self.atlas_size,
            material_ids=np.zeros(len(mesh.faces), dtype=np.uint32),
        )
    
    async def _unwrap_smart_project(self, mesh: trimesh.Trimesh) -> UVAtlas:
        """Smart project unwrapping (Blender-style)"""
        # Cluster faces by normal direction
        face_normals = mesh.face_normals
        
        # Use k-means to cluster faces
        from sklearn.cluster import KMeans
        
        n_clusters = min(self.max_charts, max(1, len(mesh.faces) // 100))
        kmeans = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
        labels = kmeans.fit_predict(face_normals)
        
        all_uvs = np.zeros((len(mesh.vertices), 2))
        vertex_chart_weights = np.zeros((len(mesh.vertices), n_clusters))
        
        # Process each cluster
        for cluster_id in range(n_clusters):
            cluster_faces = mesh.faces[labels == cluster_id]
            if len(cluster_faces) == 0:
                continue
            
            # Get unique vertices in cluster
            cluster_vertices_idx = np.unique(cluster_faces.flatten())
            cluster_vertices = mesh.vertices[cluster_vertices_idx]
            
            # Project cluster to best plane
            cluster_normals = face_normals[labels == cluster_id]
            avg_normal = cluster_normals.mean(axis=0)
            avg_normal = avg_normal / np.linalg.norm(avg_normal)
            
            # Create projection basis
            basis = self._create_basis(avg_normal)
            projected = cluster_vertices @ basis.T
            
            # Normalize UVs
            min_vals = projected.min(axis=0)
            max_vals = projected.max(axis=0)
            uv_range = max_vals - min_vals + 1e-8
            
            # Pack into atlas grid
            grid_x = cluster_id % int(np.sqrt(n_clusters))
            grid_y = cluster_id // int(np.sqrt(n_clusters))
            grid_size = 1.0 / np.ceil(np.sqrt(n_clusters))
            
            uv_offset = np.array([grid_x * grid_size, grid_y * grid_size])
            uv_scale = grid_size * 0.95  # Leave gutter
            
            cluster_uvs = (projected - min_vals) / uv_range * uv_scale + uv_offset + 0.005
            
            # Accumulate (weighted average for shared vertices)
            for i, v_idx in enumerate(cluster_vertices_idx):
                all_uvs[v_idx] += cluster_uvs[i]
                vertex_chart_weights[v_idx, cluster_id] += 1
        
        # Normalize by weights
        for i in range(len(all_uvs)):
            weight_sum = vertex_chart_weights[i].sum()
            if weight_sum > 0:
                all_uvs[i] /= weight_sum
        
        # Create single chart for simplicity
        chart = UVChart(
            id=0,
            faces=np.arange(len(mesh.faces)),
            uvs=all_uvs,
            bounds=(all_uvs.min(axis=0), all_uvs.max(axis=0)),
            area=1.0,
            stretch=1.0,
        )
        
        return UVAtlas(
            uvs=all_uvs,
            charts=[chart],
            atlas_size=self.atlas_size,
            material_ids=np.zeros(len(mesh.faces), dtype=np.uint32),
        )
    
    def _create_basis(self, normal: np.ndarray) -> np.ndarray:
        """Create orthonormal basis from normal"""
        # Find arbitrary perpendicular vector
        if abs(normal[0]) > abs(normal[1]):
            tangent = np.array([-normal[2], 0, normal[0]])
        else:
            tangent = np.array([0, normal[2], -normal[1]])
        tangent = tangent / np.linalg.norm(tangent)
        bitangent = np.cross(normal, tangent)
        return np.array([tangent, bitangent])


class UVLayoutOptimizer:
    """Optimize UV layout for texture space efficiency"""
    
    def __init__(self, atlas_size: int = 4096):
        self.atlas_size = atlas_size
    
    def optimize(self, atlas: UVAtlas) -> UVAtlas:
        """Optimize UV layout: rotate, scale, translate charts"""
        # This would implement UV packing algorithms
        # For now, return as-is
        return atlas
    
    def pack_rectangles(self, rects: List[Tuple[float, float]]) -> List[Tuple[float, float]]:
        """Pack rectangles into atlas (simplified shelf packing)"""
        # Sort by height descending
        rects = sorted(rects, key=lambda r: r[1], reverse=True)
        
        positions = []
        shelf_y = 0
        shelf_height = 0
        x = 0
        
        for w, h in rects:
            if x + w > 1.0:
                # New shelf
                x = 0
                shelf_y += shelf_height + 0.01
                shelf_height = h
            else:
                shelf_height = max(shelf_height, h)
            
            positions.append((x, shelf_y))
            x += w + 0.01
        
        return positions


class UDIMGenerator:
    """Generate UDIM (U-Dimension) tile layout for high-res texturing"""
    
    def __init__(self, base_tile: int = 1001):
        self.base_tile = base_tile
        self.tiles = {}
    
    def assign_udims(self, atlas: UVAtlas, max_tiles: int = 10) -> Dict[int, UVAtlas]:
        """Split atlas into UDIM tiles"""
        # Group charts by UV tile
        tiles = {}
        
        for chart in atlas.charts:
            # Determine which tile this chart belongs to
            center = (chart.bounds[0] + chart.bounds[1]) / 2
            tile_u = int(center[0])
            tile_v = int(center[1])
            tile_id = self.base_tile + tile_v * 10 + tile_u
            
            if tile_id not in tiles:
                tiles[tile_id] = []
            tiles[tile_id].append(chart)
        
        # Create sub-atlases for each tile
        udim_atlases = {}
        for tile_id, charts in tiles.items():
            if tile_id - self.base_tile >= max_tiles:
                continue
            
            # Combine charts in this tile
            # Simplified: create new atlas
            udim_atlases[tile_id] = UVAtlas(
                uvs=atlas.uvs,  # Would remap
                charts=charts,
                atlas_size=atlas.atlas_size,
                material_ids=atlas.material_ids,
            )
        
        return udim_atlases


def compute_uv_stretch(mesh: trimesh.Trimesh, uvs: np.ndarray) -> Tuple[float, float]:
    """Compute UV stretch metrics (area and angle distortion)"""
    # Area stretch
    face_areas_3d = mesh.area_faces
    face_uvs = uvs[mesh.faces]
    
    # 2D triangle area in UV space
    v0, v1, v2 = face_uvs[:, 0], face_uvs[:, 1], face_uvs[:, 2]
    face_areas_uv = 0.5 * np.abs(
        (v1[:, 0] - v0[:, 0]) * (v2[:, 1] - v0[:, 1]) -
        (v2[:, 0] - v0[:, 0]) * (v1[:, 1] - v0[:, 1])
    )
    
    # Area ratio
    area_ratio = face_areas_uv / (face_areas_3d + 1e-8)
    area_stretch = np.maximum(area_ratio, 1.0 / area_ratio).mean()
    
    # Angle stretch (simplified)
    angle_stretch = 1.0
    
    return float(area_stretch), float(angle_stretch)


def apply_uv_to_mesh(mesh: trimesh.Trimesh, uv_atlas: UVAtlas) -> trimesh.Trimesh:
    """Apply UV atlas to mesh"""
    # Create new mesh with UVs
    new_mesh = trimesh.Trimesh(
        vertices=mesh.vertices,
        faces=mesh.faces,
        vertex_attributes={"uv": uv_atlas.uvs},
        process=False,
    )
    return new_mesh


if __name__ == "__main__":
    async def test():
        unwrapper = UVUnwrapper(atlas_size=2048)
        
        # Test with box
        mesh = trimesh.creation.box(extents=[2, 1, 1])
        atlas = await unwrapper.unwrap(mesh)
        
        print(f"UV Atlas: {atlas.uvs.shape[0]} vertices, {len(atlas.charts)} charts")
        print(f"UV range: {atlas.uvs.min(axis=0)} to {atlas.uvs.max(axis=0)}")
        
        # Compute stretch
        area_stretch, angle_stretch = compute_uv_stretch(mesh, atlas.uvs)
        print(f"Stretch - Area: {area_stretch:.3f}, Angle: {angle_stretch:.3f}")
    
    asyncio.run(test())