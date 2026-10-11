export interface AlgorithmParam {
  type: 'integer' | 'float' | 'boolean' | 'select';
  default: any;
  min?: number;
  max?: number;
  options?: string[];
  description: string;
}

export interface AlgorithmInfo {
  id: string;
  name: string;
  category: 'lossless' | 'lossy' | 'transform' | 'wavelet' | 'entropy';
  description: string;
  is_available: boolean;
  parameters: Record<string, AlgorithmParam>;
}

export interface CompressionMetrics {
  original_size_bytes: number;
  compressed_size_bytes: number;
  compression_ratio: number;
  space_saved_percent: number;
  bits_per_pixel: number;
  mse: number;
  psnr: number | null;
  psnr_display: string;
  is_infinite_psnr: boolean;
  ssim: number;
  is_exact_match: boolean;
  width: number;
  height: number;
  channels: number;
  encoding_time_ms: number;
  decoding_time_ms: number;
  total_time_ms: number;
}

export interface ArtifactInfo {
  filename: string;
  extension: string;
  mime_type: string;
  size_bytes: number;
}

export interface DCTInspection {
  sample_block_x: number;
  sample_block_y: number;
  spatial_values: number[][];
  shifted_values: number[][];
  dct_coefficients: number[][];
  quantization_table: number[][];
  quantized_coefficients: number[][];
}

export interface SubbandsPreview {
  LL: number[][];
  LH: number[][];
  HL: number[][];
  HH: number[][];
}

export interface CompressionResult {
  experiment_id: string;
  filename: string;
  algorithm_id: string;
  algorithm_name: string;
  category: string;
  parameters: Record<string, any>;
  metrics: CompressionMetrics;
  artifact_info: ArtifactInfo;
  inspection?: DCTInspection;
  subbands_preview?: SubbandsPreview;
  original_preview_b64?: string;
  reconstructed_preview_b64?: string;
  created_at: number;
}

export interface ImageAnalysis {
  filename: string;
  file_size_bytes: number;
  width: number;
  height: number;
  aspect_ratio: number;
  mode: string;
  channels: number;
  thumbnail_b64: string;
  entropy_analysis: {
    shannon_entropy: number;
    theoretical_min_bits: number;
    unique_symbols: number;
    huffman_efficiency: number;
    redundancy: number;
    symbol_table_sample: Array<{
      symbol: number;
      char: string;
      frequency: number;
      probability: number;
      code: string;
      code_length: number;
    }>;
  };
}

export interface HealthInfo {
  status: string;
  version: string;
  codecs_available: string[];
  jpeg2000_enabled: boolean;
}

export interface HuffmanAnalysisResult {
  total_symbols: number;
  unique_symbols: number;
  shannon_entropy: number;
  avg_code_length: number;
  redundancy: number;
  coding_efficiency: number;
  theoretical_min_bits: number;
  actual_encoded_bits: number;
  artifact_size_bytes: number;
  compression_ratio: number;
  symbol_table: Array<{
    symbol: number;
    char: string;
    frequency: number;
    probability: number;
    code: string;
    code_length: number;
  }>;
}
