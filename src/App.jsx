import React, { useState, useEffect, useRef } from 'react';
import { db, geminiModel } from './firebase';
import { collection, doc, addDoc, updateDoc, deleteDoc, onSnapshot, writeBatch } from 'firebase/firestore';
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

// Helper to snap intervals to standard periods [0, 3, 7, 14, 30]
const snapInterval = (days) => {
  if (days === undefined || days === null || days <= 0) return 0;
  if (days <= 4) return 3;
  if (days <= 10) return 7;
  if (days <= 21) return 14;
  return 30;
};

// Pre-configured typical items for the simulation
const INITIAL_ITEMS = [
  { id: '1', name: 'Organic Milk 2%', checked: false, category: 'Dairy & Eggs', location: 'Supermarché', frequencyCount: 14, intervalDays: 7, lastAdded: Date.now() - (6 * 24 * 60 * 60 * 1000), autoAdded: false },
  { id: '2', name: 'Whole Wheat Bread', checked: false, category: 'Bakery', location: 'Boulangerie', frequencyCount: 12, intervalDays: 7, lastAdded: Date.now() - (4 * 24 * 60 * 60 * 1000), autoAdded: false },
  { id: '3', name: 'Fresh Bananas', checked: false, category: 'Produce', location: 'Primeur', frequencyCount: 18, intervalDays: 0, lastAdded: Date.now() - (3 * 24 * 60 * 60 * 1000), autoAdded: false },
  { id: '4', name: 'Greek Yogurt (Vanilla)', checked: true, category: 'Dairy & Eggs', location: 'Supermarché', frequencyCount: 8, intervalDays: 7, lastAdded: Date.now() - (2 * 24 * 60 * 60 * 1000), autoAdded: false },
  { id: '5', name: 'Avocados', checked: false, category: 'Produce', location: 'Primeur', frequencyCount: 9, intervalDays: 0, lastAdded: Date.now(), autoAdded: false },
  { id: '6', name: 'Paper Towels', checked: true, category: 'Household', location: 'Supermarché', frequencyCount: 5, intervalDays: 30, lastAdded: Date.now() - (15 * 24 * 60 * 60 * 1000), autoAdded: false }
];

const ITEM_SUGGESTIONS = [
  { name: 'Eggs (Large Grade A)', category: 'Dairy & Eggs', location: 'Primeur', frequencyCount: 22 },
  { name: 'Spinach (Baby Leaves)', category: 'Produce', location: 'Primeur', frequencyCount: 15 },
  { name: 'Chicken Breasts', category: 'Meat & Seafood', location: 'Boucherie', frequencyCount: 11 },
  { name: 'Apples (Honeycrisp)', category: 'Produce', location: 'Primeur', frequencyCount: 10 },
  { name: 'Toilet Paper 12-Pack', category: 'Household', location: 'Supermarché', frequencyCount: 4 },
  { name: 'Pasta Sauce (Marinara)', category: 'Pantry', location: 'Épicerie', frequencyCount: 7 }
];

