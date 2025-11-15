import React, { useState, useEffect, useRef } from 'react';
import type { Message, ChatPersonality } from '../../types';
import { sendMessageToAI, clearChatHistory } from '../../services/geminiService';
import ChatMessage from '../ChatMessage';
import ChatInput from '../ChatInput';
import ClearIcon from '../icons/ClearIcon';

const personalities: { id: ChatPersonality; label: string; description: string }[] = [
    { id: 'standard', label: 'Standard', description: "Balanced and helpful responses." },
    { id: 'fast', label: 'Fast', description: "Quick, low-latency answers." },
    { id: 'creative', label: 'Creative', description: "For complex queries needing deeper thought." },
];

const initialMessage: Message = { role: 'model', text: "Hello! I'm your friendly Mani Ai assistant. Choose a personality and let's chat!" };

const ChatMode: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([initialMessage]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [personality, setPersonality] = useState<ChatPersonality>('standard');
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (inputText: string) => {
    if (!inputText.trim()) return;

    const userMessage: Message = { role: 'user', text: inputText };
    setMessages(prevMessages => [...prevMessages, userMessage]);
    setIsLoading(true);
    setError(null);

    try {
      const aiResponse = await sendMessageToAI(inputText, personality);
      const modelMessage: Message = { role: 'model', text: aiResponse };
      setMessages(prevMessages => [...prevMessages, modelMessage]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(`Failed to get response from Mani Ai: ${errorMessage}`);
      const errorResponseMessage: Message = { role: 'model', text: "Sorry, I'm having trouble connecting right now. Please try again later." };
      setMessages(prevMessages => [...prevMessages, errorResponseMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    if (messages.length > 1) {
      clearChatHistory(personality);
      setMessages([initialMessage]);
      setError(null);
      setIsLoading(false); // Reset loading state just in case
    }
  };

  return (
    <div className="flex flex-col h-full">
        <div className="pb-4 flex-shrink-0">
            <div className="flex flex-col md:flex-row items-center justify-center gap-2">
                <fieldset className="flex-grow flex flex-col sm:flex-row justify-center items-center gap-2 p-1 bg-gray-800 rounded-lg w-full md:w-auto">
                    <legend className="sr-only">Choose a chat personality</legend>
                    {personalities.map(p => (
                        <div key={p.id} className="w-full sm:w-auto">
                            <input
                                type="radio"
                                id={p.id}
                                name="personality"
                                value={p.id}
                                checked={personality === p.id}
                                onChange={() => setPersonality(p.id)}
                                className="sr-only"
                            />
                            <label
                                htmlFor={p.id}
                                className={`w-full text-center block px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 cursor-pointer ${
                                    personality === p.id
                                    ? 'bg-cyan-600 text-white shadow'
                                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                                }`}
                            >
                                {p.label}
                            </label>
                        </div>
                    ))}
                </fieldset>
                <button
                    onClick={handleClearChat}
                    disabled={messages.length <= 1}
                    className="w-full md:w-auto flex-shrink-0 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 bg-gray-700 text-gray-300 hover:bg-red-600 hover:text-white disabled:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Clear chat history"
                >
                    <ClearIcon className="w-4 h-4" />
                    <span>Clear Chat</span>
                </button>
            </div>
            <p className="text-center text-sm text-gray-400 mt-2">{personalities.find(p => p.id === personality)?.description}</p>
        </div>
        <div ref={chatContainerRef} className="flex-grow overflow-y-auto space-y-6 pr-4 -mr-4">
            {messages.map((msg, index) => (
              <ChatMessage key={index} message={msg} />
            ))}
            {isLoading && (
              <div className="flex justify-start items-center gap-3">
                <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-500 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-white">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" />
                        </svg>
                    </div>
                </div>
                <div className="bg-gray-700 rounded-lg p-3 max-w-xs md:max-w-md lg:max-w-2xl">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></span>
                    <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse [animation-delay:0.2s]"></span>
                    <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse [animation-delay:0.4s]"></span>
                  </div>
                </div>
              </div>
            )}
            {error && <p className="text-red-400 text-center">{error}</p>}
        </div>
        <div className="pt-4 flex-shrink-0">
            <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
        </div>
    </div>
  );
};

export default ChatMode;