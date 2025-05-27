# InactiTab 🚀

Smart Chrome extension for managing inactive tabs with intelligent protection and automation.

## ✨ Key Features

- **Smart Tracking**: Automatically detects inactive tabs with customizable timers
- **Media Protection**: Protects tabs with active audio/video and video calls
- **URL Whitelisting**: Manual protection for important sites
- **Auto-Close Mode**: Automatically closes inactive tabs with history backup
- **Visual Tab Indicators**: Visual indicators (💤) without closing tabs
- **Modern UI**: Dark theme with real-time status updates

## 🔧 User Flexibility

- **Timer Settings**: 1-999 seconds/minutes/hours
- **Tab Threshold**: Start tracking when tabs exceed limit (1-100)
- **Auto-Close Toggle**: Switch between sleep mode and auto-close
- **History Management**: Keep 1-20 auto-closed tabs
- **Pinned tab Protection**: Optional protection for pinned tabs
- **Batch Operations**: Select, manage or revisit multiple auto-closed tabs

## 🛡️ Auto-Protected Tabs

- Tabs playing audio/video
- Video call sites (Meet, Zoom, Teams, Discord, etc.)
- Whitelisted URLs
- Pinned tabs (optional)
- Active tab

## ⚠️ Important Note

Visual indicators (💤, 🔒) are **not supported** on browser internal pages like:

- `chrome://extensions/`
- `brave://settings/`
- `edge://flags/`
- `about:` pages

This is a browser security limitation. The extension will still track and manage these tabs, but won't show visual indicators.

## 🚀 Quick Start

1. Clone and install:

   ```bash
   git clone <repo-url>
   cd InactiTab2
   npm install && npm run build
   ```

2. Load in Chrome:

   - Open `chrome://extensions/`
   - Enable Developer mode → Load unpacked → Select `dist` folder

3. Configure settings in extension popup

## 🏗️ Tech Stack

- React 18 + Tailwind CSS
- Chrome Extensions API (Manifest V3)
- Local storage only (no external servers)

## 📁 Project Structure

```
src/
├── background/background.js    # Tab management logic
├── popup/components/          # React UI components
├── content/index.js          # Content script
└── manifest.json            # Extension config
```

## 🛠️ Development

```bash
npm run dev      # Development mode
npm run build    # Production build
```
