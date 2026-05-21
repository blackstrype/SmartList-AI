# SmartList AI 🛒✨

SmartList AI is a predictive, real-time grocery list assistant. It leverages Cloud Firestore for database persistence and features a simulation sandbox for voice commands, time travel, and store layout optimizations.

---

## Key Features

- **Real-Time Sync**: Synced continuously with Cloud Firestore. Add, toggle, edit, or delete items, and watch them update instantly across devices.
- **Predictive Recurrence Engine**: Set item recurrences to standard intervals (3 days, 7 days, 14 days, or 30 days). Checked items automatically reappear on your list when their recurrence period elapses.
- **Time Travel Simulator**: Test and verify recurrence behaviors by simulating the passage of time (e.g., advancing the calendar by +1, +3, or +7 days) to see items reappear automatically.
- **Gemini Voice Interface Simulator**: Speak or type natural language inputs (e.g., *"add whole wheat bread every 7 days"* or *"put greek yogurt on the list"*) to dynamically parse items, categories, aisles, and recurrence intervals.
- **Cognitive Aisle Sorting**: Optimizes your shopping route by grouping and sorting grocery items dynamically by simulated supermarket aisle layouts (entrance first, household last).
- **Dismissible Alerts**: Modern toast notification system and a welcome guide equipped with timeout-fading and instant dismissal options.

---

## Tech Stack

- **Framework**: React 19 + Vite 8
- **Styling**: TailwindCSS 4 (via `@tailwindcss/vite`)
- **Icons**: Lucide React
- **Database**: Firebase (Cloud Firestore)

---

## Local Setup & Development

Follow these steps to run the application locally on your machine.

### 1. Prerequisites

Make sure you have [Node.js](https://nodejs.org/) installed (LTS recommended).

### 2. Clone the Repository

```bash
git clone https://github.com/blackstrype/SmartList-AI.git
cd smartlist-ai
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Configure Firebase

SmartList AI uses Cloud Firestore for database storage. 

1. Go to the [Firebase Console](https://console.firebase.google.com/) and click **Add project** to create a new project.
2. In your Project Overview screen, click the **Web icon (`</>` )** to register a web app and copy the `firebaseConfig` credentials object.
3. In the left-hand navigation menu of the console, click **Build -> Firestore Database** and click **Create database**. 
4. Start the database in **Test mode** (or configure custom security rules) and select your database location.
5. Create a file named `.env.local` in the root of your project and populate it with your credentials:

```properties
# Duplicate .env.example as .env.local and fill in your keys:
VITE_FIREBASE_API_KEY=YOUR_API_KEY
VITE_FIREBASE_AUTH_DOMAIN=YOUR_PROJECT_ID.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=YOUR_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET=YOUR_PROJECT_ID.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=YOUR_SENDER_ID
VITE_FIREBASE_APP_ID=YOUR_APP_ID
VITE_FIREBASE_MEASUREMENT_ID=YOUR_MEASUREMENT_ID
```

*(You can refer to [.env.example](.env.example) as a guide).*

### 5. Run the Local Server

Launch the Vite local dev server:

```bash
npm run dev
```

The application will start, typically running on [http://localhost:5173](http://localhost:5173).

### 6. Build for Production

To compile production-optimized assets:

```bash
npm run build
```

The build output will be stored in the `/dist` folder, ready for deployment.

---

## Database Initialization & Security

- **Auto-Seeding**: When the application runs for the first time with an empty Firestore database, it automatically seeds default items (Milk, Bread, Bananas, Yogurt, etc.) with pre-configured recurrence properties.
- **Security Rules**: Security rules for the prototype are defined in [firestore.rules](firestore.rules) and can be deployed using the Firebase CLI.
