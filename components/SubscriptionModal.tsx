import React from 'react';
import { Icons } from './Icons';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onWatchAd: () => void;
}

const SubscriptionModal: React.FC<SubscriptionModalProps> = ({ isOpen, onClose, onWatchAd }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-sm p-6 relative shadow-2xl">
        <button 
          onClick={onClose} 
          className="absolute top-3 right-3 text-slate-400 hover:text-white"
        >
          <Icons.Close size={24} />
        </button>

        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-400">
            <Icons.Homework size={32} />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Daily Limit Reached</h2>
          <p className="text-slate-400 text-sm">
            You have used your 5 free questions for today. Upgrade to AskShastry Pro for unlimited learning!
          </p>
        </div>

        <div className="space-y-3">
          <button className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-blue-500/25 transition-all transform hover:scale-[1.02]">
            Upgrade to Pro (₹99/mo)
          </button>
          
          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-slate-700"></div>
            <span className="flex-shrink mx-4 text-slate-500 text-xs">OR</span>
            <div className="flex-grow border-t border-slate-700"></div>
          </div>

          <button 
            onClick={onWatchAd}
            className="w-full py-3 bg-slate-800 border border-slate-700 text-slate-200 font-medium rounded-xl hover:bg-slate-700 transition-colors flex items-center justify-center gap-2"
          >
            <span>Watch Ad for +1 Credit</span>
            <span className="px-1.5 py-0.5 bg-green-500/20 text-green-400 text-[10px] rounded uppercase font-bold">Free</span>
          </button>
        </div>
        
        <p className="text-center text-[10px] text-slate-600 mt-4">
          AskShastry helps thousands of students daily. Support us!
        </p>
      </div>
    </div>
  );
};

export default SubscriptionModal;