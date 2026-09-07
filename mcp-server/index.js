import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, doc, getDocs, addDoc, updateDoc, deleteDoc, query, orderBy } from "firebase/firestore";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load Firebase credentials from the parent workspace's .env.local file
dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
  measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Check if variables are loaded properly
if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  console.error("Warning: Firebase credentials not fully loaded. Check ../.env.local path and contents.");
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Category and location auto-mapping dictionary matching the main app
const CATEGORY_MAP = {
  milk: { category: "Dairy & Eggs", location: "Supermarché" },
  egg: { category: "Dairy & Eggs", location: "Primeur" },
  cheese: { category: "Dairy & Eggs", location: "Supermarché" },
  butter: { category: "Dairy & Eggs", location: "Supermarché" },
  yogurt: { category: "Dairy & Eggs", location: "Supermarché" },
  cream: { category: "Dairy & Eggs", location: "Supermarché" },
  bread: { category: "Bakery", location: "Boulangerie" },
  croissant: { category: "Bakery", location: "Boulangerie" },
  bagel: { category: "Bakery", location: "Boulangerie" },
  apple: { category: "Produce", location: "Primeur" },
  banana: { category: "Produce", location: "Primeur" },
  berry: { category: "Produce", location: "Primeur" },
  spinach: { category: "Produce", location: "Primeur" },
  tomato: { category: "Produce", location: "Primeur" },
  avocado: { category: "Produce", location: "Primeur" },
  steak: { category: "Meat & Seafood", location: "Boucherie" },
  chicken: { category: "Meat & Seafood", location: "Boucherie" },
  salmon: { category: "Meat & Seafood", location: "Boucherie" },
  shrimp: { category: "Meat & Seafood", location: "Boucherie" },
  paper: { category: "Household", location: "Supermarché" },
  napkin: { category: "Household", location: "Supermarché" },
  soap: { category: "Household", location: "Supermarché" },
  shampoo: { category: "Household", location: "Supermarché" },
  pasta: { category: "Pantry", location: "Épicerie" },
  sauce: { category: "Pantry", location: "Épicerie" },
  rice: { category: "Pantry", location: "Épicerie" },
  cereal: { category: "Pantry", location: "Épicerie" },
  coffee: { category: "Pantry", location: "Épicerie" }
};

const CATEGORY_ENTRIES = Object.entries(CATEGORY_MAP);

// Helper to snap intervals to standard periods [0, 3, 7, 14, 30]
const snapInterval = (days) => {
  if (days === undefined || days === null || days <= 0) return 0;
  if (days <= 4) return 3;
  if (days <= 10) return 7;
  if (days <= 21) return 14;
  return 30;
};

// Initialize MCP Server instance
const server = new Server(
  {
    name: "smartlist-mcp-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Define tool schema handler
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "get_grocery_list",
        description: "Retrieves all items currently on the shopping list, including both active and checked items.",
        inputSchema: {
          type: "object",
          properties: {}
        }
      },
      {
        name: "add_grocery_item",
        description: "Adds a new grocery item to the shopping list with optional recurrence interval, location, and category.",
        inputSchema: {
          type: "object",
          properties: {
            name: {
              type: "string",
              description: "The name of the grocery item (e.g. 'Organic Milk', 'Eggs', 'Baguette')."
            },
            intervalDays: {
              type: "integer",
              description: "Recurrence interval in days (0 for one-time/no recurrence, or standard intervals: 3, 7, 14, 30).",
              default: 0
            },
            location: {
              type: "string",
              description: "The store location (e.g. 'Primeur', 'Boulangerie', 'Boucherie', 'Épicerie', 'Supermarché'). If not provided, it will match standard defaults based on name."
            },
            category: {
              type: "string",
              description: "The category (e.g. 'Produce', 'Dairy & Eggs', 'Bakery', 'Meat & Seafood', 'Pantry', 'Household', 'Other'). If not provided, it will match standard defaults based on name."
            }
          },
          required: ["name"]
        }
      },
      {
        name: "edit_grocery_item",
        description: "Updates an existing grocery item's details (such as name, interval, location, or category) by document ID.",
        inputSchema: {
          type: "object",
          properties: {
            id: {
              type: "string",
              description: "The document ID of the item in Firestore."
            },
            name: {
              type: "string",
              description: "New name of the grocery item."
            },
            intervalDays: {
              type: "integer",
              description: "New recurrence interval in days (0 for one-time, or 3, 7, 14, 30)."
            },
            location: {
              type: "string",
              description: "New store location (e.g. 'Primeur', 'Boulangerie', 'Boucherie', 'Épicerie', 'Supermarché')."
            },
            category: {
              type: "string",
              description: "New category (e.g. 'Produce', 'Dairy & Eggs', 'Bakery', 'Meat & Seafood', 'Pantry', 'Household', 'Other')."
            }
          },
          required: ["id"]
        }
      },
      {
        name: "toggle_grocery_item",
        description: "Checks or unchecks a grocery item (marks it as completed/in-cart or active).",
        inputSchema: {
          type: "object",
          properties: {
            id: {
              type: "string",
              description: "The document ID of the item to toggle."
            },
            checked: {
              type: "boolean",
              description: "True to mark completed (checked), false to mark active (unchecked)."
            }
          },
          required: ["id", "checked"]
        }
      },
      {
        name: "delete_grocery_item",
        description: "Removes a grocery item from the shopping list permanently.",
        inputSchema: {
          type: "object",
          properties: {
            id: {
              type: "string",
              description: "The document ID of the item to delete."
            }
          },
          required: ["id"]
        }
      },
      {
        name: "clear_checked_items",
        description: "Clears (deletes) all checked/completed items from the shopping list.",
        inputSchema: {
          type: "object",
          properties: {}
        }
      }
    ]
  };
});

