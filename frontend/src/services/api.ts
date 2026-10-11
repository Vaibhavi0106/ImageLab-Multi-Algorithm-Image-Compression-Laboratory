import {
  HealthInfo,
  AlgorithmInfo,
  ImageAnalysis,
  CompressionResult,
  HuffmanAnalysisResult
} from '../types';

const BASE_URL = '/api';

export async function fetchHealth(): Promise<HealthInfo> {
  const res = await fetch(`${BASE_URL}/health`);
  if (!res.ok) throw new Error('Failed to connect to backend health service');
  return res.json();
}

export async function fetchAlgorithms(): Promise<AlgorithmInfo[]> {
  const res = await fetch(`${BASE_URL}/algorithms`);
  if (!res.ok) throw new Error('Failed to fetch algorithm definitions');
  return res.json();
}

export async function analyzeImage(file: File): Promise<ImageAnalysis> {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`${BASE_URL}/images/analyze`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: 'Failed to analyze image' }));
    throw new Error(errorData.detail || 'Image analysis error');
  }
  return res.json();
}

export async function compressImage(
  file: File,
  algorithmId: string,
  params: Record<string, any>
): Promise<CompressionResult> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('algorithm_id', algorithmId);
  formData.append('params', JSON.stringify(params));

  const res = await fetch(`${BASE_URL}/compress`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: 'Compression failed' }));
    throw new Error(errorData.detail || 'Compression execution error');
  }
  return res.json();
}

export async function runBatchExperiments(
  file: File,
  configurations: Array<{ algorithm_id: string; parameters: Record<string, any> }>
): Promise<CompressionResult[]> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('configurations', JSON.stringify(configurations));

  const res = await fetch(`${BASE_URL}/experiments`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: 'Batch experiment failed' }));
    throw new Error(errorData.detail || 'Batch execution error');
  }
  return res.json();
}

export async function fetchExperiments(): Promise<CompressionResult[]> {
  const res = await fetch(`${BASE_URL}/experiments`);
  if (!res.ok) throw new Error('Failed to fetch experiments history');
  return res.json();
}

export async function analyzeHuffmanText(textData: string): Promise<HuffmanAnalysisResult> {
  const res = await fetch(`${BASE_URL}/huffman/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text_data: textData }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: 'Huffman analysis failed' }));
    throw new Error(errorData.detail || 'Huffman analysis error');
  }
  return res.json();
}

export function getArtifactDownloadUrl(experimentId: string): string {
  return `${BASE_URL}/experiments/${experimentId}/download`;
}

export function getReconstructedImageUrl(experimentId: string): string {
  return `${BASE_URL}/experiments/${experimentId}/reconstructed`;
}

export function getExportCsvUrl(): string {
  return `${BASE_URL}/experiments/export/csv`;
}
