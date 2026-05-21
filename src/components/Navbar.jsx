import { ShoppingCart, List, Mic, History } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab }) {
  return (
    <nav className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-30 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="bg-amber-500 text-white p-2.5 rounded-xl shadow-md shadow-amber-500/20 flex items-center justify-center">
          <ShoppingCart className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-1.5">
            SmartList AI <span className="text-[11px] bg-amber-100 text-amber-700 font-extrabold px-1.5 py-0.5 rounded-md uppercase tracking-wide">Keep Edition</span>
          </h1>
          <p className="text-xs text-slate-500 font-medium">Collaborative Family Groceries &middot; Powered by Gemini</p>
        </div>
      </div>

      {/* Tab Controls */}
      <div className="flex bg-slate-100 p-1 rounded-xl">
        <button 
          onClick={() => setActiveTab('list')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition flex items-center gap-2 ${activeTab === 'list' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
        >
          <List className="w-4 h-4" />
          <span className="hidden sm:inline">Active List</span>
        </button>
        <button 
          onClick={() => setActiveTab('voice')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition flex items-center gap-2 ${activeTab === 'voice' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
        >
          <Mic className="w-4 h-4 text-amber-500" />
          <span className="hidden sm:inline">Voice / Gemini Sandbox</span>
        </button>
        <button 
          onClick={() => setActiveTab('analytics')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition flex items-center gap-2 ${activeTab === 'analytics' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
        >
          <History className="w-4 h-4 text-indigo-500" />
          <span className="hidden sm:inline">History & Frequency</span>
        </button>
      </div>
    </nav>
  );
}