// Tool call handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  const colRef = collection(db, "items");

  try {
    switch (name) {
      case "get_grocery_list": {
        const q = query(colRef, orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        const items = [];
        snapshot.forEach((docSnap) => {
          items.push({ id: docSnap.id, ...docSnap.data() });
        });
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(items, null, 2)
            }
          ]
        };
      }

      case "add_grocery_item": {
        const itemName = args.name.trim();
        const intervalDays = snapInterval(args.intervalDays !== undefined ? args.intervalDays : 0);
        let category = args.category || "Other";
        let location = args.location || "Supermarché";

        // Auto-match category and location if not explicitly provided
        if (!args.category || !args.location) {
          const lowerName = itemName.toLowerCase();
          for (let i = 0; i < CATEGORY_ENTRIES.length; i++) {
            const entry = CATEGORY_ENTRIES[i];
            if (lowerName.includes(entry[0])) {
              if (!args.category) category = entry[1].category;
              if (!args.location) location = entry[1].location;
              break;
            }
          }
        }

        const newItem = {
          name: itemName,
          checked: false,
          category,
          location,
          frequencyCount: 1,
          intervalDays,
          lastAdded: Date.now(),
          autoAdded: false,
          createdAt: Date.now()
        };

        const docRef = await addDoc(colRef, newItem);
        return {
          content: [
            {
              type: "text",
              text: `Added item: ${itemName} (ID: ${docRef.id}, Location: ${location}, Category: ${category}, Recurrence: ${intervalDays > 0 ? `${intervalDays} days` : "None"})`
            }
          ]
        };
      }

      case "edit_grocery_item": {
        const { id, ...updates } = args;
        const docRef = doc(db, "items", id);

        const firestoreUpdates = {};
        if (updates.name !== undefined) firestoreUpdates.name = updates.name.trim();
        if (updates.intervalDays !== undefined) firestoreUpdates.intervalDays = snapInterval(updates.intervalDays);
        if (updates.location !== undefined) firestoreUpdates.location = updates.location;
        if (updates.category !== undefined) firestoreUpdates.category = updates.category;

        if (Object.keys(firestoreUpdates).length === 0) {
          throw new Error("No update fields provided.");
        }

        await updateDoc(docRef, firestoreUpdates);
        return {
          content: [
            {
              type: "text",
              text: `Updated item ${id} with: ${JSON.stringify(firestoreUpdates)}`
            }
          ]
        };
      }

      case "toggle_grocery_item": {
        const { id, checked } = args;
        const docRef = doc(db, "items", id);

        await updateDoc(docRef, {
          checked: !!checked,
          lastAdded: Date.now()
        });
        return {
          content: [
            {
              type: "text",
              text: `Marked item ${id} as ${checked ? "completed (checked)" : "active (unchecked)"}`
            }
          ]
        };
      }

      case "delete_grocery_item": {
        const { id } = args;
        const docRef = doc(db, "items", id);
        await deleteDoc(docRef);
        return {
          content: [
            {
              type: "text",
              text: `Deleted item ${id}`
            }
          ]
        };
      }

      case "clear_checked_items": {
        const snapshot = await getDocs(colRef);
        let deleteCount = 0;
        const deletePromises = [];

        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          if (data.checked === true) {
            deletePromises.push(deleteDoc(doc(db, "items", docSnap.id)));
            deleteCount++;
          }
        });

        await Promise.all(deletePromises);
        return {
          content: [
            {
              type: "text",
              text: `Cleared ${deleteCount} checked/completed items.`
            }
          ]
        };
      }

      default:
        throw new Error(`Tool not found: ${name}`);
    }
  } catch (error) {
    return {
      isError: true,
      content: [
        {
          type: "text",
          text: `Error executing tool ${name}: ${error.message}`
        }
      ]
    };
  }
});

// Start StdIO MCP transport connection
const transport = new StdioServerTransport();
server.connect(transport).then(() => {
  console.error("SmartList MCP Server running on stdio");
}).catch((err) => {
  console.error("Failed to start SmartList MCP Server:", err);
});
