# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Website IP is a Chrome Extension (Manifest V3) that displays the IP address of the currently active website. It uses DNS-over-HTTPS (DoH) services for resolution and allows users to save custom names for specific IP addresses.

Published at:
- Chrome: https://chrome.google.com/webstore/detail/get-website-ip/dmgahoocbgdiidmbmihphakakdddgoof

## Development

**Load the extension locally:**
1. Go to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked" and select this directory

**Test changes:** Reload the extension from `chrome://extensions/` after modifying files.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     manifest.json (MV3)                     │
├─────────────────────────────────────────────────────────────┤
│  Popup (index.html + app.js)    │  Options (options.html +  │
│  - Fetches IP via ip-api.com    │           options.js)     │
│  - Displays IP with copy func   │  - Manage IP-name pairs   │
│  - Shows matched name from      │  - Validates IP format    │
│    chrome.storage.sync          │  - Saves to sync storage  │
├─────────────────────────────────┴───────────────────────────┤
│                  background.js (Service Worker)             │
│  - DNS resolution via DoH (Google DNS, Cloudflare fallback) │
│  - Updates badge when IP matches saved entries              │
│  - Listens: tabs.onActivated, tabs.onUpdated                │
└─────────────────────────────────────────────────────────────┘
```

**Data flow:**
- `app.js` uses `ip-api.com/json/{hostname}` for popup IP display
- `background.js` uses DoH endpoints (`dns.google/resolve`, `cloudflare-dns.com/dns-query`) for badge updates
- IP-name associations stored in `chrome.storage.sync` under key `ipNames` as `[{ip, name}, ...]`

## Key Implementation Details

- Badge shows first 3 characters of matched name with orange background
- DoH requests include `Accept: application/dns-json` header for Cloudflare
- IP validation regex supports both IPv4 and IPv6 formats
- Name field limited to 10 characters max
