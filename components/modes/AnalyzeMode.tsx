import React, { useState, useRef } from 'react';
import { analyzeMedia } from '../../services/geminiService';
import SendIcon from '../icons/SendIcon';
import AnalyzeIcon from '../icons/AnalyzeIcon';
import AddFileIcon from '../icons/AddFileIcon';

const MAX_FILE_SIZE_MB = 20;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

const AnalyzeMode: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [response, setResponse] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.size > MAX_FILE_SIZE_BYTES) {
        setError(`File is too large. Please select a file under ${MAX_FILE_SIZE_MB}MB.`);
        return;
      }
      setFile(selectedFile);
      setMediaPreview(URL.createObjectURL(selectedFile));
      setError(null);
      setResponse(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || !file || isLoading) return;

    setIsLoading(true);
    setError(null);
    setResponse(null);

    try {
      const result = await analyzeMedia(prompt, file);
      setResponse(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(`Failed to analyze media: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  const mediaType = file?.type.startsWith('video/') ? 'video' : 'image';

  return (
    <div className="flex flex-col h-full gap-6">
      <div className="flex-grow grid grid-cols-1 lg:grid-cols-2 gap-6 overflow-hidden">
        {/* Left column for input and prompt */}
        <div className="flex flex-col gap-4 overflow-y-auto pr-2">
            <h2 className="text-xl font-semibold text-center text-gray-300">Analyze Media</h2>
            
            <div 
                className="relative w-full aspect-video bg-gray-800 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-700 hover:border-cyan-500 transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,video/*"
                    onChange={handleFileChange}
                    className="sr-only"
                    disabled={isLoading}
                />
                {mediaPreview ? (
                    mediaType === 'image' ? (
                        <img src={mediaPreview} alt="Preview" className="object-contain max-h-full max-w-full rounded-lg" />
                    ) : (
                        <video src={mediaPreview} controls className="object-contain max-h-full max-w-full rounded-lg" />
                    )
                ) : (
                    <div className="text-center text-gray-500">
                        <AnalyzeIcon className="w-16 h-16 mx-auto mb-2" />
                        <p>Click to upload an image or video</p>
                        <p className="text-sm">(Max {MAX_FILE_SIZE_MB}MB)</p>
                    </div>
                )}
            </div>

            <form onSubmit={handleSubmit} className="flex items-start gap-3">
                <div className="flex-grow relative bg-gray-700 rounded-lg border border-gray-600 focus-within:ring-2 focus-within:ring-cyan-500 transition-all duration-200">
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isLoading}
                        className="absolute left-3 top-3 text-gray-400 hover:text-white disabled:text-gray-500 disabled:cursor-not-allowed transition duration-200 z-10"
                        aria-label="Add file to analyze"
                    >
                        <AddFileIcon />
                    </button>
                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder={file ? `What do you want to know about this ${mediaType}?` : "Upload a file first..."}
                        disabled={isLoading || !file}
                        className="w-full py-3 pr-3 pl-12 bg-transparent focus:outline-none transition duration-200 disabled:opacity-50 resize-none"
                        rows={3}
                    />
                </div>
                <button
                    type="submit"
                    disabled={isLoading || !prompt.trim() || !file}
                    className="bg-cyan-600 text-white p-3 rounded-lg hover:bg-cyan-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition duration-200 flex-shrink-0"
                    aria-label="Analyze media"
                >
                    <SendIcon />
                </button>
            </form>
        </div>

        {/* Right column for output */}
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-300 mb-2">Analysis Result</h3>
            <div className="prose prose-invert prose-sm max-w-none text-gray-300 whitespace-pre-wrap">
                {isLoading && (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400">
                        <svg className="animate-spin h-8 w-8 text-cyan-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Analyzing...</span>
                    </div>
                )}
                {error && <p className="text-red-400">{error}</p>}
                {response && <p>{response}</p>}
                {!isLoading && !error && !response && (
                    <p className="text-gray-500">The AI's analysis will appear here.</p>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyzeMode;