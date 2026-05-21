import { Sparkles, MicOff, Mic } from 'lucide-react';

export default function VoiceSandboxTab({
  voiceLang,
  setVoiceLang,
  isGeminiParsing,
  isVoiceActive,
  toggleVoice,
  voiceStatus,
  voiceResultText,
  handleManualVoiceSimulate
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-sm space-y-6">
      
      <div className="text-center max-w-xl mx-auto space-y-2">
        <span className="bg-amber-100 text-amber-800 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">Voice Actions Interface</span>
        <h2 className="text-2xl font-black text-slate-900">Hey Google / Gemini Simulator</h2>
        <p className="text-sm text-slate-500">
          Test the voice functionality. Say a natural phrase (such as *"add chicken breasts every 4 days"*), or simulate typing the command below to watch our NLP parsing engine extract rules instantly.
        </p>
      </div>

      {/* Micro and visual panel */}
      <div className="flex flex-col items-center justify-center p-6 bg-slate-50 rounded-2xl border border-slate-200 max-w-md mx-auto space-y-5 shadow-inner">
        {/* Voice Language Selector Toggle */}
        <div className="flex bg-slate-200/60 p-1 rounded-xl gap-1 text-[11px] font-bold">
          <button
            type="button"
            onClick={() => setVoiceLang('en-US')}
            disabled={isGeminiParsing}
            className={`px-3 py-1 rounded-lg transition-all ${
              voiceLang === 'en-US' 
                ? 'bg-white text-slate-800 shadow-sm' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            🇺🇸 EN
          </button>
          <button
            type="button"
            onClick={() => setVoiceLang('fr-FR')}
            disabled={isGeminiParsing}
            className={`px-3 py-1 rounded-lg transition-all ${
              voiceLang === 'fr-FR' 
                ? 'bg-white text-slate-800 shadow-sm' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            🇫🇷 FR
          </button>
        </div>

        <button
          onClick={toggleVoice}
          disabled={isGeminiParsing}
          className={`w-20 h-20 rounded-full flex items-center justify-center text-white transition-all transform hover:scale-105 shadow-xl ${
            isGeminiParsing
              ? 'bg-indigo-600 animate-pulse ring-8 ring-indigo-100 cursor-not-allowed'
              : isVoiceActive 
                ? 'bg-red-500 animate-pulse ring-8 ring-red-100' 
                : 'bg-amber-500 hover:bg-amber-600 ring-8 ring-amber-100'
          }`}
        >
          {isGeminiParsing ? (
            <Sparkles className="w-8 h-8 text-amber-200 animate-spin" />
          ) : isVoiceActive ? (
            <MicOff className="w-8 h-8" />
          ) : (
            <Mic className="w-8 h-8" />
          )}
        </button>
        
        <div className="text-center w-full">
          <p className="font-bold text-sm text-slate-800">
            {isGeminiParsing ? 'Analyzing command...' : isVoiceActive ? 'Listening...' : 'Microphone Ready'}
          </p>
          <p className="text-xs text-slate-500 mt-1.5 px-2 leading-relaxed">{voiceStatus}</p>
        </div>

        {voiceResultText && (
          <div className="bg-white px-4 py-3 rounded-xl border border-slate-200 text-xs font-mono w-full text-center shadow-sm">
            <span className="text-[10px] text-indigo-500 font-extrabold uppercase block mb-1">Raw Command Parsed:</span>
            "{voiceResultText}"
          </div>
        )}

        {/* Interactive Fallback Text Input Console */}
        <div className="w-full pt-4 border-t border-slate-200">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 text-center">
            Or Type Dynamic Voice Phrase Instead:
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. Add paper towels every 5 days..."
              id="manualVoiceInput"
              disabled={isGeminiParsing}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleManualVoiceSimulate(e.target.value);
                  e.target.value = '';
                }
              }}
              className="flex-1 px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-800 font-medium disabled:opacity-50"
            />
            <button
              onClick={() => {
                const inputEl = document.getElementById('manualVoiceInput');
                if (inputEl && inputEl.value) {
                  handleManualVoiceSimulate(inputEl.value);
                  inputEl.value = '';
                }
              }}
              disabled={isGeminiParsing}
              className="bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-xs font-bold transition duration-150 shadow-sm"
            >
              Simulate
            </button>
          </div>
        </div>
      </div>

      {/* Quick Simulate Presets */}
      <div className="space-y-4 max-w-2xl mx-auto">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest text-center font-semibold">Simulated Preset Shortcuts (Click one to test)</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <button
            onClick={() => handleManualVoiceSimulate("Add organic milk every 7 days")}
            disabled={isGeminiParsing}
            className="bg-white hover:bg-slate-50 disabled:opacity-55 p-3.5 rounded-xl border border-slate-200 hover:border-amber-400 text-left transition flex items-center gap-3"
          >
            <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
            <div>
              <span className="block text-xs font-mono font-bold text-slate-800">"Add organic milk every 7 days"</span>
              <span className="text-[10px] text-slate-400">Add milk stapled to weekly temporal recurrence</span>
            </div>
          </button>

          <button
            onClick={() => handleManualVoiceSimulate("Put baby spinach leaves on my list every 3 days")}
            disabled={isGeminiParsing}
            className="bg-white hover:bg-slate-50 disabled:opacity-55 p-3.5 rounded-xl border border-slate-200 hover:border-amber-400 text-left transition flex items-center gap-3"
          >
            <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
            <div>
              <span className="block text-xs font-mono font-bold text-slate-800">"Put baby spinach leaves... every 3 days"</span>
              <span className="text-[10px] text-slate-400">High frequency healthy grocery automatic setting</span>
            </div>
          </button>

          <button
            onClick={() => handleManualVoiceSimulate("Hey Google add whole wheat bread to the list")}
            disabled={isGeminiParsing}
            className="bg-white hover:bg-slate-50 disabled:opacity-55 p-3.5 rounded-xl border border-slate-200 hover:border-amber-400 text-left transition flex items-center gap-3"
          >
            <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
            <div>
              <span className="block text-xs font-mono font-bold text-slate-800">"Hey Google add whole wheat bread"</span>
              <span className="text-[10px] text-slate-400">Simple add command without recurrence</span>
            </div>
          </button>

          <button
            onClick={() => handleManualVoiceSimulate("Remind me to buy paper towels weekly")}
            disabled={isGeminiParsing}
            className="bg-white hover:bg-slate-50 disabled:opacity-55 p-3.5 rounded-xl border border-slate-200 hover:border-amber-400 text-left transition flex items-center gap-3"
          >
            <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
            <div>
              <span className="block text-xs font-mono font-bold text-slate-800">"Remind me to buy paper towels weekly"</span>
              <span className="text-[10px] text-slate-400">Map weekly keywords straight to temporal engine</span>
            </div>
          </button>
        </div>
      </div>

    </div>
  );
}
