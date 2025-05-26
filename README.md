# InactiTab Manager

A Chrome extension built with React to manage inactive tabs with smart whitelist and customizable settings.

## Features

- 🕒 Track inactive tabs with customizable timer
- 🛡️ Whitelist URLs to prevent closure
- ⚙️ Configurable settings (timer, auto-close, pinned tabs)
- 🌙 Light/Dark theme support
- 📱 Modern React-based UI

## Development

1. Install dependencies:

```bash
npm install
```

2. Build the extension:

```bash
npm run build
```

3. Load the extension:

   - Open Chrome Extensions (chrome://extensions/)
   - Enable Developer mode
   - Click "Load unpacked" and select the `dist` folder

4. For development with auto-rebuild:

```bash
npm run dev
```

## Project Structure

```
src/
├── background/
│   └── background.js      # Background service worker
├── popup/
│   ├── components/        # React components
│   ├── hooks/            # Custom React hooks
│   ├── styles/           # CSS styles
│   ├── popup.html        # Popup HTML
│   └── index.js          # React entry point
└── manifest.json         # Extension manifest
```

## Build Output

The built extension is output to the `dist/` directory and ready to be loaded as an unpacked extension.
