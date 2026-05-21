import React, { useState, useEffect, useRef } from 'react';
import { 
  Check, 
  Plus, 
  Trash2, 
  Mic, 
  MicOff, 
  Compass, 
  Calendar, 
  History, 
  Sparkles, 
  Undo2, 
  Clock, 
  ShoppingCart, 
  ChevronRight, 
  AlertCircle,
  HelpCircle,
  TrendingUp,
  Settings,
  List,
  ArrowUpDown,
  Play,
  X
} from 'lucide-react';

// Pre-configured typical items for the simulation
const INITIAL_ITEMS = [
  { id: '1', name: 'Organic Milk 2%', checked: false, category: 'Dairy & Eggs', aisle: 'Aisle 1', frequencyCount: 14, intervalDays: 7, lastAdded: Date.now() - (6 * 24 * 60 * 60 * 1000), autoAdded: false },
  { id: '2', name: 'Whole Wheat Bread', checked: false, category: 'Bakery', aisle: 'Aisle 2', frequencyCount: 12, intervalDays: 5, lastAdded: Date.now() - (4 * 24 * 60 * 60 * 1000), autoAdded: false },
  { id: '3', name: 'Fresh Bananas', checked: false, category: 'Produce', aisle: 'Aisle A (Entrance)', frequencyCount: 18, intervalDays: 4, lastAdded: Date.now() - (3 * 24 * 60 * 60 * 1000), autoAdded: false },
  { id: '4', name: 'Greek Yogurt (Vanilla)', checked: true, category: 'Dairy & Eggs', aisle: 'Aisle 1', frequencyCount: 8, intervalDays: 10, lastAdded: Date.now() - (2 * 24 * 60 * 60 * 1000), autoAdded: false },
  { id: '5', name: 'Avocados', checked: false, category: 'Produce', aisle: 'Aisle A (Entrance)', frequencyCount: 9, intervalDays: 0, lastAdded: Date.now(), autoAdded: false },
  { id: '6', name: 'Paper Towels', checked: true, category: 'Household', aisle: 'Aisle 12', frequencyCount: 5, intervalDays: 30, lastAdded: Date.now() - (15 * 24 * 60 * 60 * 1000), autoAdded: false }
];

const ITEM_SUGGESTIONS = [
  { name: 'Eggs (Large Grade A)', category: 'Dairy & Eggs', aisle: 'Aisle 1', frequencyCount: 22 },
  { name: 'Spinach (Baby Leaves)', category: 'Produce', aisle: 'Aisle A (Entrance)', frequencyCount: 15 },
  { name: 'Chicken Breasts', category: 'Meat & Seafood', aisle: 'Aisle 3', frequencyCount: 11 },
  { name: 'Apples (Honeycrisp)', category: 'Produce', aisle: 'Aisle A (Entrance)', frequencyCount: 10 },
  { name: 'Toilet Paper 12-Pack', category: 'Household', aisle: 'Aisle 12', frequencyCount: 4 },
  { name: 'Pasta Sauce (Marinara)', category: 'Pantry', aisle: 'Aisle 6', frequencyCount: 7 }
];

// Helper to map dynamic terms to standard grocery categories
const CATEGORY_MAP = {
  milk: { category: 'Dairy & Eggs', aisle: 'Aisle 1' },
  cheese: { category: 'Dairy & Eggs', aisle: 'Aisle 1' },
  egg: { category: 'Dairy & Eggs', aisle: 'Aisle 1' },
  yogurt: { category: 'Dairy & Eggs', aisle: 'Aisle 1' },
  butter: { category: 'Dairy & Eggs', aisle: 'Aisle 1' },
  bread: { category: 'Bakery', aisle: 'Aisle 2' },
  croissant: { category: 'Bakery', aisle: 'Aisle 2' },
  bagel: { category: 'Bakery', aisle: 'Aisle 2' },
  apple: { category: 'Produce', aisle: 'Aisle A (Entrance)' },
  banana: { category: 'Produce', aisle: 'Aisle A (Entrance)' },
  berry: { category: 'Produce', aisle: 'Aisle A (Entrance)' },
  spinach: { category: 'Produce', aisle: 'Aisle A (Entrance)' },
  tomato: { category: 'Produce', aisle: 'Aisle A (Entrance)' },
  avocado: { category: 'Produce', aisle: 'Aisle A (Entrance)' },
  steak: { category: 'Meat & Seafood', aisle: 'Aisle 3' },
  chicken: { category: 'Meat & Seafood', aisle: 'Aisle 3' },
  salmon: { category: 'Meat & Seafood', aisle: 'Aisle 3' },
  shrimp: { category: 'Meat & Seafood', aisle: 'Aisle 3' },
  paper: { category: 'Household', aisle: 'Aisle 12' },
  napkin: { category: 'Household', aisle: 'Aisle 12' },
  soap: { category: 'Household', aisle: 'Aisle 11' },
  shampoo: { category: 'Household', aisle: 'Aisle 11' },
  pasta: { category: 'Pantry', aisle: 'Aisle 6' },
  sauce: { category: 'Pantry', aisle: 'Aisle 6' },
  rice: { category: 'Pantry', aisle: 'Aisle 6' },
  cereal: { category: 'Pantry', aisle: 'Aisle 5' },
  coffee: { category: 'Pantry', aisle: 'Aisle 5' }
};

