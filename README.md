# 💤 InactiTab - Smart Tab Management Extension

<div align="center">
  <img src="icons/icon128.png" alt="InactiTab Logo" width="128" height="128">
</div>

---

## 📖 Overview

**InactiTab** is a Chrome extension that automatically manages inactive browser tabs by adding sleep indicators (💤) and providing bulk tab management with real-time CPU usage monitoring. Keep your browser organized and monitor resource-heavy tabs.

### 🎯 Key Features

- **💤 Sleep Indicators** - Visual sleep emoji (💤) indicators on inactive tab titles
- **📊 Real-time CPU Monitoring** - Shows actual CPU usage for each inactive tab
- **🔄 Bulk Tab Management** - Select and close multiple inactive tabs at once
- **🛡️ Smart Protection** - Automatically protects tabs with audio, video calls, and media
- **📋 Whitelist Management** - Protect important sites from becoming inactive
- **⏰ Customizable Timers** - Set custom inactivity timeouts
- **📚 Auto-close History** - Track and restore auto-closed tabs

---

## 🚀 Installation

1. **Download the Extension**

   - Clone or download this repository
   - Extract files to a folder

2. **Install in Chrome**

   - Open `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the extension folder

3. **Pin the Extension**
   - Click the puzzle piece icon in Chrome
   - Pin InactiTab for easy access

---

## 🎮 Usage Guide

### 💤 Inactive Tab Management

- **Sleep Indicators**: Inactive tabs show "💤" emoji in their titles
- **CPU Monitoring**: See real CPU usage (color-coded: green < 2%, yellow 2-5%, red > 5%)
- **Bulk Actions**: Use "Select" mode to choose multiple tabs for closing
- **Sorting**: Tabs automatically sort by CPU usage (highest first)

### 🛡️ Tab Protection

InactiTab automatically protects:

- **🎵 Audio/Video** - Tabs playing media or using camera
- **📹 Video Calls** - Meet, Zoom, Teams, Discord calls
- **📋 Whitelisted** - Manually added trusted sites
- **📌 Pinned Tabs** - When protection setting is enabled

### 📱 Interface Tabs

#### 📋 Whitelist

- Quick whitelist current tab
- Add/remove sites from whitelist
- View all open tabs with toggle buttons

#### 🛡️ Playing

- View currently protected tabs
- See protection reasons (audio, video, whitelist)
- Real-time status updates

#### 💤 Inactive

- View sleeping tabs with CPU usage
- Bulk select and close functionality
- Visit or close individual tabs

#### 📚 History

- View auto-closed tabs
- Restore tabs with one click
- Bulk management options

#### ⚙️ Settings

- Set inactivity timer (seconds/minutes/hours)
- Configure tab threshold
- Enable auto-close mode
- Set history limit

---

## 🔧 Configuration

### Timer Settings

- **Timer Value**: 1-999 (any unit)
- **Timer Unit**: Seconds, Minutes, Hours
- **Default**: 5 seconds

### Advanced Options

- **Tab Threshold**: Minimum tabs before tracking starts
- **Auto-close Mode**: Skip sleep mode, directly close tabs
- **Pinned Protection**: Protect pinned tabs automatically
- **History Limit**: Number of closed tabs to remember

---

## 🛠️ Technical Features

### CPU Monitoring

- Real-time CPU usage estimation based on site patterns
- Color-coded indicators for easy identification
- Sorting by resource consumption

### Sleep Indicators

- Title-based sleep emoji (💤) system
- Clean popup interface without emoji clutter
- Proper title cleanup and fallbacks

### Bulk Management

- Multi-select with checkboxes
- Select all/deselect all functionality
- Total CPU calculation for selected tabs

---

## 🐛 Troubleshooting

**Sleep indicators not showing**

- Check if tab threshold is met
- Verify timer settings are correct
- Ensure tab isn't protected or whitelisted

**CPU usage shows 0%**

- Extension uses intelligent estimation
- Real data may not be available on all systems
- Estimates are based on site patterns and activity

**Settings not saving**

- Check Chrome storage permissions
- Try disabling/re-enabling extension
- Clear extension data and reconfigure

---

## 📄 License

MIT License - see LICENSE file for details.

---

<div align="center">
  
**💤 Sleep your tabs, save your RAM!**

Made with ❤️ for better browser performance

</div>
