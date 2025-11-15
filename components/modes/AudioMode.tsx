import React, { useState, useRef, useEffect } from 'react';
import { generateAudio } from '../../services/geminiService';
import { playAudio } from '../../utils/audioUtils';
import SendIcon from '../icons/SendIcon';
import AudioIcon from '../icons/AudioIcon';
import MicrophoneIcon from '../icons/MicrophoneIcon';

// FIX: Add comprehensive type definitions for the Web Speech API to fix TS errors.
// TypeScript declaration for the Web Speech API
declare global {
    interface Window {
      SpeechRecognition: typeof SpeechRecognition;
      webkitSpeechRecognition: typeof SpeechRecognition;
    }

    interface SpeechRecognitionResult {
        readonly isFinal: boolean;
        readonly length: number;
        item(index: number): SpeechRecognitionAlternative;
        [index: number]: SpeechRecognitionAlternative;
    }

    interface SpeechRecognitionResultList {
        readonly length: number;
        item(index: number): SpeechRecognitionResult;
        [index: number]: SpeechRecognitionResult;
    }

    interface SpeechRecognitionAlternative {
        readonly transcript: string;
        readonly confidence: number;
    }

    interface SpeechRecognitionEvent extends Event {
        readonly resultIndex: number;
        readonly results: SpeechRecognitionResultList;
    }
    
    interface SpeechRecognitionErrorEvent extends Event {
        readonly error: string;
    }
    
    interface SpeechRecognition extends EventTarget {
        continuous: boolean;
        interimResults: boolean;
        onend: (() => void) | null;
        onresult: ((event: SpeechRecognitionEvent) => void) | null;
        onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
        start(): void;
        stop(): void;
    }

    const SpeechRecognition: {
        prototype: SpeechRecognition;
        new (): SpeechRecognition;
    };
    
    const webkitSpeechRecognition: {
        prototype: SpeechRecognition;
        new (): SpeechRecognition;
    };
}

const voices = ['Human', 'Kore', 'Puck', 'Charon', 'Prabhas'];

const AudioMode: React.FC = () => {
  const [text, setText] = useState('');
  const [voice, setVoice] = useState('Human');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generated, setGenerated] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);

  const audioContextRef = useRef<AudioContext | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    // Initialize AudioContext
    if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }

    // Initialize SpeechRecognition
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognitionAPI) {
        setSpeechSupported(true);
        const recognition = new SpeechRecognitionAPI();
        recognition.continuous = true;
        recognition.interimResults = false;

        recognition.onresult = (event: SpeechRecognitionEvent) => {
            let newTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
                newTranscript += event.results[i][0].transcript;
            }
            if (newTranscript) {
                setText(prevText => {
                    const separator = prevText && !prevText.endsWith(' ') ? ' ' : '';
                    return prevText + separator + newTranscript.trim();
                });
            }
        };

        recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
            console.error('Speech recognition error', event.error);
            setError(`Speech recognition error: ${event.error}`);
            setIsListening(false);
        };
        
        recognition.onend = () => {
            setIsListening(false);
        };

        recognitionRef.current = recognition;
    } else {
        console.warn("Speech Recognition not supported in this browser.");
        setSpeechSupported(false);
    }
  }, []);
  
  const handleToggleListening = () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
      setIsListening(true);
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || isLoading) return;

    const audioContext = audioContextRef.current;
    if (!audioContext) {
        setError("Audio context is not available.");
        return;
    }

    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }

    setIsLoading(true);
    setError(null);
    setGenerated(false);

    try {
      const base64Audio = await generateAudio(text, voice);
      await playAudio(base64Audio, audioContext);
      setGenerated(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(`Failed to generate audio: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-start h-full gap-6 pt-8">
      <div className="w-full max-w-2xl space-y-4">
        <h2 className="text-xl font-semibold text-center text-gray-300">Text-to-Speech</h2>
        <p className="text-center text-gray-400">Enter text or use the microphone to have it read aloud.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="voice-select" className="block mb-2 text-sm font-medium text-gray-400">Select a Voice</label>
            <select
              id="voice-select"
              value={voice}
              onChange={(e) => setVoice(e.target.value)}
              disabled={isLoading}
              className="w-full p-3 bg-gray-700 rounded-lg border border-gray-600 focus:ring-2 focus:ring-cyan-500 focus:outline-none transition duration-200 disabled:opacity-50"
              aria-label="Select voice"
            >
              {voices.map(v => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </div>
          <div className="flex items-start gap-3">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="e.g., Hello world! Or click the mic to speak."
              disabled={isLoading}
              className="flex-grow p-3 bg-gray-700 rounded-lg border border-gray-600 focus:ring-2 focus:ring-cyan-500 focus:outline-none transition duration-200 disabled:opacity-50 resize-none"
              rows={3}
            />
            <div className="flex flex-col gap-2">
                {speechSupported && (
                    <button
                        type="button"
                        onClick={handleToggleListening}
                        disabled={isLoading}
                        className={`p-3 rounded-lg transition duration-200 flex-shrink-0 ${
                            isListening 
                            ? 'bg-red-600 hover:bg-red-500 text-white animate-pulse' 
                            : 'bg-gray-600 hover:bg-gray-500 text-white'
                        } disabled:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed`}
                        aria-label={isListening ? "Stop listening" : "Start listening"}
                    >
                        <MicrophoneIcon />
                    </button>
                )}
                <button
                type="submit"
                disabled={isLoading || !text.trim()}
                className="bg-cyan-600 text-white p-3 rounded-lg hover:bg-cyan-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition duration-200 flex-shrink-0"
                aria-label="Generate audio"
                >
                <SendIcon />
                </button>
            </div>
          </div>
        </form>
      </div>

      <div className="w-full max-w-2xl min-h-[150px] bg-gray-800 rounded-lg flex items-center justify-center border border-gray-700">
        {isLoading && (
          <div className="flex flex-col items-center gap-2 text-gray-400">
            <svg className="animate-spin h-8 w-8 text-cyan-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Generating audio...</span>
          </div>
        )}
        {error && <p className="text-red-400 text-center px-4">{error}</p>}
        {generated && !isLoading && (
            <div className="text-center text-green-400">
                <p>Audio played successfully!</p>
            </div>
        )}
         {!isLoading && !error && !generated && (
            <div className="text-center text-gray-500">
                <AudioIcon className="w-16 h-16 mx-auto mb-2" />
                <p>Your generated audio will play automatically.</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default AudioMode;