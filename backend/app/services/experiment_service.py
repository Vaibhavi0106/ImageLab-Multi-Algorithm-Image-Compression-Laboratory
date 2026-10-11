import io
import time
import uuid
import json
import base64
from pathlib import Path
from typing import Dict, Any, Optional, List, Tuple
from PIL import Image

from app.core.config import settings
from app.algorithms.registry import registry
from app.algorithms.huffman import HuffmanCoder
from app.metrics.evaluator import calculate_metrics

class ExperimentService:
    def __init__(self):
        self.experiments_dir = settings.STORAGE_DIR
        self.experiments_dir.mkdir(parents=True, exist_ok=True)
        # In-memory index of active experiment metadata
        self._index: Dict[str, Dict[str, Any]] = {}

    def analyze_image(self, file_bytes: bytes, filename: str) -> Dict[str, Any]:
        """Validates and analyzes an uploaded image file."""
        if len(file_bytes) > settings.MAX_UPLOAD_SIZE_BYTES:
            raise ValueError(f"File size exceeds maximum allowed of {settings.MAX_UPLOAD_SIZE_BYTES // (1024*1024)} MB")

        try:
            img = Image.open(io.BytesIO(file_bytes))
            img.verify()
            # Reopen after verify()
            img = Image.open(io.BytesIO(file_bytes))
            img.load()
        except Exception as e:
            raise ValueError(f"Invalid or corrupted image file: {str(e)}")

        w, h = img.size
        if w > settings.MAX_IMAGE_WIDTH or h > settings.MAX_IMAGE_HEIGHT:
            raise ValueError(f"Image dimensions {w}x{h} exceed maximum permitted ({settings.MAX_IMAGE_WIDTH}x{settings.MAX_IMAGE_HEIGHT})")

        if (w * h) > settings.MAX_TOTAL_PIXELS:
            raise ValueError(f"Total pixel count {w*h} exceeds safety ceiling ({settings.MAX_TOTAL_PIXELS})")

        # Color channels and mode
        mode = img.mode
        channels = len(img.getbands())

        # Raw Shannon Entropy calculation on image bytes
        huffman_analysis = HuffmanCoder.analyze(file_bytes)

        # Base64 thumbnail for preview
        thumb = img.copy()
        thumb.thumbnail((256, 256))
        thumb_buf = io.BytesIO()
        thumb.save(thumb_buf, format="PNG")
        thumb_b64 = "data:image/png;base64," + base64.b64encode(thumb_buf.getvalue()).decode("ascii")

        return {
            "filename": filename,
            "file_size_bytes": len(file_bytes),
            "width": w,
            "height": h,
            "aspect_ratio": round(w / h, 3) if h > 0 else 1.0,
            "mode": mode,
            "channels": channels,
            "thumbnail_b64": thumb_b64,
            "entropy_analysis": {
                "shannon_entropy": huffman_analysis["shannon_entropy"],
                "theoretical_min_bits": huffman_analysis["theoretical_min_bits"],
                "unique_symbols": huffman_analysis["unique_symbols"],
                "huffman_efficiency": huffman_analysis["coding_efficiency"],
                "redundancy": huffman_analysis["redundancy"],
                "symbol_table_sample": huffman_analysis["symbol_table"][:16]
            }
        }

    def run_compression(
        self,
        file_bytes: bytes,
        filename: str,
        algorithm_id: str,
        params: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Runs end-to-end compression, measurement, reconstruction, and artifact storage."""
        # Validate original image
        try:
            orig_img = Image.open(io.BytesIO(file_bytes))
            orig_img.load()
        except Exception as e:
            raise ValueError(f"Failed to decode uploaded image: {str(e)}")

        orig_size_bytes = len(file_bytes)
        codec = registry.get_codec(algorithm_id)

        # 1. Measure compression execution time
        t_enc_start = time.perf_counter()
        artifact_bytes, enc_meta = codec.compress(orig_img, **params)
        t_enc_end = time.perf_counter()
        encoding_time = t_enc_end - t_enc_start

        compressed_size_bytes = len(artifact_bytes)

        # 2. Measure decompression/reconstruction execution time
        t_dec_start = time.perf_counter()
        recon_img, dec_meta = codec.decompress(artifact_bytes, **params)
        t_dec_end = time.perf_counter()
        decoding_time = t_dec_end - t_dec_start

        # 3. Calculate rigorous mathematical metrics
        metrics = calculate_metrics(
            original_img=orig_img,
            reconstructed_img=recon_img,
            original_size_bytes=orig_size_bytes,
            compressed_size_bytes=compressed_size_bytes,
            encoding_time_sec=encoding_time,
            decoding_time_sec=decoding_time
        )

        # 4. Generate persistent experiment record and files
        experiment_id = str(uuid.uuid4())
        exp_dir = self.experiments_dir / experiment_id
        exp_dir.mkdir(parents=True, exist_ok=True)

        # Save artifact file
        artifact_ext = enc_meta.get("file_extension", "bin")
        artifact_path = exp_dir / f"artifact.{artifact_ext}"
        with open(artifact_path, "wb") as f:
            f.write(artifact_bytes)

        # Save reconstructed image as PNG
        recon_path = exp_dir / "reconstructed.png"
        recon_img.save(recon_path, format="PNG")

        # Save original image
        orig_path = exp_dir / "original.png"
        orig_img.save(orig_path, format="PNG")

        # Base64 thumbnail of reconstructed image for instant frontend rendering
        recon_thumb = recon_img.copy()
        recon_thumb.thumbnail((512, 512))
        recon_buf = io.BytesIO()
        recon_thumb.save(recon_buf, format="PNG")
        recon_b64 = "data:image/png;base64," + base64.b64encode(recon_buf.getvalue()).decode("ascii")

        # Base64 thumbnail of original image
        orig_thumb = orig_img.copy()
        orig_thumb.thumbnail((512, 512))
        orig_buf = io.BytesIO()
        orig_thumb.save(orig_buf, format="PNG")
        orig_b64 = "data:image/png;base64," + base64.b64encode(orig_buf.getvalue()).decode("ascii")

        record = {
            "experiment_id": experiment_id,
            "filename": filename,
            "algorithm_id": algorithm_id,
            "algorithm_name": codec.display_name,
            "category": codec.category,
            "parameters": params,
            "metrics": metrics,
            "artifact_info": {
                "filename": f"{Path(filename).stem}_compressed.{artifact_ext}",
                "extension": artifact_ext,
                "mime_type": enc_meta.get("mime_type", "application/octet-stream"),
                "size_bytes": compressed_size_bytes
            },
            "inspection": enc_meta.get("inspection"),
            "subbands_preview": enc_meta.get("subbands_preview"),
            "original_preview_b64": orig_b64,
            "reconstructed_preview_b64": recon_b64,
            "created_at": time.time()
        }

        # Save record json
        with open(exp_dir / "record.json", "w") as f:
            json.dump({k: v for k, v in record.items() if not k.endswith("_b64")}, f, indent=2)

        self._index[experiment_id] = record
        return record

    def get_experiment(self, experiment_id: str) -> Optional[Dict[str, Any]]:
        if experiment_id in self._index:
            return self._index[experiment_id]

        exp_dir = self.experiments_dir / experiment_id
        record_file = exp_dir / "record.json"
        if record_file.exists():
            with open(record_file, "r") as f:
                record = json.load(f)
            self._index[experiment_id] = record
            return record

        return None

    def get_artifact_file(self, experiment_id: str) -> Optional[Tuple[Path, str, str]]:
        exp = self.get_experiment(experiment_id)
        if not exp:
            return None
        ext = exp["artifact_info"]["extension"]
        mime = exp["artifact_info"]["mime_type"]
        filename = exp["artifact_info"]["filename"]
        path = self.experiments_dir / experiment_id / f"artifact.{ext}"
        if path.exists():
            return path, filename, mime
        return None

    def get_reconstructed_file(self, experiment_id: str) -> Optional[Path]:
        path = self.experiments_dir / experiment_id / "reconstructed.png"
        if path.exists():
            return path
        return None

    def get_original_file(self, experiment_id: str) -> Optional[Path]:
        path = self.experiments_dir / experiment_id / "original.png"
        if path.exists():
            return path
        return None

    def list_experiments(self) -> List[Dict[str, Any]]:
        return list(self._index.values())

    def run_batch_experiments(
        self,
        file_bytes: bytes,
        filename: str,
        configurations: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """Runs a series of experiments (e.g. parameter sweeps or cross-algorithm benchmarks)."""
        results = []
        for config in configurations:
            algo_id = config["algorithm_id"]
            params = config.get("parameters", {})
            try:
                res = self.run_compression(file_bytes, filename, algo_id, params)
                results.append(res)
            except Exception as e:
                results.append({
                    "error": str(e),
                    "algorithm_id": algo_id,
                    "parameters": params
                })
        return results

experiment_service = ExperimentService()
