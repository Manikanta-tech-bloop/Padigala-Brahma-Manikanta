import React, { useState } from 'react';
import type { Mode } from './types';
import ModeSelector from './components/ModeSelector';
import ChatMode from './components/modes/ChatMode';
import AnalyzeMode from './components/modes/AnalyzeMode';
import ImageMode from './components/modes/ImageMode';
import VideoMode from './components/modes/VideoMode';
import AudioMode from './components/modes/AudioMode';
import TranscribeMode from './components/modes/TranscribeMode';

const App: React.FC = () => {
  const [mode, setMode] = useState<Mode>('chat');

  const renderMode = () => {
    switch (mode) {
      case 'analyze':
        return <AnalyzeMode />;
      case 'image':
        return <ImageMode />;
      case 'video':
        return <VideoMode />;
      case 'audio':
        return <AudioMode />;
      case 'transcribe':
        return <TranscribeMode />;
      case 'chat':
      default:
        return <ChatMode />;
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white font-sans">
      <header className="bg-gray-800/50 backdrop-blur-sm shadow-md p-4 border-b border-gray-700 flex-shrink-0">
        <h1 className="text-2xl font-bold text-center text-cyan-400 flex items-center justify-center gap-3">
           <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" />
          </svg>
          Mani Ai Creative Suite
        </h1>
      </header>
      
      <ModeSelector currentMode={mode} onSelectMode={setMode} />

      <main className="flex-grow p-4 md:p-6 overflow-hidden">
        {renderMode()}
      </main>
    </div>
  );
};

export default App;