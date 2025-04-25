// Define DoH endpoints
const DOH_ENDPOINTS = [
  'https://dns.google/resolve',
  'https://cloudflare-dns.com/dns-query'
];

// Function to get IP address from hostname using DoH
async function getIpFromHostname(hostname) {
  if (!hostname) return null;

  for (const endpoint of DOH_ENDPOINTS) {
    try {
      const url = endpoint.includes('cloudflare')
        ? `${endpoint}?name=${encodeURIComponent(hostname)}&type=A`
        : `${endpoint}?name=${encodeURIComponent(hostname)}&type=A`;

      const headers = endpoint.includes('cloudflare') ? { 'Accept': 'application/dns-json' } : {};

      const response = await fetch(url, { headers });
      if (!response.ok) {
        console.error(`DoH request failed for ${hostname} at ${endpoint}: ${response.status}`);
        continue; // Try next endpoint
      }
      const data = await response.json();
      if (data.Answer && data.Answer.length > 0) {
        // Return the first A record found
        const ips = data.Answer.filter(record => record.type === 1).map(record => record.data);
        if (ips.length > 0) {
          console.log(`Resolved ${hostname} to ${ips[0]} using ${endpoint}`);
          return ips; // Return all resolved IPs
        }
      }
    } catch (error) {
      console.error(`Error during DoH request for ${hostname} at ${endpoint}:`, error);
    }
  }
  console.warn(`Could not resolve IP for ${hostname} using any DoH endpoint.`);
  return null;
}

// Function to update badge based on IP match
async function updateBadgeForTab(tabId) {
  try {
    const tab = await chrome.tabs.get(tabId);
    if (!tab || !tab.url || !tab.url.startsWith('http')) {
      chrome.action.setBadgeText({ text: '', tabId: tabId });
      return; // Ignore if tab is not valid or not http/https
    }

    const url = new URL(tab.url);
    const hostname = url.hostname;

    const resolvedIps = await getIpFromHostname(hostname);
    if (!resolvedIps || resolvedIps.length === 0) {
        chrome.action.setBadgeText({ text: '', tabId: tabId });
        return; // Could not resolve IP
    }

    const data = await chrome.storage.sync.get('ipNames');
    const ipNames = data.ipNames || [];

    let foundMatch = false;
    for (const entry of ipNames) {
      if (entry.ip && entry.name && resolvedIps.includes(entry.ip)) {
        const badgeText = entry.name.substring(0, 3);
        chrome.action.setBadgeText({ text: badgeText, tabId: tabId });
        chrome.action.setBadgeBackgroundColor({ color: '#FFA500', tabId: tabId }); // Orange background
        console.log(`Badge set to '${badgeText}' for tab ${tabId} (IP: ${entry.ip})`);
        foundMatch = true;
        break; // Stop after first match
      }
    }

    if (!foundMatch) {
      chrome.action.setBadgeText({ text: '', tabId: tabId });
      console.log(`No matching IP found for tab ${tabId}, clearing badge.`);
    }
  } catch (error) {
    // Handle potential errors like the tab being closed before we process it
    if (error.message.includes("No tab with id") || error.message.includes("Invalid tab ID")) {
      console.log(`Tab ${tabId} closed before processing.`);
    } else {
        console.error(`Error updating badge for tab ${tabId}:`, error);
    }
    try {
        // Attempt to clear the badge anyway if an error occurred
        chrome.action.setBadgeText({ text: '', tabId: tabId });
    } catch (clearError) {
        // Ignore errors trying to clear badge for potentially non-existent tab
    }
  }
}

// Listen for tab activation changes
chrome.tabs.onActivated.addListener(activeInfo => {
  console.log(`Tab activated: ${activeInfo.tabId}`);
  updateBadgeForTab(activeInfo.tabId);
});

// Listen for tab URL updates
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // Update only when the URL changes and the tab is fully loaded
  if (changeInfo.url && tab.status === 'complete') {
    console.log(`Tab updated: ${tabId}, URL changed to: ${changeInfo.url}`);
    updateBadgeForTab(tabId);
  } else if (changeInfo.status === 'complete' && tab.url) {
     // Also update if the tab finishes loading (e.g., after initial load)
     console.log(`Tab updated: ${tabId}, Status complete.`);
     updateBadgeForTab(tabId);
  }
});

// Optional: Clear badge when a window is closed (might remove active tab's badge)
// chrome.windows.onRemoved.addListener(windowId => {
//   console.log(`Window closed: ${windowId}`);
//   // Potentially clear all badges or based on last active tab in that window?
// });

console.log('Background script loaded.'); 