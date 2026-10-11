import React from 'react';
import {
  Layers,
  FlaskConical,
  Binary,
  BarChart3,
  Microscope,
  BookOpen,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { HealthInfo } from '../types';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  health: HealthInfo | null;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, health }) => {
  const navItems = [
    { id: 'overview', label: 'Overview', icon: Layers },
    { id: 'lab', label: 'Compression Lab', icon: FlaskConical },
    { id: 'explorer', label: 'Algorithm Explorer', icon: Binary },
    { id: 'analytics', label: 'Results & Analytics', icon: BarChart3 },
    { id: 'experiments', label: 'Experiments', icon: Microscope },
    { id: 'theory', label: 'Theory & Docs', icon: BookOpen },
  ];

  return (
    <header className="sticky top-0 z-50 bg-[#0c0816]/90 backdrop-blur-md border-b border-pink-950/50">
      <div className="w-full px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('overview')}>
            <div className="h-9 w-9 rounded-lg bg-pink-500/20 border border-pink-500/50 flex items-center justify-center text-pink-400 shadow-[0_0_12px_rgba(236,72,153,0.3)]">
              <FlaskConical className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-tight text-white font-mono">Image<span className="text-yellow-400">Lab</span></span>
                <span className="text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded bg-yellow-950/80 text-yellow-300 border border-yellow-700/60">
                  ACT 2026
                </span>
              </div>
              <p className="text-xs text-pink-300/60 hidden sm:block">Advanced Compression Laboratory</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex space-x-1 sm:space-x-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-pink-600/20 text-pink-300 border border-pink-500/50 shadow-[0_0_10px_rgba(236,72,153,0.2)]'
                      : 'text-slate-400 hover:text-yellow-300 hover:bg-pink-950/30'
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? 'text-yellow-400' : ''}`} />
                  <span className="hidden md:inline">{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Codec & Health Status Pill */}
          <div className="hidden lg:flex items-center gap-2 text-xs">
            {health?.status === 'healthy' ? (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-yellow-950/60 text-yellow-300 border border-yellow-700/60 shadow-[0_0_10px_rgba(234,179,8,0.15)]">
                <CheckCircle2 className="h-3.5 w-3.5 text-yellow-400" />
                <span>Backend Online</span>
                {health.jpeg2000_enabled && (
                  <span className="ml-1 text-[10px] text-pink-300 bg-pink-950/80 border border-pink-800/60 px-1 rounded">JP2</span>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-pink-950/60 text-pink-400 border border-pink-800/50">
                <AlertCircle className="h-3.5 w-3.5" />
                <span>Connecting...</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
