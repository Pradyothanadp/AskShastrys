import React, { useState, useRef, useEffect, useCallback } from 'react';
import { AppMode, Message, Language } from './types';
import { Icons } from './components/Icons';
import ModeSelector from './components/ModeSelector';
import ChatMessage from './components/ChatMessage';
import AdBanner from './components/AdBanner';
import SubscriptionModal from './components/SubscriptionModal';
import { generateResponse, decodeAudio } from './services/geminiService';

// Speech Recognition setup for browser
const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

// Daily Credit Configuration
const DAILY_FREE_CREDITS = 5;

function App() {
  // Separate history for each mode
  const [histories, setHistories] = useState<Record<AppMode, Message[]>>({
    [AppMode.HOMEWORK]: [{
      id: 'welcome-hw',
      role: 'model',
      text: "Hello student! I'm AskShastry. \n\n**Scan a question** from your book 📸 or type it below to get a step-by-step solution.",
      timestamp: Date.now()
    }],
    [AppMode.JARVIS]: [{
      id: 'welcome-jarvis',
      role: 'model',
      text: "J.A.R.V.I.S. online. Voice systems active. How may I assist you?",
      timestamp: Date.now()
    }],
    [AppMode.TRANSLATE]: [{
      id: 'welcome-trans',
      role: 'model',
      text: "Select a target language above and enter text to translate.",
      timestamp: Date.now()
    }],
    [AppMode.SUMMARIZE]: [{
      id: 'welcome-sum',
      role: 'model',
      text: "Please upload a document image or paste text to summarize.",
      timestamp: Date.now()
    }]
  });

  const [inputText, setInputText] = useState('');
  const [currentMode, setCurrentMode] = useState<AppMode>(AppMode.HOMEWORK);
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [targetLang, setTargetLang] = useState<Language>(Language.ENGLISH);
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  
  // Monetization State
  const [credits, setCredits] = useState<number>(DAILY_FREE_CREDITS);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  
  // Audio Playback Refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  const currentMessages = histories[currentMode];

  // Initialize Credits and Audio
  useEffect(() => {
    // Check local storage for credits
    const today = new Date().toLocaleDateString();
    const lastUseDate = localStorage.getItem('askshastry_last_date');
    const storedCredits = localStorage.getItem('askshastry_credits');

    if (lastUseDate !== today) {
      // Reset credits for a new day
      setCredits(DAILY_FREE_CREDITS);
      localStorage.setItem('askshastry_last_date', today);
      localStorage.setItem('askshastry_credits', DAILY_FREE_CREDITS.toString());
    } else if (storedCredits) {
      setCredits(parseInt(storedCredits, 10));
    }

    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    return () => {
      audioContextRef.current?.close();
    };
  }, []);

  const updateCredits = (newAmount: number) => {
    setCredits(newAmount);
    localStorage.setItem('askshastry_credits', newAmount.toString());
  };

  const handleWatchAd = () => {
    // Simulate watching an ad
    setShowSubscriptionModal(false);
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      updateCredits(credits + 1);
      alert("Thank you! You earned +1 Credit.");
    }, 2000);
  };

  const updateCurrentHistory = (updateFn: (prev: Message[]) => Message[]) => {
    setHistories(prev => ({
      ...prev,
      [currentMode]: updateFn(prev[currentMode])
    }));
  };

  useEffect(() => {
    setInputText('');
    setAttachedImage(null);
    setIsRecording(false);
    stopAudio();
  }, [currentMode]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentMessages, currentMode]);

  const toggleRecording = useCallback(() => {
    if (!SpeechRecognition) {
      alert("Browser does not support Speech Recognition.");
      return;
    }

    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
    } else {
      stopAudio();
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-IN';

      recognition.onstart = () => setIsRecording(true);
      
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputText(prev => prev + (prev ? ' ' : '') + transcript);
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    }
  }, [isRecording]);

  const stopAudio = () => {
    if (audioSourceRef.current) {
      audioSourceRef.current.stop();
      audioSourceRef.current = null;
    }
    setIsPlayingAudio(false);
  };

  const playAudio = async (base64Audio: string) => {
    if (!audioContextRef.current) return;
    stopAudio();
    try {
      const audioBuffer = await decodeAudio(base64Audio, audioContextRef.current);
      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContextRef.current.destination);
      source.onended = () => setIsPlayingAudio(false);
      source.start(0);
      audioSourceRef.current = source;
      setIsPlayingAudio(true);
    } catch (e) {
      console.error("Error playing audio", e);
      setIsPlayingAudio(false);
    }
  };

  const clearChat = () => {
    if (confirm("Clear chat history for this mode?")) {
      setHistories(prev => ({
        ...prev,
        [currentMode]: []
      }));
    }
  };

  const handleSendMessage = async () => {
    if ((!inputText.trim() && !attachedImage) || isLoading) return;

    // Check Credits
    if (credits <= 0) {
      setShowSubscriptionModal(true);
      return;
    }

    // Deduct Credit
    updateCredits(credits - 1);

    stopAudio();
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: inputText,
      timestamp: Date.now()
    };

    updateCurrentHistory(prev => [...prev, userMsg]);
    setInputText('');
    setAttachedImage(null);
    setIsLoading(true);

    const loadingMsgId = (Date.now() + 1).toString();
    updateCurrentHistory(prev => [...prev, {
      id: loadingMsgId,
      role: 'model',
      text: '',
      timestamp: Date.now(),
      isLoading: true
    }]);

    try {
      const activeMode = currentMode;
      const activeLang = targetLang;

      const response = await generateResponse(
        userMsg.text, 
        activeMode, 
        attachedImage || undefined,
        activeMode === AppMode.TRANSLATE || activeMode === AppMode.HOMEWORK ? activeLang : undefined
      );

      setHistories(prev => ({
        ...prev,
        [activeMode]: prev[activeMode].filter(m => m.id !== loadingMsgId).concat({
          id: (Date.now() + 2).toString(),
          role: 'model',
          text: response.text,
          timestamp: Date.now(),
          audioData: response.audioData
        })
      }));

      if (response.audioData && activeMode === AppMode.JARVIS) {
        await playAudio(response.audioData);
      }

    } catch (error) {
       setHistories(prev => ({
        ...prev,
        [currentMode]: prev[currentMode].filter(m => m.id !== loadingMsgId).concat({
          id: (Date.now() + 2).toString(),
          role: 'model',
          text: "Sorry, I encountered an error. Please check your connection or API key.",
          timestamp: Date.now()
        })
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        const base64Clean = result.split(',')[1];
        setAttachedImage(base64Clean);
        if (fileInputRef.current) fileInputRef.current.value = '';
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-slate-900 border-x border-slate-800 shadow-2xl relative overflow-hidden">
      
      <SubscriptionModal 
        isOpen={showSubscriptionModal} 
        onClose={() => setShowSubscriptionModal(false)}
        onWatchAd={handleWatchAd}
      />

      {/* Header */}
      <header className="px-4 py-3 bg-slate-900/90 backdrop-blur-md sticky top-0 z-10 border-b border-slate-800">
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-lg ${currentMode === AppMode.JARVIS ? 'bg-cyan-500/20' : 'bg-blue-600'}`}>
              {currentMode === AppMode.JARVIS ? <Icons.Jarvis className="text-cyan-400" /> : <Icons.Homework className="text-white" />}
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-100 leading-tight">AskShastry</h1>
              <div className="flex items-center gap-2">
                 <p className="text-xs text-slate-400">
                    {currentMode === AppMode.JARVIS ? "Jarvis Mode" : "Student Assistant"}
                 </p>
                 {/* Credit Counter */}
                 <div className={`text-[10px] px-1.5 py-0.5 rounded font-bold flex items-center gap-1 ${credits > 0 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'}`}>
                    <span>⚡ {credits} Free</span>
                 </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {isPlayingAudio && (
               <button onClick={stopAudio} className="p-2 text-red-400 hover:text-red-300 animate-pulse" title="Stop Speaking">
                  <Icons.Stop size={20} />
               </button>
            )}
            <button onClick={clearChat} className="p-2 text-slate-400 hover:text-white" title="Clear Chat">
              <Icons.Trash size={20} />
            </button>
          </div>
        </div>

        <ModeSelector currentMode={currentMode} onSelectMode={setCurrentMode} />
        
        {(currentMode === AppMode.TRANSLATE || currentMode === AppMode.HOMEWORK) && (
          <div className="mt-2 animate-fade-in flex items-center gap-2">
             <span className="text-xs text-slate-400 whitespace-nowrap">Output Language:</span>
             <select 
               value={targetLang}
               onChange={(e) => setTargetLang(e.target.value as Language)}
               className="flex-1 bg-slate-800 text-slate-300 text-sm rounded-lg p-2 border border-slate-700 focus:border-purple-500 outline-none"
             >
               {Object.values(Language).map(lang => (
                 <option key={lang} value={lang}>{lang}</option>
               ))}
             </select>
          </div>
        )}
      </header>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 relative">
        {/* Ad Banner at top of chat */}
        <AdBanner />

        {currentMessages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-slate-500 opacity-50">
            <Icons.Homework size={64} />
            <p className="mt-4 text-sm">Start by asking a question...</p>
          </div>
        )}

        {currentMessages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-slate-900 border-t border-slate-800">
        {attachedImage && (
          <div className="mb-2 flex items-center gap-2 text-xs text-green-400 bg-green-400/10 px-3 py-1 rounded-full w-fit">
            <Icons.Attach size={12} />
            <span>Image Ready to Scan</span>
            <button onClick={() => setAttachedImage(null)}><Icons.Close size={12}/></button>
          </div>
        )}
        
        <div className="flex items-end gap-2">
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="p-3 bg-slate-800 text-slate-400 rounded-full hover:bg-slate-700 hover:text-white transition-colors"
            title={currentMode === AppMode.HOMEWORK ? "Scan Question" : "Attach Image"}
          >
            {currentMode === AppMode.HOMEWORK ? <Icons.Camera size={20} /> : <Icons.Attach size={20} />}
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            className="hidden" 
            accept="image/*"
            capture={currentMode === AppMode.HOMEWORK ? "environment" : undefined}
          />

          <div className="flex-1 bg-slate-800 rounded-2xl flex items-center border border-slate-700 focus-within:border-blue-500 transition-colors">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if(e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder={credits > 0 ? (currentMode === AppMode.JARVIS ? "Speak to Jarvis..." : "Type or scan question...") : "Refill credits to continue..."}
              disabled={credits <= 0}
              className="w-full bg-transparent text-slate-100 px-4 py-3 max-h-32 min-h-[48px] outline-none resize-none placeholder:text-slate-500 text-sm disabled:opacity-50"
              rows={1}
            />
          </div>

          {inputText || attachedImage ? (
             <button 
               onClick={handleSendMessage}
               disabled={isLoading || credits <= 0}
               className={`p-3 rounded-full text-white shadow-lg transform active:scale-95 transition-all
                 ${(isLoading || credits <= 0) ? 'bg-slate-600 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500'}
               `}
             >
               <Icons.Send size={20} />
             </button>
          ) : (
             <button 
               onClick={toggleRecording}
               disabled={credits <= 0}
               className={`p-3 rounded-full text-white shadow-lg transform active:scale-95 transition-all relative
                 ${credits <= 0 ? 'bg-slate-700 opacity-50 cursor-not-allowed' : (isRecording ? 'bg-red-500 animate-pulse' : 'bg-slate-700 hover:bg-slate-600')}
               `}
             >
               <Icons.Mic size={20} />
               {isRecording && (
                 <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-400 rounded-full animate-ping"></span>
               )}
             </button>
          )}
        </div>
        <p className="text-[10px] text-center text-slate-600 mt-2">
           Powered by Gemini 2.5 • Credits: {credits}/5
        </p>
      </div>
    </div>
  );
}

export default App;