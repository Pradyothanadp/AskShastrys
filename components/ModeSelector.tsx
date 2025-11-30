import React from 'react';
import { AppMode } from '../types';
import { Icons } from './Icons';

interface ModeSelectorProps {
  currentMode: AppMode;
  onSelectMode: (mode: AppMode) => void;
}

const ModeSelector: React.FC<ModeSelectorProps> = ({ currentMode, onSelectMode }) => {
  const modes = [
    { id: AppMode.HOMEWORK, label: 'Tutor', icon: Icons.Homework, color: 'text-green-400' },
    { id: AppMode.JARVIS, label: 'Jarvis', icon: Icons.Jarvis, color: 'text-cyan-400' },
    { id: AppMode.TRANSLATE, label: 'Translate', icon: Icons.Translate, color: 'text-purple-400' },
    { id: AppMode.SUMMARIZE, label: 'Summarize', icon: Icons.Summarize, color: 'text-orange-400' },
  ];

  return (
    <div className="flex overflow-x-auto pb-2 gap-2 scrollbar-hide">
      {modes.map((mode) => {
        const isActive = currentMode === mode.id;
        const Icon = mode.icon;
        return (
          <button
            key={mode.id}
            onClick={() => onSelectMode(mode.id)}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all duration-200 border
              ${isActive 
                ? 'bg-slate-800 border-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]' 
                : 'bg-slate-900 border-slate-700 hover:bg-slate-800'}
            `}
          >
            <Icon size={16} className={isActive ? mode.color : 'text-slate-400'} />
            <span className={`text-sm font-medium ${isActive ? 'text-white' : 'text-slate-400'}`}>
              {mode.label}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default ModeSelector;