# 📱 Mobile Installation & Usage Guide

## How to Install Vibe Recipes on Your Phone

### Step 1: Start the Server
1. Open Command Prompt or Terminal on your computer
2. Navigate to the Vibe folder: `cd "C:\Users\moskowel\Documents\Vibe"`
3. Run the server: `python serve.py`
4. You'll see something like:
   ```
   🍽️  Vibe Recipe App Server
   📱 Serving at: http://localhost:8080
   🌐 Network access: http://192.168.1.100:8080
   ```

### Step 2: Access on Your Phone
1. **Connect your phone to the same WiFi network as your computer**
2. Open your phone's web browser (Chrome, Safari, etc.)
3. Type the **Network access URL** from step 1 (e.g., `http://192.168.1.100:8080`)
4. The Vibe Recipes app should load on your phone

### Step 3: Install as an App

#### For Android (Chrome):
1. When the app loads, you should see an "Install" banner at the bottom
2. Tap **"Install"** to add it to your home screen
3. Alternatively, tap the menu (⋮) → **"Add to Home screen"** or **"Install app"**
4. The app will now appear on your home screen like any other app!

#### For iPhone (Safari):
1. When the app loads, tap the **Share button** (□↗) at the bottom
2. Scroll down and tap **"Add to Home Screen"**
3. Tap **"Add"** in the top right
4. The app will now appear on your home screen!

### Step 4: Using the Mobile App
- **Offline Access**: Once installed, the app works offline! Your recipes are stored locally on your phone
- **Add Recipes**: Tap the "+" button to add recipes from URLs or manually
- **Search**: Use the search button to find recipes by ingredients, tags, or cooking time
- **Photos**: Take photos directly with your phone camera when adding recipes
- **Share**: Use the share button to export recipes and send them to your partner

## Sharing Recipes Between Devices

### Method 1: Export/Import Files
1. **On your phone**: Tap Share → Export Recipes
2. **Send the file** via WhatsApp, email, or cloud storage to your partner
3. **On partner's phone**: Tap Share → Import Recipes → Select the file

### Method 2: Mobile Sharing (Android)
1. **On your phone**: Tap Share → Share via Phone
2. **Choose how to share**: Text message, WhatsApp, email, etc.
3. **Partner receives** the recipe data and can import it

### Method 3: Cloud Storage
1. **Export recipes** from the app
2. **Upload to Google Drive, Dropbox, or OneDrive**
3. **Share the link** with your partner
4. **Partner downloads** and imports the file

## Tips for Best Mobile Experience

### 🔋 Battery & Performance
- The app is lightweight and won't drain your battery
- Works completely offline once installed
- No internet required for viewing or adding recipes

### 📸 Adding Photos
- Tap the camera icon when adding recipes
- Take multiple photos of your dishes
- Photos are stored locally on your device

### 🔍 Quick Search
- Use the search feature to find recipes by:
  - Recipe name
  - Ingredients (e.g., "chicken", "pasta")
  - Tags (e.g., "quick", "vegetarian")
  - Cooking time

### 🏷️ Organizing with Tags
- Add tags like: "dinner", "quick", "vegetarian", "spicy"
- Use consistent tags to make searching easier
- The app suggests tags as you type

### 📱 Home Screen Access
- Once installed, the app opens instantly from your home screen
- No need to remember URLs or open browsers
- Works just like any other app on your phone

## Troubleshooting

### App Won't Install
- Make sure you're using Chrome (Android) or Safari (iPhone)
- Try refreshing the page
- Check that you're connected to the same WiFi network

### Can't Access from Phone
- Verify both devices are on the same WiFi
- Try the localhost URL if on the same computer: `http://localhost:8080`
- Restart the server: Stop with Ctrl+C, then run `python serve.py` again

### Recipes Not Syncing
- Each device stores recipes locally
- Use the export/import feature to sync between devices
- This gives you full control over your data

### Server Stops Working
- The server needs to run on your computer for initial access
- Once installed on your phone, the app works offline
- Restart the server anytime with `python serve.py`

## Advanced Features

### 🔗 URL Import
- Copy recipe URLs from Instagram, food blogs, or cooking sites
- The app automatically extracts ingredients and instructions
- Works with most popular recipe websites

### 🍽️ Meal Planning
- Use tags to organize by meal type: "breakfast", "lunch", "dinner"
- Filter by cooking time for quick meal decisions
- Add serving sizes to plan for groups

### 👥 Family Sharing
- Each family member can install the app on their phone
- Share recipe collections via export/import
- Everyone has their own local copy

---

**Need Help?** The app works entirely on your devices - no accounts, no cloud storage required. Your recipes stay private and under your control!