export default function App() {
  const [items, setItems] = useState(INITIAL_ITEMS);
  const [newItemName, setNewItemName] = useState('');
  const [newItemRecurrence, setNewItemRecurrence] = useState(0); // 0 = no recurrence
  const [activeTab, setActiveTab] = useState('list'); // 'list' | 'analytics' | 'voice' | 'settings'
  const [sortMethod, setSortMethod] = useState('none'); // 'none' | 'aisle' | 'alphabetical'
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [voiceResultText, setVoiceResultText] = useState('');
  const [voiceStatus, setVoiceStatus] = useState('Click mic to speak to Gemini...');
  const [timeShiftDays, setTimeShiftDays] = useState(0); // Simulated time engine days elapsed
  const [notifications, setNotifications] = useState([]);
  const [isSortingAI, setIsSortingAI] = useState(false);
  const [geminiStatus, setGeminiStatus] = useState('');
  
  const [editingItem, setEditingItem] = useState(null);
  const [showWelcome, setShowWelcome] = useState(() => {
    const saved = localStorage.getItem('smartlist_show_welcome');
    return saved !== null ? JSON.parse(saved) : true;
  });

  const handleDismissWelcome = () => {
    setShowWelcome(false);
    localStorage.setItem('smartlist_show_welcome', 'false');
  };

  // Voice recognition setup
  const recognitionRef = useRef(null);

  useEffect(() => {
    // Initialize Web Speech API if supported
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'en-US';

      rec.onstart = () => {
        setIsVoiceActive(true);
        setVoiceStatus('Listening for "Add [Item] every [N] days"...');
      };

      rec.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setVoiceResultText(transcript);
        processVoiceCommand(transcript);
      };

      rec.onerror = (event) => {
        console.error("Speech Recognition Error:", event);
        const errType = event.error || "security-block";
        let friendlyMsg = `Voice input unavailable (Code: ${errType}).`;
        
        if (errType === 'not-allowed') {
          friendlyMsg = "Microphone permission denied. Open http://localhost:5174/ in a browser tab to allow access.";
        } else if (errType === 'no-speech') {
          friendlyMsg = "No speech was detected. Click the microphone to try again.";
        } else if (errType === 'audio-capture') {
          friendlyMsg = "Microphone hardware capture failed. Check your connection or busy state.";
        } else if (errType === 'network') {
          friendlyMsg = "Speech recognition network communication failed. Note: Web Speech API (Chrome/Safari) requires connection to speech recognition cloud servers. Please check your connection, run the app directly at http://localhost:5174/, or use the interactive Text Simulator below!";
        } else {
          friendlyMsg = `Microphone access error (${errType}). If in a sandboxed preview, please open http://localhost:5174/ directly.`;
        }
        
        setVoiceStatus(friendlyMsg);
        setIsVoiceActive(false);
      };

      rec.onend = () => {
        setIsVoiceActive(false);
      };

      recognitionRef.current = rec;
    } else {
      setVoiceStatus('Web Speech API not natively supported on this browser context. Try opening http://localhost:5174/ in a standard browser tab.');
    }
  }, []);

  // Highly smart NLP Command Parser simulating Google Assistant / Gemini logic
  const processVoiceCommand = (text) => {
    setVoiceStatus('Gemini processing text: "' + text + '"...');
    
    // Normalize string
    const lower = text.toLowerCase().trim();
    
    // Look for phrases like: "add milk and cookies every 7 days" or "put milk on list" or "remind me to buy eggs weekly"
    let itemName = '';
    let intervalDays = 0;

    // Pattern 1: "...every (X) days"
    const everyDaysMatch = lower.match(/(?:add|put|buy)\s+(.*?)\s+every\s+(\d+)\s+days?/i);
    // Pattern 2: "...weekly"
    const weeklyMatch = lower.match(/(?:add|put|buy)\s+(.*?)\s+(?:weekly|every week)/i);
    // Pattern 3: "...daily"
    const dailyMatch = lower.match(/(?:add|put|buy)\s+(.*?)\s+(?:daily|every day)/i);
    // Pattern 4: Simple "add [item]"
    const simpleMatch = lower.match(/(?:add|put|buy)\s+(.*)/i);

    if (everyDaysMatch) {
      itemName = everyDaysMatch[1];
      intervalDays = parseInt(everyDaysMatch[2], 10);
    } else if (weeklyMatch) {
      itemName = weeklyMatch[1];
      intervalDays = 7;
    } else if (dailyMatch) {
      itemName = dailyMatch[1];
      intervalDays = 1;
    } else if (simpleMatch) {
      itemName = simpleMatch[1];
      intervalDays = 0;
    } else {
      // Just fallback to the entire phrase if no action word
      itemName = lower;
      intervalDays = 0;
    }

    // Clean up connecting prepositions
    itemName = itemName.replace(/^(to my list|on my list|to the list|on the list|to buy|some)\s+/, '');
    itemName = itemName.replace(/\s+(on my list|to my list|on the list|to the list)$/, '');

    if (itemName) {
      // Capitalize first letter
      const formattedName = itemName.charAt(0).toUpperCase() + itemName.slice(1);
      addItemDirectly(formattedName, intervalDays, true);
      setVoiceStatus(`Successfully parsed: "${formattedName}" ${intervalDays > 0 ? `every ${intervalDays} days` : '(One-time)'}!`);
      
      // Add notification banner
      addNotification(`Added via Gemini Voice: ${formattedName} ${intervalDays > 0 ? `(Recurrence: ${intervalDays}d)` : ''}`);
    } else {
      setVoiceStatus("Couldn't recognize dynamic command. Try: 'Add chocolate milk every 4 days'");
    }
  };

  // Simulates passage of time to trigger automatic recurrence updates
  const handleTimeTravel = (days) => {
    const newShift = timeShiftDays + days;
    setTimeShiftDays(newShift);

    // Calculate which items should automatically jump back on the active list
    setItems(prevItems => {
      let updatedCount = 0;
      const nextItems = prevItems.map(item => {
        // Only trigger recurrence for checked items or items already inactive that have recurrence configurations
        if (item.intervalDays > 0) {
          // Calculate when it should trigger based on lastAdded + shift
          const msSinceLast = Date.now() + (newShift * 24 * 60 * 60 * 1000) - item.lastAdded;
          const daysSinceLast = msSinceLast / (24 * 60 * 60 * 1000);

          if (daysSinceLast >= item.intervalDays && item.checked) {
            updatedCount++;
            return {
              ...item,
              checked: false, // Automatically put back in action
              lastAdded: Date.now() + (newShift * 24 * 60 * 60 * 1000), // Reset clock
              autoAdded: true, // Tag it visually
              frequencyCount: item.frequencyCount + 1
            };
          }
        }
        return item;
      });

      if (updatedCount > 0) {
        addNotification(`Temporal Engine: ${updatedCount} recurring item(s) automatically re-added to your grocery list!`);
      }
      return nextItems;
    });
  };

  const addNotification = (msg) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
    setNotifications(prev => [...prev, { id, msg, exiting: false }]);
    setTimeout(() => {
      dismissNotification(id);
    }, 6000);
  };

  const dismissNotification = (id) => {
    setNotifications(prev => {
      const exists = prev.find(n => n.id === id);
      if (!exists || exists.exiting) return prev;
      return prev.map(n => n.id === id ? { ...n, exiting: true } : n);
    });
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 300);
  };

  const toggleVoice = () => {
    if (isVoiceActive) {
      try {
        recognitionRef.current?.stop();
      } catch (e) {
        setIsVoiceActive(false);
      }
    } else {
      setVoiceResultText('');
      setVoiceStatus('Warming up Microphone...');
      if (!recognitionRef.current) {
        setVoiceStatus('Web Speech API could not initialize. Try the interactive Text Simulator below!');
        return;
      }
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.error("Failed to start voice recognition capture loop:", e);
        setVoiceStatus('Microphone start failed. Make sure permissions are granted and open http://localhost:5174/ directly.');
        setIsVoiceActive(false);
      }
    }
  };

  const handleManualVoiceSimulate = (text) => {
    if (!text || !text.trim()) return;
    setVoiceResultText(text);
    processVoiceCommand(text);
  };

  const addItemDirectly = (name, days, isVoice = false) => {
    // Determine category and aisle based on simple name-matching database lookup
    let category = 'Other';
    let aisle = 'Aisle 10';

    const lowerName = name.toLowerCase();
    for (const key in CATEGORY_MAP) {
      if (lowerName.includes(key)) {
        category = CATEGORY_MAP[key].category;
        aisle = CATEGORY_MAP[key].aisle;
        break;
      }
    }

    const newItem = {
      id: Date.now().toString(),
      name,
      checked: false,
      category,
      aisle,
      frequencyCount: isVoice ? 2 : 1,
      intervalDays: days,
      lastAdded: Date.now() + (timeShiftDays * 24 * 60 * 60 * 1000),
      autoAdded: isVoice
    };

    setItems(prev => [newItem, ...prev]);
  };

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!newItemName.trim()) return;
    addItemDirectly(newItemName.trim(), newItemRecurrence);
    addNotification(`Added: ${newItemName.trim()}`);
    setNewItemName('');
    setNewItemRecurrence(0);
  };

  const toggleItem = (id) => {
    setItems(prev => prev.map(item => {
      if (item.id === id) {
        const isChecking = !item.checked;
        return {
          ...item,
          checked: isChecking,
          frequencyCount: isChecking ? item.frequencyCount + 1 : item.frequencyCount,
          lastAdded: isChecking ? Date.now() + (timeShiftDays * 24 * 60 * 60 * 1000) : item.lastAdded,
          autoAdded: isChecking ? false : item.autoAdded
        };
      }
      return item;
    }));
  };

  const deleteItem = (id) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const saveEditedItem = (e) => {
    e.preventDefault();
    if (!editingItem.name.trim()) return;
    
    setItems(prev => prev.map(item => {
      if (item.id === editingItem.id) {
        return {
          ...editingItem,
          name: editingItem.name.trim(),
          // If editing updated lastAdded dynamically or reset time, handle here if needed
        };
      }
      return item;
    }));
    
    addNotification(`Saved: ${editingItem.name}`);
    setEditingItem(null);
  };

  // Simulates Gemini Cognitive Aisle Sorting Process
  const triggerAIAisleSort = () => {
    setIsSortingAI(true);
    setGeminiStatus('Gemini is mapping physical layouts to item categories...');

    setTimeout(() => {
      setGeminiStatus('Rearranging items dynamically for optimal walking path...');
      setTimeout(() => {
        setSortMethod('aisle');
        setIsSortingAI(false);
        setGeminiStatus('');
        addNotification('Gemini optimized your grocery list by aisle layout!');
      }, 1000);
    }, 1200);
  };

  // Sort logic mapping
  const getSortedItems = () => {
    let activeItems = items.filter(i => !i.checked);
    let checkedItems = items.filter(i => i.checked);

    const sortFn = (a, b) => {
      if (sortMethod === 'alphabetical') {
        return a.name.localeCompare(b.name);
      } else if (sortMethod === 'aisle') {
        // Physical layout ordering simulation: Entrance -> Aisle 1 -> Aisle 2 -> ... -> Housewares
        const aisleOrder = {
          'Produce': 1,
          'Aisle A (Entrance)': 1,
          'Bakery': 2,
          'Aisle 2': 2,
          'Dairy & Eggs': 3,
          'Aisle 1': 3,
          'Meat & Seafood': 4,
          'Aisle 3': 4,
          'Pantry': 5,
          'Aisle 5': 5,
          'Aisle 6': 6,
          'Household': 7,
          'Aisle 11': 7,
          'Aisle 12': 8,
          'Other': 9
        };
        const orderA = aisleOrder[a.category] || aisleOrder[a.aisle] || 100;
        const orderB = aisleOrder[b.category] || aisleOrder[b.aisle] || 100;
        return orderA - orderB;
      }
      return 0; // Default: Insertion order (reverse ID)
    };

    return {
      active: sortMethod === 'none' ? activeItems : [...activeItems].sort(sortFn),
      checked: checkedItems
    };
  };

  const sortedLists = getSortedItems();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      
      {/* Simulation Banner Header */}
      <header className="bg-amber-500 text-white px-4 py-2 flex flex-wrap justify-between items-center text-xs font-semibold shadow-sm gap-2">
        <div className="flex items-center gap-2">
          <span className="bg-white text-amber-600 px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider shadow-sm">Developer Sandbox</span>
          <span>Simulated Time Shift: <strong className="underline text-sm font-extrabold">{timeShiftDays} Days Passed</strong></span>
        </div>
        <div className="flex items-center gap-1.5">
          <button 
            onClick={() => handleTimeTravel(3)} 
            className="bg-amber-600 hover:bg-amber-700 active:translate-y-0.5 text-white px-2.5 py-1 rounded transition flex items-center gap-1 shadow-sm"
          >
            <Play className="w-3 h-3 fill-white" /> +3 Days
          </button>
          <button 
            onClick={() => handleTimeTravel(7)} 
            className="bg-amber-700 hover:bg-amber-800 active:translate-y-0.5 text-white px-2.5 py-1 rounded transition flex items-center gap-1 shadow-sm font-bold"
          >
            <Play className="w-3 h-3 fill-white" /> +7 Days (Test Recurrence!)
          </button>
          <button 
            onClick={() => setTimeShiftDays(0)} 
            className="bg-slate-700 hover:bg-slate-800 text-white px-2 py-1 rounded transition flex items-center gap-1 text-[10px]"
            title="Reset simulation timeline"
          >
            <Undo2 className="w-3 h-3" /> Reset
          </button>
        </div>
      </header>

      {/* Floating Notifications */}
      <div className="fixed top-12 right-4 z-50 flex flex-col gap-2 max-w-sm">
        {notifications.map(n => (
          <div 
            key={n.id} 
            className={`bg-slate-900 text-white px-4 py-3 rounded-lg shadow-xl flex items-center justify-between gap-3 text-xs border border-slate-700 cursor-default ${
              n.exiting ? 'notification-exit' : 'notification-enter'
            }`}
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{n.msg}</span>
            </div>
            <button
              onClick={() => dismissNotification(n.id)}
              className="text-slate-400 hover:text-white hover:bg-slate-800 p-1 rounded-md transition-all cursor-pointer shrink-0"
              aria-label="Dismiss notification"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      {/* Main Navbar */}
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

      {/* Main Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 md:p-6 grid grid-cols-1 gap-6">

        {/* Top Feature highlights context card */}
        {showWelcome && (
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
                We are simulating a production Google Keep experience tailored with Google Gemini AI features. Test our <strong>"Hey Google / Gemini" voice shortcuts</strong> below, trigger the <strong>AI Aisle Sorter</strong>, or simulate the passage of days to trigger the <strong>Predictive Recurrence Engine</strong>!
              </p>
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="bg-amber-400/30 px-3 py-1.5 rounded-lg border border-white/20 font-medium">✅ Real-Time Sync Simulated</span>
                <span className="bg-amber-400/30 px-3 py-1.5 rounded-lg border border-white/20 font-medium">🤖 Simulated Gemini API</span>
                <span className="bg-amber-400/30 px-3 py-1.5 rounded-lg border border-white/20 font-medium">🕒 Temporal Engine Active</span>
              </div>
            </div>
          </div>
        )}

        {/* View Switcher Container */}
        {activeTab === 'list' && (
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
                      onClick={() => setSortMethod('aisle')}
                      className={`px-3 py-1.5 font-semibold flex items-center gap-1 ${sortMethod === 'aisle' ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
                    >
                      Aisle Sorted
                    </button>
                  </div>
                </div>

                {/* Gemini AI Sort Trigger button */}
                <button
                  onClick={triggerAIAisleSort}
                  disabled={isSortingAI}
                  className="bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 disabled:opacity-50 text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-md shadow-indigo-600/10 transition"
                >
                  <Sparkles className={`w-3.5 h-3.5 text-indigo-200 ${isSortingAI ? 'animate-spin' : ''}`} />
                  {isSortingAI ? 'Sorting Layout...' : 'AI Aisle Sort'}
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
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Aisle</label>
                                <input 
                                  type="text"
                                  value={editingItem.aisle}
                                  onChange={(e) => setEditingItem({ ...editingItem, aisle: e.target.value })}
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
                                📍 {item.aisle}
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
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Aisle</label>
                                <input 
                                  type="text"
                                  value={editingItem.aisle}
                                  onChange={(e) => setEditingItem({ ...editingItem, aisle: e.target.value })}
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
        )}

        {/* VOICE & NLP SIMULATOR SANDBOX */}
        {activeTab === 'voice' && (
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
              <button
                onClick={toggleVoice}
                className={`w-20 h-20 rounded-full flex items-center justify-center text-white transition-all transform hover:scale-105 shadow-xl ${
                  isVoiceActive 
                    ? 'bg-red-500 animate-pulse ring-8 ring-red-100' 
                    : 'bg-amber-500 hover:bg-amber-600 ring-8 ring-amber-100'
                }`}
              >
                {isVoiceActive ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
              </button>
              
              <div className="text-center w-full">
                <p className="font-bold text-sm text-slate-800">{isVoiceActive ? 'Listening...' : 'Microphone Ready'}</p>
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
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleManualVoiceSimulate(e.target.value);
                        e.target.value = '';
                      }
                    }}
                    className="flex-1 px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-800 font-medium"
                  />
                  <button
                    onClick={() => {
                      const inputEl = document.getElementById('manualVoiceInput');
                      if (inputEl && inputEl.value) {
                        handleManualVoiceSimulate(inputEl.value);
                        inputEl.value = '';
                      }
                    }}
                    className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl text-xs font-bold transition duration-150 shadow-sm"
                  >
                    Simulate
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Simulate Presets */}
            <div className="space-y-4 max-w-2xl mx-auto">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest text-center">Simulated Preset Shortcuts (Click one to test)</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <button
                  onClick={() => handleManualVoiceSimulate("Add organic milk every 7 days")}
                  className="bg-white hover:bg-slate-50 p-3.5 rounded-xl border border-slate-200 hover:border-amber-400 text-left transition flex items-center gap-3"
                >
                  <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                  <div>
                    <span className="block text-xs font-mono font-bold text-slate-800">"Add organic milk every 7 days"</span>
                    <span className="text-[10px] text-slate-400">Add milk stapled to weekly temporal recurrence</span>
                  </div>
                </button>

                <button
                  onClick={() => handleManualVoiceSimulate("Put baby spinach leaves on my list every 3 days")}
                  className="bg-white hover:bg-slate-50 p-3.5 rounded-xl border border-slate-200 hover:border-amber-400 text-left transition flex items-center gap-3"
                >
                  <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                  <div>
                    <span className="block text-xs font-mono font-bold text-slate-800">"Put baby spinach leaves... every 3 days"</span>
                    <span className="text-[10px] text-slate-400">High frequency healthy grocery automatic setting</span>
                  </div>
                </button>

                <button
                  onClick={() => handleManualVoiceSimulate("Hey Google add whole wheat bread to the list")}
                  className="bg-white hover:bg-slate-50 p-3.5 rounded-xl border border-slate-200 hover:border-amber-400 text-left transition flex items-center gap-3"
                >
                  <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                  <div>
                    <span className="block text-xs font-mono font-bold text-slate-800">"Hey Google add whole wheat bread"</span>
                    <span className="text-[10px] text-slate-400">Simple add command without recurrence</span>
                  </div>
                </button>

                <button
                  onClick={() => handleManualVoiceSimulate("Remind me to buy paper towels weekly")}
                  className="bg-white hover:bg-slate-50 p-3.5 rounded-xl border border-slate-200 hover:border-amber-400 text-left transition flex items-center gap-3"
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
        )}

        {/* ANALYTICS & HISTORY DASHBOARD */}
        {activeTab === 'analytics' && (
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
                      <p className="text-[10px] text-slate-400">Aisle: {item.aisle}</p>
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
        )}

      </main>

      {/* Footer info */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-400">
        <p>&copy; 2026 SmartList AI Ecosystem. Ready for seamless cross-platform deployment.</p>
      </footer>

    </div>
  );
}

