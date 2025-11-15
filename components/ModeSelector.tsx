import React from 'react';
import type { Mode } from '../types';
import ChatIcon from './icons/ChatIcon';
import AnalyzeIcon from './icons/AnalyzeIcon';
import VideoIcon from './icons/VideoIcon';
import AudioIcon from './icons/AudioIcon';
import TranscribeIcon from './icons/TranscribeIcon';
import AspectRatioIcon from './icons/AspectRatioIcon';

interface ModeSelectorProps {
  currentMode: Mode;
  onSelectMode: (mode: Mode) => void;
}

const ModeSelector: React.FC<ModeSelectorProps> = ({ currentMode, onSelectMode }) => {
  const modes: { id: Mode; label: string; icon: React.ReactNode }[] = [
    { id: 'chat', label: 'Chat', icon: <ChatIcon /> },
    { id: 'analyze', label: 'Analyze', icon: <AnalyzeIcon /> },
    { id: 'image', label: 'Image Gen', icon: <AspectRatioIcon /> },
    { id: 'video', label: 'Video Gen', icon: <VideoIcon /> },
    { id: 'audio', label: 'Audio Gen', icon: <AudioIcon /> },
    { id: 'transcribe', label: 'Transcribe', icon: <TranscribeIcon /> },
  ];

  return (
    <div className="flex justify-center p-4 bg-gray-900/80 backdrop-blur-sm border-b border-gray-700 flex-shrink-0">
      <div className="flex items-center gap-1 md:gap-2 p-1 bg-gray-800 rounded-lg flex-wrap justify-center">
        {modes.map((mode) => (
          <button
            key={mode.id}
            onClick={() => onSelectMode(mode.id)}
            className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-800 ${
              currentMode === mode.id
                ? 'bg-cyan-600 text-white shadow'
                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
            }`}
            aria-current={currentMode === mode.id}
          >
            {mode.icon}
            <span>{mode.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default ModeSelector;