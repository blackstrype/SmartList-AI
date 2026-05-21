# SmartList AI MCP Server

This is a Model Context Protocol (MCP) server for **SmartList AI**. It allows an AI agent (such as Claude Desktop or Gemini Code Assist) to directly interact with the SmartList grocery list in Firebase Cloud Firestore.

The MCP server runs over the standard `Stdio` transport and connects to Firestore using the web client configuration from the main application's `.env.local` file. This means there's no need to download and configure separate Google Cloud Service Account JSON keys.

---

## Capabilities and Tools

The server exposes the following tools:

1. **`get_grocery_list`**: Retrieves all items (active and checked) currently on the list.
2. **`add_grocery_item`**:
   - `name`: string (e.g. `"Organic Milk"`, `"Baguette"`)
   - `intervalDays`: integer (optional, recurrence interval in days. Snaps automatically to standard intervals: `0`, `3`, `7`, `14`, or `30`)
   - `location`: string (optional, French store location: `"Primeur"`, `"Boulangerie"`, `"Boucherie"`, `"Épicerie"`, `"Supermarché"`)
   - `category`: string (optional, category: `"Produce"`, `"Dairy & Eggs"`, `"Bakery"`, `"Meat & Seafood"`, `"Pantry"`, `"Household"`, `"Other"`)
3. **`edit_grocery_item`**:
   - `id`: string (the Firestore document ID of the item)
   - `name`: string (optional, updated name)
   - `intervalDays`: integer (optional, updated recurrence interval)
   - `location`: string (optional, updated French store location)
   - `category`: string (optional, updated category)
4. **`toggle_grocery_item`**:
   - `id`: string (the Firestore document ID)
   - `checked`: boolean (true to mark checked/completed, false to mark active/unchecked)
5. **`delete_grocery_item`**:
   - `id`: string (the Firestore document ID to delete)
6. **`clear_checked_items`**: Clears (deletes) all checked/completed items from the list.

---

## Configuration & Setup

### 1. Prerequisites
- **Node.js**: Make sure you have Node.js installed (v18+ recommended).
- **Credentials**: Ensure the root project directory has a valid `.env.local` file containing the Firebase configuration keys:
  ```env
  VITE_FIREBASE_API_KEY=your-api-key
  VITE_FIREBASE_AUTH_DOMAIN=your-auth-domain
  VITE_FIREBASE_PROJECT_ID=your-project-id
  VITE_FIREBASE_STORAGE_BUCKET=your-storage-bucket
  VITE_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
  VITE_FIREBASE_APP_ID=your-app-id
  ```

### 2. Install Dependencies
Run the following command inside the `mcp-server` directory:
```bash
npm install
```

### 3. Add to MCP Client (e.g., Claude Desktop)
Add the server configuration to your Claude Desktop configuration file:
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

Add the following block under `mcpServers`:

```json
{
  "mcpServers": {
    "smartlist-mcp-server": {
      "command": "node",
      "args": [
        "/Users/smessner/Documents/git/smartlist-ai/mcp-server/index.js"
      ],
      "env": {}
    }
  }
}
```

> [!IMPORTANT]
> Make sure the absolute path inside the `args` array matches the location of your cloned repository.

### 4. Restart your MCP Client
Restart Claude Desktop (or your respective MCP client). You should see a plug icon indicating that the `smartlist-mcp-server` tools are loaded and ready.

---

## Voice Commands Example

Once connected, you can talk or type directly to your AI Assistant:
- *"Add eggs to my grocery list. I buy them every week at Day-By-Day."*
  - The agent will translate this into calling `add_grocery_item` with `name: "Eggs"`, `intervalDays: 7` (weekly), and location auto-matching or set appropriately.
- *"Show me my current grocery list."*
  - The agent will call `get_grocery_list` and read the items to you.
- *"I've bought the bananas."*
  - The agent will retrieve the ID of the bananas and call `toggle_grocery_item` with `checked: true`.
