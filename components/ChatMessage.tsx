
import React from 'react';
import type { Message } from '../types';
import BotIcon from './icons/BotIcon';
import UserIcon from './icons/UserIcon';

interface ChatMessageProps {
  message: Message;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === 'user';

  const containerClasses = isUser ? 'flex justify-end items-start gap-3' : 'flex justify-start items-start gap-3';
  const bubbleClasses = isUser
    ? 'bg-blue-600 text-white rounded-lg p-3 max-w-xs md:max-w-md lg:max-w-2xl'
    : 'bg-gray-700 text-gray-200 rounded-lg p-3 max-w-xs md:max-w-md lg:max-w-2xl';

  return (
    <div className={containerClasses}>
      {!isUser && (
        <div className="flex-shrink-0">
          <BotIcon />
        </div>
      )}
      <div className={bubbleClasses}>
        <p className="whitespace-pre-wrap">{message.text}</p>
      </div>
       {isUser && (
        <div className="flex-shrink-0">
          <UserIcon />
        </div>
      )}
    </div>
  );
};

export default ChatMessage;
