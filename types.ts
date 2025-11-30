
export enum AppMode {
  HOMEWORK = 'HOMEWORK',
  JARVIS = 'JARVIS',
  TRANSLATE = 'TRANSLATE',
  SUMMARIZE = 'SUMMARIZE'
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
  isAudio?: boolean;
  audioData?: string; // base64
  isLoading?: boolean;
}

export enum Language {
  ENGLISH = 'English',
  HINDI = 'Hindi',
  TAMIL = 'Tamil',
  TELUGU = 'Telugu',
  MARATHI = 'Marathi',
  BENGALI = 'Bengali',
  KANNADA = 'Kannada',
  GUJARATI = 'Gujarati',
  MALAYALAM = 'Malayalam',
  PUNJABI = 'Punjabi'
}

export interface ChatConfig {
  mode: AppMode;
  targetLanguage?: Language;
}
