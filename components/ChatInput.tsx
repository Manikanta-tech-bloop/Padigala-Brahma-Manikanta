
import React, { useState } from 'react';
import SendIcon from './icons/SendIcon';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, isLoading }) => {
  const [inputText, setInputText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim() && !isLoading) {
      onSendMessage(inputText);
      setInputText('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-3">
      <input
        type="text"
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        placeholder="Type your message here..."
        disabled={isLoading}
        className="flex-grow p-3 bg-gray-700 rounded-lg border border-gray-600 focus:ring-2 focus:ring-cyan-500 focus:outline-none transition duration-200 disabled:opacity-50"
        autoFocus
      />
      <button
        type="submit"
        disabled={isLoading || !inputText.trim()}
        className="bg-cyan-600 text-white p-3 rounded-lg hover:bg-cyan-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition duration-200 flex-shrink-0"
        aria-label="Send message"
      >
        <SendIcon />
      </button>
    </form>
  );
};

export default ChatInput;
