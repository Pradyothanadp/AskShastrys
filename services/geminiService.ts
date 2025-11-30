
import { GoogleGenAI, Modality } from "@google/genai";
import { AppMode, Language } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

// Helper to decode audio for playback
export const decodeAudio = async (base64String: string, audioContext: AudioContext): Promise<AudioBuffer> => {
  const binaryString = atob(base64String);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return await audioContext.decodeAudioData(bytes.buffer);
};

// Strict Safety & Guardrails
const SAFETY_INSTRUCTIONS = `
IMPORTANT SAFETY GUARDRAILS:
- You are strictly an educational assistant for students (Grades 1-10).
- DO NOT answer questions related to pornography, sexually explicit content, self-harm, violence, illegal acts, or extreme profanity.
- If a user asks for such content, politely refuse by saying: "I can only help with school-related topics."
- Be polite, encouraging, and safe for minors at all times.
`;

const getSystemInstruction = (mode: AppMode, targetLang?: Language): string => {
  // Base instructions for translation/language if applicable. 
  // Skip if language is English (default) or undefined.
  const langInstruction = (targetLang && targetLang !== Language.ENGLISH)
    ? `Explain concepts in ${targetLang} but keep technical terms in English where appropriate.` 
    : "";

  switch (mode) {
    case AppMode.JARVIS:
      return `${SAFETY_INSTRUCTIONS}
      You are J.A.R.V.I.S., a highly advanced AI assistant. You speak with a formal, slightly dry, and intelligent tone. 
      Address the user as 'Sir' or 'Ma'am'. 
      ${langInstruction}
      Keep responses concise enough for spoken conversation.`;
      
    case AppMode.TRANSLATE:
      return `${SAFETY_INSTRUCTIONS}
      You are an expert translator. Translate the user's input directly into ${targetLang || 'English'}. 
      Provide the translation clearly. If the input is in the target language, translate it to English.`;
      
    case AppMode.SUMMARIZE:
      return `${SAFETY_INSTRUCTIONS}
      You are an expert document analyzer. Summarize the provided text or document content concisely. 
      Highlight key points, dates, and actionable items.`;
      
    case AppMode.HOMEWORK:
    default:
      return `${SAFETY_INSTRUCTIONS}
      You are an expert tutor for Indian school students covering **ICSE, CBSE, and State Boards** (Grades 1-10). 
      ${langInstruction}
      
      Guidelines:
      1. **Math Formatting**: ALWAYS use LaTeX for mathematical symbols and equations. Use single '$' for inline math (e.g., $x^2 + y$) and double '$$' for block equations. Do not use plain text symbols like '*' or '/' for multiplication/division; use $\\times$ and $\\div$.
      2. **Simplicity**: Keep explanations simple, clear, and age-appropriate. Avoid unnecessary jargon.
      3. **Step-by-Step**: If the user asks for a solution, expansion, or derivation, YOU MUST provide a clear, step-by-step explanation with numbered steps. Break down complex problems into manageable parts.
      4. **Context**: Use examples relevant to the Indian context where appropriate.
      5. **Formatting**: Use bold text for key terms and final answers.`;
  }
};

export const generateResponse = async (
  prompt: string,
  mode: AppMode,
  imageData?: string, // base64
  targetLanguage?: Language
): Promise<{ text: string; audioData?: string }> => {
  try {
    const modelName = 'gemini-2.5-flash';
    const systemInstruction = getSystemInstruction(mode, targetLanguage);
    
    // Construct contents
    const parts: any[] = [];
    if (imageData) {
      parts.push({
        inlineData: {
          mimeType: 'image/jpeg', // Assuming jpeg for simplicity
          data: imageData
        }
      });
    }
    parts.push({ text: prompt });

    const response = await ai.models.generateContent({
      model: modelName,
      contents: { parts },
      config: {
        systemInstruction,
      }
    });

    const text = response.text || "I couldn't generate a response.";

    // Generate Audio if in Jarvis Mode
    let audioData: string | undefined;
    if (mode === AppMode.JARVIS) {
      try {
        const ttsResponse = await ai.models.generateContent({
          model: "gemini-2.5-flash-preview-tts",
          contents: { parts: [{ text: text }] },
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: 'Fenrir' },
              },
            },
          },
        });
        
        const candidate = ttsResponse.candidates?.[0];
        const contentPart = candidate?.content?.parts?.[0];
        
        if (contentPart?.inlineData?.data) {
           audioData = contentPart.inlineData.data;
        }
      } catch (ttsError) {
        console.error("TTS Generation failed:", ttsError);
      }
    }

    return { text, audioData };

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};
