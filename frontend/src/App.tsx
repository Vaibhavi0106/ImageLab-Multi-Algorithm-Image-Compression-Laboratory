import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { OverviewPage } from './pages/OverviewPage';
import { CompressionLabPage } from './pages/CompressionLabPage';
import { AlgorithmExplorerPage } from './pages/AlgorithmExplorerPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { ExperimentsPage } from './pages/ExperimentsPage';
import { TheoryDocumentationPage } from './pages/TheoryDocumentationPage';
import {
  HealthInfo,
  AlgorithmInfo,
  ImageAnalysis,
  CompressionResult
} from './types';
import {
  fetchHealth,
  fetchAlgorithms,
  analyzeImage,
  fetchExperiments
} from './services/api';

export function App() {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [health, setHealth] = useState<HealthInfo | null>(null);
  const [algorithms, setAlgorithms] = useState<AlgorithmInfo[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imageAnalysis, setImageAnalysis] = useState<ImageAnalysis | null>(null);
  const [latestResult, setLatestResult] = useState<CompressionResult | null>(null);
  const [experiments, setExperiments] = useState<CompressionResult[]>([]);

  // Load initial backend status and algorithm configurations
  useEffect(() => {
    fetchHealth()
      .then(setHealth)
      .catch((e) => console.error('Health fetch failed:', e));

    fetchAlgorithms()
      .then(setAlgorithms)
      .catch((e) => console.error('Algorithms fetch failed:', e));

    fetchExperiments()
      .then(setExperiments)
      .catch((e) => console.error('Experiments fetch failed:', e));
  }, []);

  const handleFileSelect = async (file: File) => {
    setSelectedFile(file);
    try {
      const analysis = await analyzeImage(file);
      setImageAnalysis(analysis);
    } catch (e) {
      console.error('Image analysis error:', e);
    }
  };

  const handleSelectImageAndNavigate = async (file: File) => {
    await handleFileSelect(file);
    setActiveTab('lab');
  };

  const handleExperimentComplete = (result: CompressionResult) => {
    setLatestResult(result);
    setExperiments((prev) => [result, ...prev]);
  };

  const handleBatchComplete = (results: CompressionResult[]) => {
    if (results.length > 0) {
      setLatestResult(results[results.length - 1]);
      setExperiments((prev) => [...results, ...prev]);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0813] text-slate-100 flex flex-col font-sans selection:bg-pink-500 selection:text-white">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        health={health}
      />

      <main className="flex-1 w-full px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12 pt-6">
        {activeTab === 'overview' && (
          <OverviewPage
            algorithms={algorithms}
            health={health}
            onSelectImageAndNavigate={handleSelectImageAndNavigate}
            onNavigate={setActiveTab}
          />
        )}

        {activeTab === 'lab' && (
          <CompressionLabPage
            algorithms={algorithms}
            selectedFile={selectedFile}
            imageAnalysis={imageAnalysis}
            onFileSelect={handleFileSelect}
            onExperimentComplete={handleExperimentComplete}
          />
        )}

        {activeTab === 'explorer' && (
          <AlgorithmExplorerPage latestResult={latestResult} />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsPage
            experiments={experiments}
            onNavigate={setActiveTab}
          />
        )}

        {activeTab === 'experiments' && (
          <ExperimentsPage
            algorithms={algorithms}
            selectedFile={selectedFile}
            imageAnalysis={imageAnalysis}
            onFileSelect={handleFileSelect}
            onBatchComplete={handleBatchComplete}
            onNavigate={setActiveTab}
          />
        )}

        {activeTab === 'theory' && (
          <TheoryDocumentationPage />
        )}
      </main>

      <footer className="border-t border-pink-950/40 bg-[#08050e] py-5 text-center text-xs text-slate-500 font-mono">
        <div className="w-full px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Image<span className="text-yellow-400">Lab</span> • <span className="text-pink-400">Advanced Compression Techniques</span> University Laboratory</span>
          <span className="text-slate-600">Discrete Cosine Transform • Wavelets • Huffman • JPEG 2000 • PNG</span>
        </div>
      </footer>
    </div>
  );
}

export default App;
