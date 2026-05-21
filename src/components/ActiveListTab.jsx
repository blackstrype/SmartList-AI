import { 
  Plus, 
  Clock, 
  Sparkles, 
  ChevronRight, 
  Compass, 
  Trash2, 
  Check 
} from 'lucide-react';

export default function ActiveListTab({
  newItemName,
  setNewItemName,
  newItemRecurrence,
  setNewItemRecurrence,
  handleAddSubmit,
  setActiveTab,
  sortMethod,
  setSortMethod,
  triggerAILocationSort,
  isSortingAI,
  geminiStatus,
  editingItem,
  setEditingItem,
  saveEditedItem,
  toggleItem,
  deleteItem,
  sortedLists
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* Input & Google Keep-style Fast Controls */}
      <div className="lg:col-span-1 space-y-6">
        
        {/* Quick Add Form card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Plus className="w-4 h-4 text-amber-500" /> Quick Add Item
          </h3>
          
          <form onSubmit={handleAddSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Item Name</label>
              <input 
                type="text"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                placeholder="e.g. Almond Milk, Organic Eggs..."
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white text-sm transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-500" /> Temporal Recurrence
              </label>
              <select
                value={newItemRecurrence}
                onChange={(e) => setNewItemRecurrence(parseInt(e.target.value))}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white text-sm transition"
              >
                <option value={0}>One-time item (No recurrence)</option>
                <option value={3}>Every 3 Days (High Frequency)</option>
                <option value={7}>Every 7 Days (Weekly staple)</option>
                <option value={14}>Every 14 Days (Bi-weekly)</option>
                <option value={30}>Every 30 Days (Monthly staples)</option>
              </select>
              <p className="text-[11px] text-slate-400 mt-1">If specified, this item will automatically reappear on your grocery list after N days elapse.</p>
            </div>

            <button 
              type="submit"
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-xl shadow-lg hover:shadow-slate-900/15 transition flex items-center justify-center gap-2 text-sm"
            >
              <Plus className="w-4 h-4" /> Add to Shopping List
            </button>
          </form>
        </div>

        {/* Gemini Quick Commands Help Card */}
        <div className="bg-indigo-50 rounded-2xl border border-indigo-100 p-5 shadow-sm">
          <h4 className="text-sm font-bold text-indigo-950 flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-indigo-500" /> Gemini Voice Shortcut Info
          </h4>
          <p className="text-xs text-indigo-900 leading-relaxed mb-3">
            Say or write natural expressions. Gemini will parse item names and automatic schedule rules instantly:
          </p>
          <div className="space-y-2">
            <div className="bg-white/80 p-2 rounded-lg border border-indigo-100 text-xs text-slate-700 font-mono">
              "Add cheese slices every 5 days"
            </div>
            <div className="bg-white/80 p-2 rounded-lg border border-indigo-100 text-xs text-slate-700 font-mono">
              "Put whole wheat bread on weekly"
            </div>
          </div>
          <button 
            onClick={() => setActiveTab('voice')}
            className="mt-4 text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 group"
          >
            Go to Gemini Command Center <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition" />
          </button>
        </div>

      </div>

      {/* Shopping List view */}
      <div className="lg:col-span-2 space-y-4">
        
        {/* Toolbar & Sort Controls */}
        <div className="bg-white px-5 py-4 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-slate-800">Sorting Mode:</span>
            <div className="flex rounded-lg overflow-hidden border border-slate-200 text-xs">
              <button 
                onClick={() => setSortMethod('none')}
                className={`px-3 py-1.5 font-semibold ${sortMethod === 'none' ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
              >
                As Added
              </button>
              <button 
                onClick={() => setSortMethod('alphabetical')}
                className={`px-3 py-1.5 font-semibold ${sortMethod === 'alphabetical' ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
              >
                A-Z
              </button>
              <button 
                onClick={() => setSortMethod('location')}
                className={`px-3 py-1.5 font-semibold flex items-center gap-1 ${sortMethod === 'location' ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
              >
                Location Sorted
              </button>
            </div>
          </div>

          {/* Gemini AI Sort Trigger button */}
          <button
            onClick={triggerAILocationSort}
            disabled={isSortingAI}
            className="bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 disabled:opacity-50 text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-md shadow-indigo-600/10 transition"
          >
            <Sparkles className={`w-3.5 h-3.5 text-indigo-200 ${isSortingAI ? 'animate-spin' : ''}`} />
            {isSortingAI ? 'Sorting Layout...' : 'AI Location Sort'}
          </button>
        </div>

        {/* Loader for Gemini AI calculation */}
        {isSortingAI && (
          <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-6 text-center shadow-inner flex flex-col items-center justify-center animate-pulse gap-3">
            <div className="relative">
              <Compass className="w-10 h-10 text-indigo-500 animate-spin" />
              <Sparkles className="w-4 h-4 text-amber-500 absolute -top-1 -right-1" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-indigo-950">AI Layout Mapping Engine Processing</h4>
              <p className="text-xs text-indigo-700 mt-1 font-mono">{geminiStatus}</p>
            </div>
          </div>
        )}

        {/* ACTIVE GROCERY CARDS (Keep-Style) */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">Active Items ({sortedLists.active.length})</h3>
          
          {sortedLists.active.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center text-slate-400 text-sm">
              No active items. All groceries checked! Use voice or manual entry to add more.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {sortedLists.active.map(item => {
                const isEditing = editingItem?.id === item.id;
                
                if (isEditing) {
                  return (
                    <form 
                      key={item.id} 
                      onSubmit={saveEditedItem} 
                      onClick={(e) => e.stopPropagation()}
                      className="bg-white rounded-2xl border-2 border-indigo-500 p-4 shadow-md space-y-3 animate-fade-in text-left col-span-1"
                    >
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Item Name</label>
                        <input 
                          type="text"
                          value={editingItem.name}
                          onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                          className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 font-medium"
                          required
                          autoFocus
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Category</label>
                          <select
                            value={editingItem.category}
                            onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value })}
                            className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none text-slate-700 font-semibold"
                          >
                            <option value="Produce">Produce</option>
                            <option value="Dairy & Eggs">Dairy & Eggs</option>
                            <option value="Bakery">Bakery</option>
                            <option value="Meat & Seafood">Meat & Seafood</option>
                            <option value="Pantry">Pantry</option>
                            <option value="Household">Household</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Location</label>
                          <input 
                            type="text"
                            value={editingItem.location || ''}
                            onChange={(e) => setEditingItem({ ...editingItem, location: e.target.value })}
                            className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none text-slate-700"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-indigo-500" /> Recurrence Period
                        </label>
                        <select
                          value={editingItem.intervalDays}
                          onChange={(e) => setEditingItem({ ...editingItem, intervalDays: parseInt(e.target.value) })}
                          className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none text-slate-700"
                        >
                          <option value={0}>No recurrence</option>
                          <option value={3}>Every 3 Days</option>
                          <option value={7}>Every 7 Days</option>
                          <option value={14}>Every 14 Days</option>
                          <option value={30}>Every 30 Days</option>
                        </select>
                      </div>
                      <div className="flex justify-end gap-1.5 pt-2 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => setEditingItem(null)}
                          className="px-2.5 py-1 text-slate-500 hover:text-slate-800 font-bold text-[11px] transition"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-3 py-1 rounded-lg text-[11px] transition shadow-sm"
                        >
                          Save
                        </button>
                      </div>
                    </form>
                  );
                }

                return (
                  <div 
                    key={item.id} 
                    onClick={() => setEditingItem(item)}
                    className={`bg-white rounded-2xl border cursor-pointer ${item.autoAdded ? 'border-amber-400 bg-amber-50/20' : 'border-slate-200'} p-4 shadow-sm flex items-start gap-3 transition-all hover:scale-[1.01] hover:shadow-md relative group`}
                  >
                    {/* Auto-added pill */}
                    {item.autoAdded && (
                      <span className="absolute top-2 right-2 bg-amber-100 text-amber-800 text-[9px] font-extrabold px-1.5 py-0.5 rounded-md flex items-center gap-1 border border-amber-200">
                        <Clock className="w-2.5 h-2.5" /> Auto-Replenished
                      </span>
                    )}

                    {/* Recurrence Indicator Dot */}
                    {item.intervalDays > 0 && !item.autoAdded && (
                      <span className="absolute top-2 right-2 bg-indigo-50 text-indigo-700 text-[9px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                        <Clock className="w-2.5 h-2.5" /> {item.intervalDays}d
                      </span>
                    )}

                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleItem(item.id);
                      }}
                      className="mt-1 w-6 h-6 rounded-lg border-2 border-slate-300 hover:border-amber-500 hover:bg-amber-50 flex items-center justify-center bg-slate-50 transition shrink-0 group/checkbox"
                      title="Check off item"
                    >
                      <Check className="w-4 h-4 text-amber-500 opacity-0 group-hover/checkbox:opacity-100 transition-opacity" />
                    </button>
                    
                    <div className="flex-1 min-w-0 pr-6">
                      <p className="font-semibold text-slate-900 text-sm break-words">{item.name}</p>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          {item.category}
                        </span>
                        <span className="bg-indigo-50 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5">
                          📍 {item.location}
                        </span>
                      </div>
                    </div>

                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteItem(item.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 hover:text-red-500 text-slate-400 transition p-1 rounded-lg hover:bg-slate-100 shrink-0"
                      title="Delete from list"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* COMPLETED/CHECKED ITEMS SECTION */}
        {sortedLists.checked.length > 0 && (
          <div className="space-y-3 pt-4 border-t border-slate-200">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">Checked Off ({sortedLists.checked.length})</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {sortedLists.checked.map(item => {
                const isEditing = editingItem?.id === item.id;

                if (isEditing) {
                  return (
                    <form 
                      key={item.id} 
                      onSubmit={saveEditedItem} 
                      onClick={(e) => e.stopPropagation()}
                      className="bg-white rounded-2xl border-2 border-indigo-500 p-4 shadow-md space-y-3 animate-fade-in text-left col-span-1"
                    >
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Item Name</label>
                        <input 
                          type="text"
                          value={editingItem.name}
                          onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                          className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 font-medium"
                          required
                          autoFocus
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Category</label>
                          <select
                            value={editingItem.category}
                            onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value })}
                            className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none text-slate-700 font-semibold"
                          >
                            <option value="Produce">Produce</option>
                            <option value="Dairy & Eggs">Dairy & Eggs</option>
                            <option value="Bakery">Bakery</option>
                            <option value="Meat & Seafood">Meat & Seafood</option>
                            <option value="Pantry">Pantry</option>
                            <option value="Household">Household</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Location</label>
                          <input 
                            type="text"
                            value={editingItem.location || ''}
                            onChange={(e) => setEditingItem({ ...editingItem, location: e.target.value })}
                            className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none text-slate-700"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-indigo-500" /> Recurrence Period
                        </label>
                        <select
                          value={editingItem.intervalDays}
                          onChange={(e) => setEditingItem({ ...editingItem, intervalDays: parseInt(e.target.value) })}
                          className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none text-slate-700"
                        >
                          <option value={0}>No recurrence</option>
                          <option value={3}>Every 3 Days</option>
                          <option value={7}>Every 7 Days</option>
                          <option value={14}>Every 14 Days</option>
                          <option value={30}>Every 30 Days</option>
                        </select>
                      </div>
                      <div className="flex justify-end gap-1.5 pt-2 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => setEditingItem(null)}
                          className="px-2.5 py-1 text-slate-500 hover:text-slate-800 font-bold text-[11px] transition"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-3 py-1 rounded-lg text-[11px] transition shadow-sm"
                        >
                          Save
                        </button>
                      </div>
                    </form>
                  );
                }

                return (
                  <div 
                    key={item.id} 
                    onClick={() => setEditingItem(item)}
                    className="bg-slate-50 rounded-2xl border border-slate-200 p-4 shadow-sm flex items-start gap-3 opacity-60 relative group cursor-pointer"
                  >
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleItem(item.id);
                      }}
                      className="mt-1 w-5.5 h-5.5 rounded-lg bg-green-500 border-2 border-green-500 flex items-center justify-center transition shrink-0 text-white"
                    >
                      <Check className="w-4 h-4 stroke-[3]" />
                    </button>
                    
                    <div className="flex-1 min-w-0 pr-6">
                      <p className="font-medium text-slate-500 line-through text-sm break-words">{item.name}</p>
                      <span className="inline-block bg-slate-200 text-slate-500 text-[9px] font-bold px-2 py-0.5 rounded-full mt-1">
                        {item.category}
                      </span>
                    </div>

                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteItem(item.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 hover:text-red-500 text-slate-400 transition p-1 rounded-lg hover:bg-slate-100 shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
