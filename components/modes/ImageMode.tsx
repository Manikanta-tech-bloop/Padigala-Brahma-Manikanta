import React, { useState } from 'react';
import { generateImage } from '../../services/geminiService';
import SendIcon from '../icons/SendIcon';
import ImageIcon from '../icons/ImageIcon';

type AspectRatio = '1:1' | '16:9' | '9:16' | '4:3' | '3:4';

const aspectRatios: { value: AspectRatio, label: string }[] = [
    { value: '1:1', label: 'Square' },
    { value: '16:9', label: 'Landscape' },
    { value: '9:16', label: 'Portrait' },
    { value: '4:3', label: 'Standard' },
    { value: '3:4', label: 'Tall' },
];

const ImageMode: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);
    setImageUrl(null);

    try {
      const result = await generateImage(prompt, aspectRatio);
      setImageUrl(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(`Failed to generate image: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-start h-full gap-6 pt-8">
      <div className="w-full max-w-2xl space-y-4">
        <h2 className="text-xl font-semibold text-center text-gray-300">Image Generation</h2>
        <p className="text-center text-gray-400">Describe the image you want to create and choose an aspect ratio.</p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label htmlFor="aspect-ratio" className="block mb-2 text-sm font-medium text-gray-400">Aspect Ratio</label>
                <fieldset id="aspect-ratio" className="flex items-center gap-1 p-1 bg-gray-800 rounded-lg flex-wrap justify-center">
                    <legend className="sr-only">Choose an aspect ratio</legend>
                    {aspectRatios.map(ar => (
                        <div key={ar.value} className="flex-grow">
                            <input
                                type="radio"
                                id={ar.value}
                                name="aspect-ratio"
                                value={ar.value}
                                checked={aspectRatio === ar.value}
                                onChange={() => setAspectRatio(ar.value)}
                                className="sr-only"
                                disabled={isLoading}
                            />
                            <label
                                htmlFor={ar.value}
                                className={`w-full text-center block px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 cursor-pointer ${
                                    aspectRatio === ar.value
                                    ? 'bg-cyan-600 text-white shadow'
                                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                                }`}
                            >
                                {ar.label} ({ar.value})
                            </label>
                        </div>
                    ))}
                </fieldset>
            </div>

            <div className="flex items-start gap-3">
                <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="e.g., A photo of an astronaut riding a horse on Mars"
                    disabled={isLoading}
                    className="flex-grow p-3 bg-gray-700 rounded-lg border border-gray-600 focus:ring-2 focus:ring-cyan-500 focus:outline-none transition duration-200 disabled:opacity-50 resize-none"
                    rows={3}
                />
                <button
                    type="submit"
                    disabled={isLoading || !prompt.trim()}
                    className="bg-cyan-600 text-white p-3 rounded-lg hover:bg-cyan-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition duration-200 flex-shrink-0 self-stretch"
                    aria-label="Generate image"
                >
                    <SendIcon />
                </button>
            </div>
        </form>
      </div>

      <div className="w-full max-w-2xl min-h-[300px] bg-gray-800 rounded-lg flex items-center justify-center border border-gray-700 aspect-video">
        {isLoading && (
          <div className="flex flex-col items-center gap-2 text-gray-400">
            <svg className="animate-spin h-8 w-8 text-cyan-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Generating image...</span>
          </div>
        )}
        {error && <p className="text-red-400 text-center px-4">{error}</p>}
        {imageUrl && !isLoading && (
          <img src={imageUrl} alt="Generated image" className="rounded-lg max-w-full max-h-full object-contain" />
        )}
        {!isLoading && !error && !imageUrl && (
            <div className="text-center text-gray-500">
                <ImageIcon className="w-16 h-16 mx-auto mb-2" />
                <p>Your generated image will appear here.</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default ImageMode;