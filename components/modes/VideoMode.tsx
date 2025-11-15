import React, { useState, useEffect, useRef } from 'react';
import { generateVideo } from '../../services/geminiService';
import SendIcon from '../icons/SendIcon';
import VideoIcon from '../icons/VideoIcon';
import ImageIcon from '../icons/ImageIcon';
import ClearIcon from '../icons/ClearIcon';

const loadingMessages = [
    "Warming up the pixels...",
    "Composing the scene...",
    "Directing the digital actors...",
    "Rendering the final cut...",
    "Adding a touch of magic...",
];

type AspectRatio = '16:9' | '9:16';

const VideoMode: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'generating' | 'fetching' | 'completed' | 'error'>('idle');
  const [error, setError] = useState<{message: string, isQuotaError?: boolean} | null>(null);
  const [apiKeyOk, setApiKeyOk] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState(loadingMessages[0]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    const checkApiKey = async () => {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        setApiKeyOk(hasKey);
    };
    checkApiKey();
  }, []);

  useEffect(() => {
    let interval: number;
    if (status === 'generating') {
        interval = window.setInterval(() => {
            setLoadingMessage(prev => {
                const currentIndex = loadingMessages.indexOf(prev);
                const nextIndex = (currentIndex + 1) % loadingMessages.length;
                return loadingMessages[nextIndex];
            });
        }, 3000);
    }
    return () => clearInterval(interval);
  }, [status]);
  
  const handleSelectKey = async () => {
    await window.aistudio.openSelectKey();
    setApiKeyOk(true);
    setError(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.size > 20 * 1024 * 1024) { // 20MB limit
        setError({ message: "Image file size should be less than 20MB." });
        return;
      }
      setImageFile(selectedFile);
      setImagePreview(URL.createObjectURL(selectedFile));
      setVideoUrl(null);
      setError(null);
    }
  };

  const handleClearImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!prompt.trim() && !imageFile) || (status !== 'idle' && status !== 'completed' && status !== 'error')) return;

    setStatus('generating');
    setError(null);
    setVideoUrl(null);
    setLoadingMessage(loadingMessages[0]);

    try {
      for await (const update of generateVideo(prompt, { aspectRatio, imageFile })) {
        if (update.status === 'fetching') {
            setStatus(update.status);
        }
        if (update.status === 'completed' && update.url) {
          setVideoUrl(update.url);
          setStatus('completed');
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      
      if (errorMessage.includes("RESOURCE_EXHAUSTED") || errorMessage.includes("exceeded your current quota")) {
          setError({
              message: "You've exceeded your video generation quota. Please check your plan and billing details, or try again later.",
              isQuotaError: true
          });
      } else if (errorMessage.includes("Requested entity was not found")) {
          setError({ message: "Your API key may be invalid or missing required permissions. Please select a valid key." });
          setApiKeyOk(false);
      } else {
          setError({ message: `Failed to generate video: ${errorMessage}` });
      }
      setStatus('error');
    }
  };

  if (!apiKeyOk) {
      return (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
              <h2 className="text-xl font-semibold text-gray-300">API Key Required for Video Generation</h2>
              <p className="text-gray-400 max-w-md">Video generation is an advanced feature that requires you to select your own Google AI API key. Please ensure you have billing enabled for your project.</p>
              <button onClick={handleSelectKey} className="bg-cyan-600 text-white px-6 py-2 rounded-lg hover:bg-cyan-500 transition duration-200">
                  Select API Key
              </button>
              <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-sm text-cyan-400 hover:underline">
                  Learn more about billing
              </a>
              {error && <p className="text-red-400 mt-4 max-w-md">{error.message}</p>}
          </div>
      );
  }

  const isLoading = status === 'generating' || status === 'fetching';

  return (
    <div className="flex flex-col items-center justify-start h-full gap-6 pt-2">
      <div className="w-full max-w-2xl space-y-4">
        <h2 className="text-xl font-semibold text-center text-gray-300">Video Generation</h2>
        <p className="text-center text-gray-400">Describe the video, or upload an image to animate it. Generation may take minutes.</p>
        
        <div className="flex flex-col md:flex-row gap-4 items-start">
            <div className="w-full md:w-48 flex-shrink-0 space-y-2">
                <p className="text-sm font-medium text-gray-400 text-center">Starting Image (Optional)</p>
                <div 
                    className="relative w-full aspect-square bg-gray-800 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-700 hover:border-cyan-500 transition-colors cursor-pointer group"
                    onClick={() => !isLoading && fileInputRef.current?.click()}
                >
                    <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="sr-only" disabled={isLoading} />
                    {imagePreview ? (
                        <img src={imagePreview} alt="Preview" className="object-cover w-full h-full rounded-lg" />
                    ) : (
                        <div className="text-center text-gray-500 p-2">
                            <ImageIcon className="w-10 h-10 mx-auto mb-1" />
                            <p className="text-xs">Click to upload</p>
                        </div>
                    )}
                    {imagePreview && !isLoading && (
                        <button onClick={handleClearImage} className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity" aria-label="Clear image">
                           <ClearIcon className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>
            <form onSubmit={handleSubmit} className="flex-grow space-y-3">
                <fieldset className="flex items-center gap-1 p-1 bg-gray-800 rounded-lg justify-center">
                    <legend className="sr-only">Choose an aspect ratio</legend>
                    {(['16:9', '9:16'] as AspectRatio[]).map(ar => (
                        <div key={ar} className="flex-grow">
                            <input type="radio" id={`vid-${ar}`} name="aspect-ratio" value={ar} checked={aspectRatio === ar} onChange={() => setAspectRatio(ar)} className="sr-only" disabled={isLoading} />
                            <label htmlFor={`vid-${ar}`} className={`w-full text-center block px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 cursor-pointer ${aspectRatio === ar ? 'bg-cyan-600 text-white shadow' : 'text-gray-300 hover:bg-gray-700'}`}>
                                {ar === '16:9' ? 'Landscape' : 'Portrait'} ({ar})
                            </label>
                        </div>
                    ))}
                </fieldset>
                <div className="flex items-start gap-3">
                    <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder={imageFile ? "Describe the animation..." : "A majestic lion waking up..."} disabled={isLoading} className="flex-grow p-3 bg-gray-700 rounded-lg border border-gray-600 focus:ring-2 focus:ring-cyan-500 focus:outline-none transition disabled:opacity-50 resize-none" rows={3}/>
                    <button type="submit" disabled={isLoading || (!prompt.trim() && !imageFile)} className="bg-cyan-600 text-white p-3 rounded-lg hover:bg-cyan-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition self-stretch" aria-label="Generate video">
                        <SendIcon />
                    </button>
                </div>
            </form>
        </div>
      </div>

      <div className="w-full max-w-2xl min-h-[300px] bg-gray-800 rounded-lg flex items-center justify-center border border-gray-700 aspect-video">
        {isLoading && (
          <div className="flex flex-col items-center gap-2 text-gray-400 p-4 text-center">
            <svg className="animate-spin h-8 w-8 text-cyan-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>{status === 'generating' ? loadingMessage : 'Fetching your video...'}</span>
          </div>
        )}
        {status === 'error' && error && (
          <div className="text-red-400 text-center px-4">
            <p>{error.message}</p>
            {error.isQuotaError && ( <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-sm text-cyan-400 hover:underline mt-2 inline-block">Learn more about billing</a> )}
          </div>
        )}
        {videoUrl && status === 'completed' && ( <video src={videoUrl} controls className="rounded-lg w-full h-full" /> )}
        {status === 'idle' && !isLoading && (
            <div className="text-center text-gray-500">
                <VideoIcon className="w-16 h-16 mx-auto mb-2" />
                <p>Your generated video will appear here.</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default VideoMode;