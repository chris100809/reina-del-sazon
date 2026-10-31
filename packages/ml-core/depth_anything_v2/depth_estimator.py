"""
Depth-Anything-V2 Depth Estimator
State-of-the-art monocular depth estimation
"""
import asyncio
import logging
from pathlib import Path
from typing import Tuple, Optional

import cv2
import numpy as np
import torch
import torch.nn.functional as F
from loguru import logger

try:
    from transformers import AutoImageProcessor, AutoModelForDepthEstimation
    TRANSFORMERS_AVAILABLE = True
except ImportError:
    TRANSFORMERS_AVAILABLE = False
    logger.warning("Transformers not available, using fallback")


class DepthEstimator:
    """Depth-Anything-V2 based depth estimator"""
    
    MODEL_CONFIGS = {
        "depth_anything_v2_vits": "depth-anything/Depth-Anything-V2-Small-hf",
        "depth_anything_v2_vitb": "depth-anything/Depth-Anything-V2-Base-hf",
        "depth_anything_v2_vitl": "depth-anything/Depth-Anything-V2-Large-hf",
        "depth_anything_v2_metric_vits": "depth-anything/Depth-Anything-V2-Metric-Indoor-Small-hf",
        "depth_anything_v2_metric_vitb": "depth-anything/Depth-Anything-V2-Metric-Indoor-Base-hf",
        "depth_anything_v2_metric_vitl": "depth-anything/Depth-Anything-V2-Metric-Indoor-Large-hf",
    }
    
    def __init__(self, model_name: str = "depth_anything_v2_vitl", device: str = "cuda"):
        self.model_name = model_name
        self.device = device
        self.processor = None
        self.model = None
        self.input_size = 518  # Default for ViT-L
        self._loaded = False
    
    async def load(self):
        """Load model asynchronously"""
        if self._loaded:
            return
        
        logger.info(f"Loading Depth-Anything-V2 model: {self.model_name}")
        
        if not TRANSFORMERS_AVAILABLE:
            logger.warning("Using fallback depth estimation")
            self._loaded = True
            return
        
        try:
            model_id = self.MODEL_CONFIGS.get(self.model_name, self.MODEL_CONFIGS["depth_anything_v2_vitl"])
            
            # Load processor and model in thread pool to avoid blocking
            loop = asyncio.get_event_loop()
            self.processor = await loop.run_in_executor(
                None, lambda: AutoImageProcessor.from_pretrained(model_id)
            )
            self.model = await loop.run_in_executor(
                None, lambda: AutoModelForDepthEstimation.from_pretrained(model_id)
            )
            
            self.model.to(self.device)
            self.model.eval()
            
            # Enable optimizations
            if self.device == "cuda":
                self.model = torch.compile(self.model, mode="reduce-overhead")
            
            self._loaded = True
            logger.info(f"Model loaded on {self.device}")
            
        except Exception as e:
            logger.error(f"Failed to load model: {e}")
            raise
    
    async def estimate(self, image: np.ndarray) -> Tuple[np.ndarray, np.ndarray]:
        """
        Estimate depth from RGB image
        
        Args:
            image: HxWx3 RGB image (0-255)
            
        Returns:
            depth_map: HxW normalized depth (0-1)
            confidence: HxW confidence map (0-1)
        """
        if not self._loaded:
            await self.load()
        
        if not TRANSFORMERS_AVAILABLE or self.model is None:
            return self._fallback_depth(image)
        
        h, w = image.shape[:2]
        
        # Preprocess
        inputs = self.processor(images=image, return_tensors="pt")
        inputs = {k: v.to(self.device) for k, v in inputs.items()}
        
        # Inference
        with torch.no_grad():
            outputs = self.model(**inputs)
            predicted_depth = outputs.predicted_depth
        
        # Resize to original resolution
        prediction = F.interpolate(
            predicted_depth.unsqueeze(1),
            size=(h, w),
            mode="bicubic",
            align_corners=False,
        ).squeeze(1)
        
        # Normalize to 0-1
        depth_min = prediction.min()
        depth_max = prediction.max()
        depth_normalized = (prediction - depth_min) / (depth_max - depth_min + 1e-8)
        
        # Confidence based on gradient magnitude (simplified)
        depth_np = depth_normalized[0].cpu().numpy()
        grad_x = cv2.Sobel(depth_np, cv2.CV_32F, 1, 0, ksize=3)
        grad_y = cv2.Sobel(depth_np, cv2.CV_32F, 0, 1, ksize=3)
        gradient_magnitude = np.sqrt(grad_x**2 + grad_y**2)
        confidence = 1.0 - np.clip(gradient_magnitude / (gradient_magnitude.max() + 1e-8), 0, 1)
        
        # Smooth confidence
        confidence = cv2.GaussianBlur(confidence, (5, 5), 1.0)
        
        return depth_np, confidence.astype(np.float32)
    
    def _fallback_depth(self, image: np.ndarray) -> Tuple[np.ndarray, np.ndarray]:
        """Fallback depth estimation using classical methods"""
        logger.warning("Using fallback depth estimation (MiDaS-style)")
        
        gray = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)
        
        # Use simple gradient-based depth cue
        grad_x = cv2.Sobel(gray, cv2.CV_32F, 1, 0, ksize=3)
        grad_y = cv2.Sobel(gray, cv2.CV_32F, 0, 1, ksize=3)
        gradient_magnitude = np.sqrt(grad_x**2 + grad_y**2)
        
        # Invert: high gradient = near (edges), low gradient = far
        depth = 1.0 - cv2.normalize(gradient_magnitude, None, 0, 1, cv2.NORM_MINMAX)
        
        # Apply bilateral filter for smoothness
        depth = cv2.bilateralFilter(depth.astype(np.float32), 9, 75, 75)
        
        # Confidence based on texture
        confidence = cv2.Laplacian(gray, cv2.CV_32F)
        confidence = cv2.normalize(np.abs(confidence), None, 0, 1, cv2.NORM_MINMAX)
        confidence = cv2.GaussianBlur(confidence, (5, 5), 1.0)
        
        return depth, confidence.astype(np.float32)
    
    def preprocess_for_model(self, image: np.ndarray) -> torch.Tensor:
        """Preprocess image for model input"""
        # Resize maintaining aspect ratio
        h, w = image.shape[:2]
        scale = self.input_size / max(h, w)
        new_h, new_w = int(h * scale), int(w * scale)
        
        # Make divisible by 14 (ViT patch size)
        new_h = (new_h // 14) * 14
        new_w = (new_w // 14) * 14
        
        resized = cv2.resize(image, (new_w, new_h), interpolation=cv2.INTER_AREA)
        
        # Normalize
        mean = np.array([0.485, 0.456, 0.406], dtype=np.float32)
        std = np.array([0.229, 0.224, 0.225], dtype=np.float32)
        normalized = (resized / 255.0 - mean) / std
        
        # HWC to CHW
        tensor = torch.from_numpy(normalized.transpose(2, 0, 1)).unsqueeze(0)
        return tensor


class DepthAnythingV2ONNX:
    """ONNX Runtime optimized version for faster inference"""
    
    def __init__(self, onnx_path: str, device: str = "cuda"):
        self.onnx_path = onnx_path
        self.device = device
        self.session = None
        self.input_name = None
        self.output_name = None
    
    async def load(self):
        import onnxruntime as ort
        
        providers = ["CUDAExecutionProvider", "CPUExecutionProvider"] if self.device == "cuda" else ["CPUExecutionProvider"]
        self.session = ort.InferenceSession(self.onnx_path, providers=providers)
        
        self.input_name = self.session.get_inputs()[0].name
        self.output_name = self.session.get_outputs()[0].name
        
        logger.info(f"ONNX model loaded with providers: {providers}")
    
    async def estimate(self, image: np.ndarray) -> Tuple[np.ndarray, np.ndarray]:
        if self.session is None:
            await self.load()
        
        # Preprocess
        input_tensor = self.preprocess_for_model(image)
        input_numpy = input_tensor.numpy()
        
        # Run inference
        outputs = self.session.run([self.output_name], {self.input_name: input_numpy})
        predicted_depth = outputs[0]
        
        # Post-process (same as above)
        h, w = image.shape[:2]
        prediction = cv2.resize(predicted_depth[0], (w, h), interpolation=cv2.INTER_CUBIC)
        
        depth_min, depth_max = prediction.min(), prediction.max()
        depth_normalized = (prediction - depth_min) / (depth_max - depth_min + 1e-8)
        
        # Confidence
        grad_x = cv2.Sobel(depth_normalized, cv2.CV_32F, 1, 0, ksize=3)
        grad_y = cv2.Sobel(depth_normalized, cv2.CV_32F, 0, 1, ksize=3)
        gradient_magnitude = np.sqrt(grad_x**2 + grad_y**2)
        confidence = 1.0 - np.clip(gradient_magnitude / (gradient_magnitude.max() + 1e-8), 0, 1)
        confidence = cv2.GaussianBlur(confidence, (5, 5), 1.0)
        
        return depth_normalized.astype(np.float32), confidence.astype(np.float32)
    
    def preprocess_for_model(self, image: np.ndarray) -> torch.Tensor:
        h, w = image.shape[:2]
        scale = self.input_size / max(h, w)
        new_h, new_w = int(h * scale), int(w * scale)
        new_h = (new_h // 14) * 14
        new_w = (new_w // 14) * 14
        
        resized = cv2.resize(image, (new_w, new_h), interpolation=cv2.INTER_AREA)
        mean = np.array([0.485, 0.456, 0.406], dtype=np.float32)
        std = np.array([0.229, 0.224, 0.225], dtype=np.float32)
        normalized = (resized / 255.0 - mean) / std
        tensor = torch.from_numpy(normalized.transpose(2, 0, 1)).unsqueeze(0)
        return tensor


def export_to_onnx(model_name: str, output_path: str, input_size: int = 518):
    """Export Depth-Anything-V2 to ONNX format"""
    if not TRANSFORMERS_AVAILABLE:
        raise RuntimeError("Transformers required for export")
    
    import torch
    from transformers import AutoModelForDepthEstimation
    
    model = AutoModelForDepthEstimation.from_pretrained(
        DepthEstimator.MODEL_CONFIGS[model_name]
    )
    model.eval()
    
    dummy_input = torch.randn(1, 3, input_size, input_size)
    
    torch.onnx.export(
        model,
        dummy_input,
        output_path,
        input_names=["pixel_values"],
        output_names=["predicted_depth"],
        dynamic_axes={
            "pixel_values": {0: "batch", 2: "height", 3: "width"},
            "predicted_depth": {0: "batch", 2: "height", 3: "width"},
        },
        opset_version=17,
        do_constant_folding=True,
    )
    
    logger.info(f"Model exported to {output_path}")


if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1 and sys.argv[1] == "export":
        export_to_onnx("depth_anything_v2_vitl", "depth_anything_v2_vitl.onnx")