// Helper to map dynamic terms to standard grocery categories
const CATEGORY_MAP = {
  milk: { category: 'Dairy & Eggs', location: 'Supermarché' },
  cheese: { category: 'Dairy & Eggs', location: 'Supermarché' },
  egg: { category: 'Dairy & Eggs', location: 'Primeur' },
  yogurt: { category: 'Dairy & Eggs', location: 'Supermarché' },
  butter: { category: 'Dairy & Eggs', location: 'Supermarché' },
  bread: { category: 'Bakery', location: 'Boulangerie' },
  croissant: { category: 'Bakery', location: 'Boulangerie' },
  bagel: { category: 'Bakery', location: 'Boulangerie' },
  apple: { category: 'Produce', location: 'Primeur' },
  banana: { category: 'Produce', location: 'Primeur' },
  berry: { category: 'Produce', location: 'Primeur' },
  spinach: { category: 'Produce', location: 'Primeur' },
  tomato: { category: 'Produce', location: 'Primeur' },
  avocado: { category: 'Produce', location: 'Primeur' },
  steak: { category: 'Meat & Seafood', location: 'Boucherie' },
  chicken: { category: 'Meat & Seafood', location: 'Boucherie' },
  salmon: { category: 'Meat & Seafood', location: 'Boucherie' },
  shrimp: { category: 'Meat & Seafood', location: 'Boucherie' },
  paper: { category: 'Household', location: 'Supermarché' },
  napkin: { category: 'Household', location: 'Supermarché' },
  soap: { category: 'Household', location: 'Supermarché' },
  shampoo: { category: 'Household', location: 'Supermarché' },
  pasta: { category: 'Pantry', location: 'Épicerie' },
  sauce: { category: 'Pantry', location: 'Épicerie' },
  rice: { category: 'Pantry', location: 'Épicerie' },
  cereal: { category: 'Pantry', location: 'Épicerie' },
  coffee: { category: 'Pantry', location: 'Épicerie' }
};

