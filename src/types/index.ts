export type LanguageCode = 'te-IN' | 'hi-IN' | 'en-IN';

export type AssistantStatus = 'idle' | 'listening' | 'processing' | 'speaking' | 'error';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  language: LanguageCode;
  timestamp: number;
  suggestions?: string[];
  error?: boolean;
}

export interface ChatResponse {
  reply: string;
  detectedLanguage: LanguageCode;
  suggestions: string[];
  error?: string;
}

export interface UserProfile {
  uid: string;
  name: string;
  email?: string;
  phoneNumber?: string;
  photoURL?: string;
  provider: 'email' | 'google' | 'phone' | 'guest';
}

export type DisplayScale = 0.75 | 0.8 | 0.9 | 1 | 1.1 | 1.25 | 1.5;
export type ChatPanelMode = 'compact' | 'comfortable';

export interface UserSettings {
  preferredLanguage: LanguageCode;
  autoDetectLanguage: boolean;
  speechRate: number;
  voicePreference: 'female' | 'default';
  saveHistory: boolean;
  easyMode: boolean;
  continuousMode: boolean;
  memoryConsent: boolean;
  saveAudio: boolean;
  displayScale: DisplayScale;
  chatPanelWidth: number;
  chatPanelHeight: number;
  chatPanelMode: ChatPanelMode;
  chatFullscreen: boolean;
}

export const DISPLAY_SCALES: DisplayScale[] = [0.75, 0.8, 0.9, 1, 1.1, 1.25, 1.5];

export const DEFAULT_SETTINGS: UserSettings = {
  preferredLanguage: 'en-IN',
  autoDetectLanguage: false,
  speechRate: 1,
  voicePreference: 'female',
  saveHistory: true,
  easyMode: false,
  continuousMode: false,
  memoryConsent: false,
  saveAudio: false,
  displayScale: 1,
  chatPanelWidth: 560,
  chatPanelHeight: 720,
  chatPanelMode: 'comfortable',
  chatFullscreen: false,
};
