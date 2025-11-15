export interface Message {
  role: 'user' | 'model';
  text: string;
}

export type Mode = 'chat' | 'analyze' | 'image' | 'video' | 'audio' | 'transcribe';

export type ChatPersonality = 'standard' | 'fast' | 'creative';