export default function App() {
  const [items, setItems] = useState([]);
  const [newItemName, setNewItemName] = useState('');
  const [newItemRecurrence, setNewItemRecurrence] = useState(0); // 0 = no recurrence
  const [activeTab, setActiveTab] = useState('list'); // 'list' | 'analytics' | 'voice' | 'settings'
  const [sortMethod, setSortMethod] = useState('none'); // 'none' | 'location' | 'alphabetical'
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [voiceResultText, setVoiceResultText] = useState('');
  const [voiceStatus, setVoiceStatus] = useState('Click mic to speak to Gemini...');
  const [timeShiftDays, setTimeShiftDays] = useState(0); // Simulated time engine days elapsed
  const [notifications, setNotifications] = useState([]);
  const [isSortingAI, setIsSortingAI] = useState(false);
  const [geminiStatus, setGeminiStatus] = useState('');
  const [isGeminiParsing, setIsGeminiParsing] = useState(false);
  
  const [editingItem, setEditingItem] = useState(null);
  const [showWelcome, setShowWelcome] = useState(() => {
    const saved = localStorage.getItem('smartlist_show_welcome');
    return saved !== null ? JSON.parse(saved) : true;
  });

  // Sync with Firestore and seed INITIAL_ITEMS if empty
  useEffect(() => {
    const colRef = collection(db, "items");
    const unsubscribe = onSnapshot(colRef, async (snapshot) => {
      if (snapshot.empty) {
        console.log("Firestore collection 'items' is empty. Seeding INITIAL_ITEMS...");
        const batch = writeBatch(db);
        INITIAL_ITEMS.forEach((item) => {
          const { id, ...itemData } = item;
          // Add a createdAt timestamp for chronological ordering
          itemData.createdAt = Date.now() - (6 - parseInt(id)) * 1000;
          const docRef = doc(db, "items", id);
          batch.set(docRef, itemData);
        });
        try {
          await batch.commit();
        } catch (err) {
          console.error("Error seeding Firestore database: ", err);
        }
      } else {
        const itemsList = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          itemsList.push({ 
            id: doc.id, 
            ...data,
            location: data.location !== undefined ? data.location : (data.aisle || 'Supermarché'),
            intervalDays: snapInterval(data.intervalDays)
          });
        });
        // Sort items by createdAt descending (newest on top) to match "As Added" order
        itemsList.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        setItems(itemsList);
      }
    });

    return () => unsubscribe();
  }, []);

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
        let friendlyMsg = `Voice input unavailable (${errType}).`;
        
        if (errType === 'not-allowed') {
          friendlyMsg = "Microphone access blocked. Please grant system/browser microphone permissions.";
        } else {
          friendlyMsg = "Microphone access is restricted inside this sandboxed development preview. Please use the interactive Text Simulator panel below!";
        }
        
        setVoiceStatus(friendlyMsg);
        setIsVoiceActive(false);
      };

      rec.onend = () => {
        setIsVoiceActive(false);
      };

      recognitionRef.current = rec;
    } else {
      setVoiceStatus('Web Speech API not natively supported on this browser context. Please use the Text Simulator panel below!');
    }
  }, []);

  // Local regex-based command parser as fallback
  const processVoiceCommandFallback = (text) => {
    const lower = text.toLowerCase().trim();
    let itemName = '';
    let intervalDays = 0;

    const everyDaysMatch = lower.match(/(?:add|put|buy)\s+(.*?)\s+every\s+(\d+)\s+days?/i);
    const weeklyMatch = lower.match(/(?:add|put|buy)\s+(.*?)\s+(?:weekly|every week)/i);
    const dailyMatch = lower.match(/(?:add|put|buy)\s+(.*?)\s+(?:daily|every day)/i);
    const simpleMatch = lower.match(/(?:add|put|buy)\s+(.*)/i);

    if (everyDaysMatch) {
      itemName = everyDaysMatch[1];
      intervalDays = snapInterval(parseInt(everyDaysMatch[2], 10));
    } else if (weeklyMatch) {
      itemName = weeklyMatch[1];
      intervalDays = 7;
    } else if (dailyMatch) {
      itemName = dailyMatch[1];
      intervalDays = snapInterval(1);
    } else if (simpleMatch) {
      itemName = simpleMatch[1];
      intervalDays = 0;
    } else {
      itemName = lower;
      intervalDays = 0;
    }

    itemName = itemName.replace(/^(to my list|on my list|to the list|on the list|to buy|some)\s+/, '');
    itemName = itemName.replace(/\s+(on my list|to my list|on the list|to the list)$/, '');

    if (itemName) {
      const formattedName = itemName.charAt(0).toUpperCase() + itemName.slice(1);
      addItemDirectly(formattedName, intervalDays, true);
      setVoiceStatus(`Fallback Parsed: "${formattedName}" ${intervalDays > 0 ? `every ${intervalDays} days` : '(One-time)'}!`);
      addNotification(`Added via Fallback: ${formattedName} ${intervalDays > 0 ? `(Recurrence: ${intervalDays}d)` : ''}`);
    } else {
      setVoiceStatus("Couldn't recognize fallback command.");
    }
  };

  // High-performance voice command parser using Firebase AI Logic (Gemini Developer API)
  const processVoiceCommand = async (text) => {
    setIsGeminiParsing(true);
    setVoiceStatus(`Gemini parsing voice command: "${text}"...`);

    try {
      const prompt = `You are a helpful grocery assistant. Analyze the user's voice command transcript to add one or more grocery items to a list.
Extract:
1. The capitalized name of the item (e.g. "Baguette", "Organic eggs").
2. The category (MUST be one of: "Produce", "Dairy & Eggs", "Bakery", "Meat & Seafood", "Pantry", "Household", "Other").
3. The French store location where the item is typically bought (MUST be one of: "Primeur", "Boulangerie", "Boucherie", "Épicerie", "Supermarché"). Guidelines:
   - "Primeur" (Greengrocer): fruits, vegetables, salad, fresh herbs, raw eggs.
   - "Boulangerie" (Bakery): baguettes, croissants, breads, pastries.
   - "Boucherie" (Butcher): meats, chicken, beef, steaks, pork, fish, seafood.
   - "Épicerie" (Dry goods/Pantry): pasta, rice, dry beans, spices, flour, sugar, coffee, tea, olive oil, canned foods.
   - "Supermarché" (Supermarket): dairy (milk, cheese, butter, cream, yogurt), household cleaners, paper towels, toilet paper, soap, shampoo, laundry detergent.
4. The recurrence interval in days. Choose the closest standard interval from: 0, 3, 7, 14, 30. Use 0 if the user doesn't specify a recurrence (e.g. one-time item), or snap phrases like:
   - "daily" or "every day" or "every 3 days" -> 3
   - "weekly" or "every week" or "every 7 days" -> 7
   - "biweekly" or "every 2 weeks" or "every 14 days" -> 14
   - "monthly" or "every month" or "every 30 days" or "every 4 weeks" -> 30

If the command lists multiple items (e.g. "add eggs and bread"), parse them as separate items in the array.
Respond ONLY with a JSON array of objects. Example:
[
  {"name": "Organic Milk", "category": "Dairy & Eggs", "location": "Supermarché", "intervalDays": 7},
  {"name": "Baguette", "category": "Bakery", "location": "Boulangerie", "intervalDays": 0}
]

User Voice Command: "${text}"`;

      const result = await geminiModel.generateContent(prompt);
      const response = await result.response;
      const responseText = response.text();
      console.log("Gemini voice response:", responseText);

      let itemsArray = [];
      try {
        itemsArray = JSON.parse(responseText);
      } catch (jsonErr) {
        // In case the response has backticks or markdown JSON wrapper block despite responseMimeType
        const match = responseText.match(/\[\s*\{.*\}\s*\]/s);
        if (match) {
          itemsArray = JSON.parse(match[0]);
        } else {
          throw jsonErr;
        }
      }

      if (Array.isArray(itemsArray) && itemsArray.length > 0) {
        for (const item of itemsArray) {
          const snapped = snapInterval(item.intervalDays);
          await addItemDirectly(item.name, snapped, true, item.category, item.location);
        }

        const itemNamesStr = itemsArray.map(i => i.name).join(", ");
        setVoiceStatus(`Successfully parsed: ${itemNamesStr}`);
        addNotification(`Added via Gemini Voice: ${itemNamesStr}`);
      } else {
        throw new Error("Parsed result was not a non-empty array.");
      }
    } catch (err) {
      console.warn("Gemini voice parser failed. Switching to regex fallback:", err);
      processVoiceCommandFallback(text);
    } finally {
      setIsGeminiParsing(false);
    }
  };

  // Simulates passage of time to trigger automatic recurrence updates
  const handleTimeTravel = async (days) => {
    const newShift = timeShiftDays + days;
    setTimeShiftDays(newShift);

    const batch = writeBatch(db);
    let updatedCount = 0;

    items.forEach(item => {
      if (item.intervalDays > 0) {
        const msSinceLast = Date.now() + (newShift * 24 * 60 * 60 * 1000) - item.lastAdded;
        const daysSinceLast = msSinceLast / (24 * 60 * 60 * 1000);

        if (daysSinceLast >= item.intervalDays && item.checked) {
          updatedCount++;
          const docRef = doc(db, "items", item.id);
          batch.update(docRef, {
            checked: false, // Automatically put back in action
            lastAdded: Date.now() + (newShift * 24 * 60 * 60 * 1000), // Reset clock
            autoAdded: true, // Tag it visually
            frequencyCount: item.frequencyCount + 1
          });
        }
      }
    });

    if (updatedCount > 0) {
      try {
        await batch.commit();
        addNotification(`Temporal Engine: ${updatedCount} recurring item(s) automatically re-added to your grocery list!`);
      } catch (err) {
        console.error("Error committing batch update: ", err);
        addNotification("Error updating recurring items.");
      }
    } else {
      addNotification(`Temporal Engine: Advanced ${days} days. No recurring items reached their threshold.`);
    }
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
        setVoiceStatus('Microphone access blocked or restricted. Please type your phrase below instead!');
        setIsVoiceActive(false);
      }
    }
  };

  const handleManualVoiceSimulate = (text) => {
    if (!text || !text.trim()) return;
    setVoiceResultText(text);
    processVoiceCommand(text);
  };

  const addItemDirectly = async (name, days, isVoice = false, resolvedCategory = null, resolvedLocation = null) => {
    // Determine category and location based on simple name-matching database lookup if not pre-resolved
    let category = resolvedCategory || 'Other';
    let location = resolvedLocation || 'Supermarché';

    if (!resolvedCategory || !resolvedLocation) {
      const lowerName = name.toLowerCase();
      for (const key in CATEGORY_MAP) {
        if (lowerName.includes(key)) {
          if (!resolvedCategory) category = CATEGORY_MAP[key].category;
          if (!resolvedLocation) location = CATEGORY_MAP[key].location;
          break;
        }
      }
    }

    const newItem = {
      name,
      checked: false,
      category,
      location,
      frequencyCount: isVoice ? 2 : 1,
      intervalDays: snapInterval(days),
      lastAdded: Date.now() + (timeShiftDays * 24 * 60 * 60 * 1000),
      autoAdded: isVoice,
      createdAt: Date.now()
    };

    try {
      await addDoc(collection(db, "items"), newItem);
    } catch (err) {
      console.error("Error adding document to Firestore: ", err);
      addNotification("Error adding item to database.");
    }
  };

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!newItemName.trim()) return;
    addItemDirectly(newItemName.trim(), newItemRecurrence);
    addNotification(`Added: ${newItemName.trim()}`);
    setNewItemName('');
    setNewItemRecurrence(0);
  };

  const toggleItem = async (id) => {
    const item = items.find(i => i.id === id);
    if (!item) return;

    const isChecking = !item.checked;
    const docRef = doc(db, "items", id);
    try {
      await updateDoc(docRef, {
        checked: isChecking,
        frequencyCount: isChecking ? item.frequencyCount + 1 : item.frequencyCount,
        lastAdded: isChecking ? Date.now() + (timeShiftDays * 24 * 60 * 60 * 1000) : item.lastAdded,
        autoAdded: isChecking ? false : item.autoAdded
      });
    } catch (err) {
      console.error("Error updating document in Firestore: ", err);
      addNotification("Error updating item status.");
    }
  };

  const deleteItem = async (id) => {
    const docRef = doc(db, "items", id);
    try {
      await deleteDoc(docRef);
    } catch (err) {
      console.error("Error deleting document from Firestore: ", err);
      addNotification("Error deleting item.");
    }
  };

  const saveEditedItem = async (e) => {
    e.preventDefault();
    if (!editingItem.name.trim()) return;
    
    const docRef = doc(db, "items", editingItem.id);
    try {
      await updateDoc(docRef, {
        name: editingItem.name.trim(),
        category: editingItem.category,
        location: editingItem.location,
        intervalDays: editingItem.intervalDays
      });
      addNotification(`Saved: ${editingItem.name}`);
      setEditingItem(null);
    } catch (err) {
      console.error("Error updating document in Firestore: ", err);
      addNotification("Error saving item edits.");
    }
  };

  // Simulates Gemini Cognitive Location Sorting Process
  const triggerAILocationSort = () => {
    setIsSortingAI(true);
    setGeminiStatus('Gemini is mapping shopping locations to your list items...');

    setTimeout(() => {
      setGeminiStatus('Rearranging items dynamically for optimal walking path...');
      setTimeout(() => {
        setSortMethod('location');
        setIsSortingAI(false);
        setGeminiStatus('');
        addNotification('Gemini optimized your grocery list by location layout!');
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
      } else if (sortMethod === 'location') {
        // Physical layout ordering simulation by store/location: Greengrocer -> Bakery -> Butcher -> Dry Goods -> Supermarket
        const locationOrder = {
          'Primeur': 1,
          'Boulangerie': 2,
          'Boucherie': 3,
          'Épicerie': 4,
          'Supermarché': 5
        };
        const orderA = locationOrder[a.location] || 100;
        const orderB = locationOrder[b.location] || 100;
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
                We are simulating a production Google Keep experience tailored with Google Gemini AI features. Test our <strong>"Hey Google / Gemini" voice shortcuts</strong> below, trigger the <strong>AI Location Sorter</strong>, or simulate the passage of days to trigger the <strong>Predictive Recurrence Engine</strong>!
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
        )}

      </main>

      {/* Footer info */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-400">
        <p>&copy; 2026 SmartList AI Ecosystem. Ready for seamless cross-platform deployment.</p>
      </footer>

    </div>
  );
}
