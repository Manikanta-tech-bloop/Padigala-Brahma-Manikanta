

import { GoogleGenAI, Chat, Modality, LiveServerMessage, Blob } from "@google/genai";
import type { ChatPersonality } from "../types";

// For Chat
const chats = new Map<ChatPersonality, Chat>();

export function clearChatHistory(personality: ChatPersonality): void {
  chats.delete(personality);
}

function getChatInstance(personality: ChatPersonality): Chat {
  if (chats.has(personality)) {
    return chats.get(personality)!;
  }

  if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
  }
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  let model: string;
  let config: any = {
    systemInstruction: 'You are Mani Ai, a helpful and friendly AI assistant. Your responses should be informative and easy to understand.',
  };

  switch (personality) {
    case 'fast':
      // FIX: Per guidelines, the model alias for flash lite is 'gemini-flash-lite-latest'.
      model = 'gemini-flash-lite-latest';
      break;
    case 'creative':
      model = 'gemini-2.5-pro';
      config.thinkingConfig = { thinkingBudget: 32768 };
      break;
    case 'standard':
    default:
      model = 'gemini-2.5-flash';
      break;
  }

  const newChat = ai.chats.create({ model, config });
  chats.set(personality, newChat);
  return newChat;
}

export async function sendMessageToAI(message: string, personality: ChatPersonality): Promise<string> {
  try {
    const chatInstance = getChatInstance(personality);
    const result = await chatInstance.sendMessage({ message });
    return result.text;
  } catch (error) {
    console.error("Error sending message to Gemini:", error);
    // Invalidate the chat instance on error
    chats.delete(personality);
    throw new Error("Failed to communicate with the Mani Ai service.");
  }
}

// For Image/Video Analysis
function fileToGenerativePart(file: File): Promise<{ inlineData: { data: string; mimeType: string; } }> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            if (typeof reader.result !== 'string') {
                return reject(new Error("Failed to read file as base64."));
            }
            const base64Data = reader.result.split(',')[1];
            resolve({
                inlineData: {
                    data: base64Data,
                    mimeType: file.type,
                }
            });
        };
        reader.onerror = (err) => reject(err);
        reader.readAsDataURL(file);
    });
}

export async function analyzeMedia(prompt: string, file: File): Promise<string> {
    if (!process.env.API_KEY) { throw new Error("API_KEY environment variable not set"); }
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const model = file.type.startsWith('video/') ? 'gemini-2.5-pro' : 'gemini-2.5-flash';
    const imagePart = await fileToGenerativePart(file);

    const response = await ai.models.generateContent({
        model: model,
        contents: { parts: [{ text: prompt }, imagePart] },
    });
    
    return response.text;
}


// For Image Generation
export async function generateImage(prompt: string, aspectRatio: '1:1' | '3:4' | '4:3' | '9:16' | '16:9'): Promise<string> {
  if (!process.env.API_KEY) { throw new Error("API_KEY environment variable not set"); }
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateImages({
      model: 'imagen-4.0-generate-001',
      prompt: prompt,
      config: {
        numberOfImages: 1,
        outputMimeType: 'image/jpeg',
        aspectRatio: aspectRatio,
      },
  });
  const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
  return `data:image/jpeg;base64,${base64ImageBytes}`;
}

