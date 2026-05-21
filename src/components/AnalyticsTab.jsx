import { TrendingUp, Sparkles } from 'lucide-react';

const ITEM_SUGGESTIONS = [
  { name: 'Eggs (Large Grade A)', category: 'Dairy & Eggs', location: 'Primeur', frequencyCount: 22 },
  { name: 'Spinach (Baby Leaves)', category: 'Produce', location: 'Primeur', frequencyCount: 15 },
  { name: 'Chicken Breasts', category: 'Meat & Seafood', location: 'Boucherie', frequencyCount: 11 },
  { name: 'Apples (Honeycrisp)', category: 'Produce', location: 'Primeur', frequencyCount: 10 },
  { name: 'Toilet Paper 12-Pack', category: 'Household', location: 'Supermarché', frequencyCount: 4 },
  { name: 'Pasta Sauce (Marinara)', category: 'Pantry', location: 'Épicerie', frequencyCount: 7 }
];

export default function AnalyticsTab({
  items,
  addItemDirectly,
  addNotification
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      
      {/* Left Column: Frequent items Bar Chart */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm md:col-span-2 space-y-4">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-amber-500" /> Frequent Items History & Analytics
        </h3>
        <p className="text-xs text-slate-500">
          Organized logs of the items checked off most frequently. This history helps feed our predictive recurrence recommendation algorithms.
        </p>

        {/* Simple Chart simulation */}
        <div className="space-y-3.5 pt-4">
          {[...items, ...ITEM_SUGGESTIONS]
            .sort((a, b) => b.frequencyCount - a.frequencyCount)
            .slice(0, 5)
            .map((item, idx) => {
              // Normalize bar widths
              const maxFreq = 22;
              const percentWidth = Math.min((item.frequencyCount / maxFreq) * 100, 100);

              return (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-800">{item.name}</span>
                    <span className="font-bold text-slate-500">{item.frequencyCount} purchases</span>
                  </div>
                  <div className="h-3 bg-slate-100 rounded-full overflow-hidden flex">
                    <div 
                      style={{ width: `${percentWidth}%` }}
                      className={`h-full rounded-full transition-all duration-500 ${
                        idx === 0 ? 'bg-amber-500' :
                        idx === 1 ? 'bg-amber-400' :
                        idx === 2 ? 'bg-indigo-500' :
                        idx === 3 ? 'bg-indigo-400' : 'bg-slate-400'
                      }`}
                    />
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* Right Column: Predictive Recommendations */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-500" /> AI Suggestions
        </h3>
        <p className="text-xs text-slate-500">
          Based on your historical family grocery intervals, we suggest adding these back to your list:
        </p>

        <div className="space-y-3 pt-2">
          {ITEM_SUGGESTIONS.slice(0, 3).map((item, index) => (
            <div key={index} className="p-3 bg-slate-50 hover:bg-amber-50/10 rounded-xl border border-slate-100 flex items-center justify-between gap-2">
              <div>
                <h4 className="font-bold text-slate-800 text-xs">{item.name}</h4>
                <p className="text-[10px] text-slate-400">Location: {item.location}</p>
              </div>
              <button
                onClick={() => {
                  addItemDirectly(item.name, 0);
                  addNotification(`Added suggested item: ${item.name}`);
                }}
                className="bg-slate-950 text-white hover:bg-slate-800 text-[10px] font-bold px-2.5 py-1 rounded-lg transition"
              >
                Add
              </button>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
