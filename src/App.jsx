import { useState, useEffect, useRef, useCallback } from 'react';
import { db, geminiModel } from './firebase';
import { collection, doc, addDoc, updateDoc, deleteDoc, onSnapshot, writeBatch } from 'firebase/firestore';
import SandboxHeader from './components/SandboxHeader';
import NotificationCenter from './components/NotificationCenter';
import Navbar from './components/Navbar';
import WelcomeBanner from './components/WelcomeBanner';
import ActiveListTab from './components/ActiveListTab';
import VoiceSandboxTab from './components/VoiceSandboxTab';
import AnalyticsTab from './components/AnalyticsTab';
import Footer from './components/Footer';

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
  const [voiceLang, setVoiceLang] = useState('en-US'); // 'en-US' | 'fr-FR'
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



  const dismissNotification = useCallback((id) => {
    setNotifications(prev => {
      const exists = prev.find(n => n.id === id);
      if (!exists || exists.exiting) return prev;
      return prev.map(n => n.id === id ? { ...n, exiting: true } : n);
    });
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 300);
  }, []);

  const addNotification = useCallback((msg) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
    setNotifications(prev => [...prev, { id, msg, exiting: false }]);
    setTimeout(() => {
      dismissNotification(id);
    }, 6000);
  }, [dismissNotification]);

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

  // Local regex-based command parser as fallback
  const processVoiceCommandFallback = (text) => {
    const lower = text.toLowerCase().trim();
    let itemName;
    let intervalDays;

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
1. The capitalized name of the item. Use the language matching the spoken query (e.g., "Baguette" or "Pain" if spoken in French, "Eggs" or "Milk" if spoken in English).
2. The category (MUST be one of: "Produce", "Dairy & Eggs", "Bakery", "Meat & Seafood", "Pantry", "Household", "Other").
3. The French store location where the item is typically bought (MUST be one of: "Primeur", "Boulangerie", "Boucherie", "Épicerie", "Supermarché"). Guidelines:
   - "Primeur" (Greengrocer): fruits, vegetables, salad, fresh herbs, raw eggs.
   - "Boulangerie" (Bakery): baguettes, croissants, breads, pastries.
   - "Boucherie" (Butcher): meats, chicken, beef, steaks, pork, fish, seafood.
   - "Épicerie" (Dry goods/Pantry): pasta, rice, dry beans, spices, flour, sugar, coffee, tea, olive oil, canned foods.
   - "Supermarché" (Supermarket): dairy (milk, cheese, butter, cream, yogurt), household cleaners, paper towels, toilet paper, soap, shampoo, laundry detergent.
4. The recurrence interval in days. Choose the closest standard interval from: 0, 3, 7, 14, 30. Use 0 if the user doesn't specify a recurrence (e.g. one-time item), or snap phrases like:
   - "daily" or "every day" or "every 3 days" (or "tous les jours", "chaque jour") -> 3
   - "weekly" or "every week" or "every 7 days" (or "toutes les semaines", "chaque semaine") -> 7
   - "biweekly" or "every 2 weeks" or "every 14 days" (or "toutes les deux semaines") -> 14
   - "monthly" or "every month" or "every 30 days" or "every 4 weeks" (or "tous les mois", "chaque mois") -> 30

If the command lists multiple items (e.g. "add eggs and bread" or "ajoute des oeufs et du pain"), parse them as separate items in the array.
Respond ONLY with a JSON array of objects. Example:
[
  {"name": "Organic Milk", "category": "Dairy & Eggs", "location": "Supermarché", "intervalDays": 7},
  {"name": "Baguette", "category": "Bakery", "location": "Boulangerie", "intervalDays": 0}
]

User Voice Command: "${text}" (The command is transcribed using speech recognition configured for language: ${voiceLang === 'en-US' ? 'English' : 'French'}. Support English or French terms).`;

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
        await Promise.all(itemsArray.map(async (item) => {
          const snapped = snapInterval(item.intervalDays);
          await addItemDirectly(item.name, snapped, true, item.category, item.location);
        }));

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

  // Voice recognition setup
  const recognitionRef = useRef(null);
  const voiceLangRef = useRef(voiceLang);
  const processVoiceCommandRef = useRef(null);

  // Keep refs synchronized
  useEffect(() => {
    voiceLangRef.current = voiceLang;
  }, [voiceLang]);

  useEffect(() => {
    processVoiceCommandRef.current = processVoiceCommand;
  });

  useEffect(() => {
    // Initialize Web Speech API if supported
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = voiceLangRef.current;

      rec.onstart = () => {
        setIsVoiceActive(true);
        setVoiceStatus('Listening for "Add [Item] every [N] days"...');
      };

      rec.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setVoiceResultText(transcript);
        processVoiceCommandRef.current(transcript);
      };

      rec.onerror = (event) => {
        console.error("Speech Recognition Error:", event);
        const errType = event.error || "security-block";
        let friendlyMsg;
        
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
      setTimeout(() => {
        setVoiceStatus('Web Speech API not natively supported on this browser context. Try opening http://localhost:5174/ in a standard browser tab.');
      }, 0);
    }
  }, []);

  // Sync voiceLang selection to SpeechRecognition instance dynamically
  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = voiceLang;
      // Also update instructions status text
      const friendlyName = voiceLang === 'en-US' ? 'English' : 'French';
      setVoiceStatus(`Language switched to ${friendlyName}. Click mic to speak to Gemini...`);
    }
  }, [voiceLang]);

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

  const toggleVoice = () => {
    if (isVoiceActive) {
      try {
        recognitionRef.current?.stop();
      } catch {
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
      <SandboxHeader 
        timeShiftDays={timeShiftDays} 
        handleTimeTravel={handleTimeTravel} 
        setTimeShiftDays={setTimeShiftDays} 
      />

      <NotificationCenter 
        notifications={notifications} 
        dismissNotification={dismissNotification} 
      />

      <Navbar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
      />

      <main className="flex-1 max-w-5xl w-full mx-auto p-4 md:p-6 grid grid-cols-1 gap-6">
        <WelcomeBanner 
          showWelcome={showWelcome} 
          handleDismissWelcome={handleDismissWelcome} 
        />

        {activeTab === 'list' && (
          <ActiveListTab
            items={items}
            newItemName={newItemName}
            setNewItemName={setNewItemName}
            newItemRecurrence={newItemRecurrence}
            setNewItemRecurrence={setNewItemRecurrence}
            handleAddSubmit={handleAddSubmit}
            setActiveTab={setActiveTab}
            sortMethod={sortMethod}
            setSortMethod={setSortMethod}
            triggerAILocationSort={triggerAILocationSort}
            isSortingAI={isSortingAI}
            geminiStatus={geminiStatus}
            editingItem={editingItem}
            setEditingItem={setEditingItem}
            saveEditedItem={saveEditedItem}
            toggleItem={toggleItem}
            deleteItem={deleteItem}
            sortedLists={sortedLists}
          />
        )}

        {activeTab === 'voice' && (
          <VoiceSandboxTab
            voiceLang={voiceLang}
            setVoiceLang={setVoiceLang}
            isGeminiParsing={isGeminiParsing}
            isVoiceActive={isVoiceActive}
            toggleVoice={toggleVoice}
            voiceStatus={voiceStatus}
            voiceResultText={voiceResultText}
            handleManualVoiceSimulate={handleManualVoiceSimulate}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsTab
            items={items}
            addItemDirectly={addItemDirectly}
            addNotification={addNotification}
          />
        )}
      </main>

      <Footer />
    </div>
  );
}
