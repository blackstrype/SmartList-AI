import { X, ShoppingCart, Sparkles } from 'lucide-react';

export default function WelcomeBanner({ showWelcome, handleDismissWelcome }) {
  if (!showWelcome) return null;

  return (
    <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-white p-5 rounded-2xl shadow-lg relative overflow-hidden">
      <button 
        onClick={handleDismissWelcome}
        className="absolute top-4 right-4 text-white/80 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition-all z-20 cursor-pointer"
        aria-label="Dismiss welcome message"
      >
        <X className="w-4 h-4" />
      </button>
      <div className="absolute right-0 top-0 translate-x-12 -translate-y-8 opacity-10 pointer-events-none">
        <ShoppingCart className="w-64 h-64" />
      </div>
      <div className="relative z-10 max-w-2xl">
        <h2 className="text-lg md:text-xl font-bold mb-1.5 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-200 animate-pulse" /> Welcome to your SmartList AI Prototype!
        </h2>
        <p className="text-sm text-amber-50 opacity-90 leading-relaxed mb-4">
          We are simulating a production Google Keep experience tailored with Google Gemini AI features. Test our <strong>"Hey Google / Gemini" voice shortcuts</strong> below, trigger the <strong>AI Location Sorter</strong>, or simulate the passage of days to trigger the <strong>Predictive Recurrence Engine</strong>!
        </p>
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="bg-amber-400/30 px-3 py-1.5 rounded-lg border border-white/20 font-medium">✅ Real-Time Sync Simulated</span>
          <span className="bg-amber-400/30 px-3 py-1.5 rounded-lg border border-white/20 font-medium">🤖 Simulated Gemini API</span>
          <span className="bg-amber-400/30 px-3 py-1.5 rounded-lg border border-white/20 font-medium">🕒 Temporal Engine Active</span>
        </div>
      </div>
    </div>
  );
}
