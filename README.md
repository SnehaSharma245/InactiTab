# 🔥 InactiTab - Smart Tab Management Extension

<div align="center">
  <img src="icons/icon2.png" alt="InactiTab Logo" width="128" height="128">

**🌐 [Live Demo & Landing Page](https://inactitab.vercel.app)**

</div>

---

## 📖 Overview

**InactiTab** is a powerful Chrome extension designed to automatically manage your browser tabs by detecting inactive tabs and either putting them to sleep or closing them automatically. It helps improve browser performance, reduce memory usage, and keep your workspace organized.

### 🎯 Key Features

- **🛡️ Smart Protection System** - Automatically protects tabs with active media, video calls, and whitelisted sites
- **⏰ Customizable Timers** - Set custom inactivity timeouts (seconds, minutes, hours)
- **🎵 Media Detection** - Detects audio/video playing, camera usage, and video call sites
- **📋 Whitelist Management** - Easy whitelist management with one-click current tab whitelisting
- **💤 Sleep Mode** - Visual indicators for sleeping tabs with option to auto-close
- **📚 Tab History** - Keep track of auto-closed tabs with restore functionality
- **⚙️ Flexible Settings** - Comprehensive settings for tab thresholds, pinned tab protection, and more

---

## 🚀 Installation

### Method 1: Download from Website (Recommended)

1. **Download the Extension**

   - Visit our [Landing Page](https://inactitab.vercel.app)
   - Click on the "Download Extension" button
   - Download the latest zip file
   - Extract the ZIP file to a folder on your computer

2. **Install in Chrome**

   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" in the top right corner
   - Click "Load unpacked" button
   - Select the extracted folder containing the extension files
   - The InactiTab extension should now appear in your extensions list

3. **Pin the Extension**
   - Click the puzzle piece icon in Chrome toolbar
   - Find InactiTab and click the pin icon to keep it visible

### Method 2: Download from GitHub Releases

1. **Download the Extension**

   - Go to [GitHub Releases](https://github.com/SnehaSharma245/InactiTab-landing-page/releases/tag/v1.0.0)
   - Download the latest `inactitab.zip` file
   - Extract the ZIP file to a folder on your computer

2. **Install in Chrome**

   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" in the top right corner
   - Click "Load unpacked" button
   - Select the extracted folder containing the extension files
   - The InactiTab extension should now appear in your extensions list

3. **Pin the Extension**
   - Click the puzzle piece icon in Chrome toolbar
   - Find InactiTab and click the pin icon to keep it visible

---

## 🎮 Usage Guide

### Getting Started

1. **Open the Extension** - Click the InactiTab icon in your Chrome toolbar
2. **Set Your Preferences** - Go to Settings tab to configure timer and thresholds
3. **Manage Whitelist** - Add important sites to the whitelist to protect them
4. **Monitor Activity** - Use the different tabs to monitor protected, inactive, and closed tabs

### 🛡️ Tab Protection System

InactiTab automatically protects tabs from being tracked for inactivity based on:

- **🎵 Audio/Video Activity** - Tabs playing audio or using camera/microphone
- **📹 Video Call Sites** - Google Meet, Zoom, Teams, Discord, etc.
- **📋 Whitelisted URLs** - Manually added trusted sites
- **📌 Pinned Tabs** - When "Whitelist pinned tabs" setting is enabled

### 📱 Interface Overview

#### 🏠 Whitelist Tab

- **Quick Whitelist** - One-click whitelist current tab
- **Manual Entry** - Add URLs manually
- **Opened Tabs List** - See all tabs with whitelist toggle buttons
- **Sort Feature** - Sort whitelisted tabs first

#### 🛡️ Playing Tab

- **Protected Tabs** - View all currently protected tabs
- **Protection Reasons** - See why each tab is protected (audio, video, whitelist, etc.)
- **Real-time Updates** - Auto-refreshes every 2 seconds

#### 💤 Inactive Tab

- **Sleeping Tabs** - View tabs put to sleep mode
- **Quick Actions** - Visit or close tabs directly
- **Status Indicators** - Visual indicators for protected vs sleeping tabs

#### 📚 History Tab

- **Auto-closed Tabs** - View recently closed tabs
- **Restore Functionality** - Reopen tabs with one click
- **Bulk Management** - Select and delete multiple entries
- **Smart Cleanup** - Removes duplicates and already opened tabs

#### ⚙️ Settings Tab

- **Inactive Timer** - Set custom timeout (1-999 seconds/minutes/hours)
- **Tab Threshold** - Set minimum tab count to start tracking (1-100)
- **Auto-close Mode** - Enable automatic closing without sleep mode
- **History Limit** - Control how many closed tabs to remember (1-20)
- **Pinned Tab Protection** - Toggle protection for pinned tabs

---

## 🔧 Configuration Options

### Timer Settings

- **Timer Value**: 1-999 (configurable unit)
- **Timer Unit**: Seconds, Minutes, Hours
- **Default**: 5 seconds (for testing)

### Advanced Settings

- **Tab Threshold**: Only start tracking when tab count exceeds this number
- **Whitelist Pinned**: Automatically protect pinned tabs
- **Auto-close**: Skip sleep mode and directly close inactive tabs
- **History Limit**: Number of closed tabs to keep in history

---

## 🛠️ Technical Details

### Built With

- **React 18** - Modern UI framework
- **Tailwind CSS** - Utility-first styling
- **Chrome Extension APIs** - Native browser integration
- **Lucide Icons** - Beautiful icon set
- **Chrome Storage API** - Persistent settings storage

### Permissions Used

- `tabs` - Monitor and manage browser tabs
- `storage` - Save settings and whitelist
- `notifications` - Show feedback notifications
- `scripting` - Inject sleep mode indicators
- `activeTab` - Access current tab information

---

## 🐛 Troubleshooting

### Common Issues

**Extension not working after installation**

- Make sure Developer mode is enabled
- Try refreshing the extensions page
- Check console for error messages

**Tabs not being detected as inactive**

- Check if tab threshold setting is appropriate
- Verify the tab isn't whitelisted or protected
- Ensure timer settings are configured correctly

**Settings not saving**

- Check if Chrome has sufficient storage permissions
- Try disabling and re-enabling the extension
- Clear extension storage and reconfigure

### Getting Help

- 🌐 Visit our [Landing Page](https://inactitab.vercel.app) for demos and tutorials
- 📧 Report issues on [GitHub Issues](https://github.com/yourusername/InactiTab2/issues)
- 💬 Join our community discussions

---

## 🤝 Contributing

We welcome contributions!

### Development Setup

```bash
# Clone and setup
git clone https://github.com/yourusername/InactiTab2.git
cd InactiTab2
npm install

# Start development
npm run dev

# Build for production
npm run build
```

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- Thanks to all contributors and beta testers
- Icons by [Lucide](https://lucide.dev/)
- Built with ❤️ using React and Tailwind CSS

---

<div align="center">
  
  **⭐ If you find InactiTab helpful, please consider giving it a star!**
  
  **🌐 [Visit Landing Page](https://inactitab.vercel.app) | 📦 [Download Latest Release](https://github.com/yourusername/InactiTab2/releases)**
  
  Made with ❤️ by [Your Name]
  
</div>