// For Video Generation
export async function* generateVideo(prompt: string, config: { aspectRatio: '16:9' | '9:16', imageFile?: File | null }) {
    if (!process.env.API_KEY) { throw new Error("API_KEY environment variable not set"); }
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const generationConfig: {
        numberOfVideos: number;
        resolution: string;
        aspectRatio: '16:9' | '9:16';
    } = {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio: config.aspectRatio,
    };

    const payload: {
        model: string;
        prompt?: string;
        image?: { imageBytes: string; mimeType: string; };
        config: typeof generationConfig;
    } = {
        model: 'veo-3.1-fast-generate-preview',
        config: generationConfig,
    };
    
    if (prompt) {
        payload.prompt = prompt;
    }

    if (config.imageFile) {
        const imagePart = await fileToGenerativePart(config.imageFile);
        payload.image = {
            imageBytes: imagePart.inlineData.data,
            mimeType: imagePart.inlineData.mimeType,
        };
    }
    
    let operation = await ai.models.generateVideos(payload);

    while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 10000));
        try {
            operation = await ai.operations.getVideosOperation({ operation: operation });
        } catch (e) {
            console.error("Error polling video operation:", e);
            throw e;
        }
    }
    
    if (operation.error) {
        throw new Error(`Video generation failed: ${operation.error.message}`);
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) {
        throw new Error("Video generation failed to produce a download link.");
    }

    yield { status: 'fetching' };
    const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
    if (!response.ok) {
        throw new Error(`Failed to fetch video: ${response.statusText}`);
    }
    const videoBlob = await response.blob();
    const videoUrl = URL.createObjectURL(videoBlob);
    yield { status: 'completed', url: videoUrl };
}


// For Audio Generation (Existing)
export async function generateAudio(text: string, voiceName: string): Promise<string> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    let apiVoiceName = voiceName;
    if (voiceName === 'Prabhas') {
        apiVoiceName = 'Fenrir';
    } else if (voiceName === 'Human') {
        apiVoiceName = 'Zephyr';
    }
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: apiVoiceName },
            },
        },
      },
    });
    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
        throw new Error("Failed to generate audio data.");
    }
    return base64Audio;
}

// For Transcription
export interface TranscriptionCallbacks {
    onTranscriptionUpdate: (transcript: string, isFinal: boolean) => void;
    onError: (error: Error) => void;
    onClose: () => void;
}

// FIX: 'LiveSession' is not an exported member. Using 'any' as the session type is not exported.
let liveSessionPromise: Promise<any> | null = null;

export function startTranscriptionSession(callbacks: TranscriptionCallbacks): void {
    if (liveSessionPromise) {
        console.warn("Transcription session already in progress.");
        return;
    }
    if (!process.env.API_KEY) {
      callbacks.onError(new Error("API_KEY environment variable not set"));
      return;
    }

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    let currentTranscript = ''; // State for the current utterance.

    liveSessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
            onopen: () => console.log('Transcription session opened.'),
            // FIX: Re-implement onmessage to correctly handle interim and final transcripts
            // based on the presence of `inputTranscription` and `turnComplete` flags.
            onmessage: (message: LiveServerMessage) => {
                if (message.serverContent?.inputTranscription) {
                    currentTranscript = message.serverContent.inputTranscription.text;
                    // Send interim results to the UI.
                    callbacks.onTranscriptionUpdate(currentTranscript, false);
                }
                // 'turnComplete' indicates the final transcript for an utterance.
                if (message.serverContent?.turnComplete) {
                    if (currentTranscript) {
                        // Send the final transcript.
                        callbacks.onTranscriptionUpdate(currentTranscript, true);
                        currentTranscript = ''; // Reset for next utterance.
                    }
                }
            },
            onerror: (e: ErrorEvent) => {
                console.error("Transcription session error:", e);
                callbacks.onError(new Error(e.message || "An unknown error occurred during transcription."));
                liveSessionPromise = null;
            },
            onclose: (e: CloseEvent) => {
                console.log('Transcription session closed.');
                callbacks.onClose();
                liveSessionPromise = null;
            },
        },
        config: {
            inputAudioTranscription: {},
            // FIX: Add the required response modality for the Live API.
            responseModalities: [Modality.AUDIO],
        },
    });
}

export function sendAudioForTranscription(pcmBlob: Blob): void {
    if (!liveSessionPromise) {
        console.error("Cannot send audio, transcription session not started.");
        return;
    }
    liveSessionPromise.then((session) => {
        session.sendRealtimeInput({ media: pcmBlob });
    }).catch(err => {
        console.error("Failed to send audio data:", err);
    });
}

export function stopTranscriptionSession(): void {
    if (!liveSessionPromise) {
        return;
    }
    liveSessionPromise.then((session) => {
        session.close();
    }).catch(err => {
        console.error("Error while closing transcription session:", err);
    }).finally(() => {
        liveSessionPromise = null;
    });
}