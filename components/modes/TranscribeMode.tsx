import React, { useState, useEffect, useRef } from 'react';
import { startTranscriptionSession, stopTranscriptionSession, sendAudioForTranscription } from '../../services/geminiService';
import { createPcmBlob } from '../../utils/audioUtils';
import MicrophoneIcon from '../icons/MicrophoneIcon';
import TranscribeIcon from '../icons/TranscribeIcon';

const TranscribeMode: React.FC = () => {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [finalTranscript, setFinalTranscript] = useState('');
    const [error, setError] = useState<string | null>(null);

    const inputAudioContextRef = useRef<AudioContext | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const streamRef = useRef<MediaStream | null>(null);

    useEffect(() => {
        // Cleanup on unmount
        return () => {
            stopTranscription();
        };
    }, []);

    const startTranscription = async () => {
        setError(null);
        setTranscript('');
        setFinalTranscript('');
        
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;

            const inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            inputAudioContextRef.current = inputAudioContext;
            
            startTranscriptionSession({
                onTranscriptionUpdate: (text, isFinal) => {
                    if (isFinal) {
                        setFinalTranscript(prev => prev + text + ' ');
                        setTranscript('');
                    } else {
                        setTranscript(text);
                    }
                },
                onError: (err) => {
                    setError(err.message);
                    stopTranscription();
                },
                onClose: () => {
                    setIsListening(false);
                },
            });
            
            const source = inputAudioContext.createMediaStreamSource(stream);
            mediaStreamSourceRef.current = source;

            const scriptProcessor = inputAudioContext.createScriptProcessor(4096, 1, 1);
            scriptProcessorRef.current = scriptProcessor;

            scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
                const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                const pcmBlob = createPcmBlob(inputData);
                sendAudioForTranscription(pcmBlob);
            };

            source.connect(scriptProcessor);
            scriptProcessor.connect(inputAudioContext.destination);
            
            setIsListening(true);
        } catch (err) {
            console.error("Error starting transcription:", err);
            setError("Could not start microphone. Please grant permission and try again.");
            setIsListening(false);
        }
    };

    const stopTranscription = () => {
        stopTranscriptionSession();

        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        if (scriptProcessorRef.current) {
            scriptProcessorRef.current.disconnect();
            scriptProcessorRef.current = null;
        }
        if (mediaStreamSourceRef.current) {
            mediaStreamSourceRef.current.disconnect();
            mediaStreamSourceRef.current = null;
        }
        if (inputAudioContextRef.current && inputAudioContextRef.current.state !== 'closed') {
            inputAudioContextRef.current.close();
            inputAudioContextRef.current = null;
        }
        
        setIsListening(false);
    };

    const handleToggleListening = () => {
        if (isListening) {
            stopTranscription();
        } else {
            startTranscription();
        }
    };

    return (
        <div className="flex flex-col items-center justify-start h-full gap-6 pt-8">
            <div className="w-full max-w-3xl space-y-4 text-center">
                <h2 className="text-xl font-semibold text-gray-300">Real-time Transcription</h2>
                <p className="text-gray-400">Click the microphone to start or stop transcribing audio.</p>
                
                <button
                    onClick={handleToggleListening}
                    className={`mx-auto w-24 h-24 rounded-full flex items-center justify-center transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 ${
                        isListening 
                        ? 'bg-red-600 hover:bg-red-500 text-white animate-pulse' 
                        : 'bg-cyan-600 hover:bg-cyan-500 text-white'
                    }`}
                    aria-label={isListening ? "Stop transcribing" : "Start transcribing"}
                >
                    <MicrophoneIcon className="w-12 h-12" />
                </button>
            </div>

            <div className="w-full max-w-3xl h-full min-h-[200px] bg-gray-800 rounded-lg flex flex-col border border-gray-700 p-4">
                <h3 className="text-lg font-semibold text-gray-300 mb-2 flex-shrink-0">Transcript</h3>
                <div className="flex-grow overflow-y-auto">
                    {error ? (
                        <p className="text-red-400 text-center">{error}</p>
                    ) : (finalTranscript || transcript) ? (
                        <p className="text-gray-200 whitespace-pre-wrap">
                            <span>{finalTranscript}</span>
                            <span className="text-gray-400">{transcript}</span>
                        </p>
                    ) : (
                        <div className="text-center text-gray-500 flex flex-col items-center justify-center h-full">
                           <TranscribeIcon className="w-16 h-16 mx-auto mb-2" />
                           <p>Your transcribed text will appear here.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TranscribeMode;
