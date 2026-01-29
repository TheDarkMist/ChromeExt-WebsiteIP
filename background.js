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
        continue; // Try next endpoint
      }
      const data = await response.json();
      if (data.Answer && data.Answer.length > 0) {
        // Return the first A record found
        const ips = data.Answer.filter(record => record.type === 1).map(record => record.data);
        if (ips.length > 0) {
          return ips; // Return all resolved IPs
        }
      }
    } catch (error) {
      // Continue to next endpoint on error
    }
  }
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
        foundMatch = true;
        break; // Stop after first match
      }
    }

    if (!foundMatch) {
      chrome.action.setBadgeText({ text: '', tabId: tabId });
    }
  } catch (error) {
    // Handle potential errors like the tab being closed before we process it
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
  updateBadgeForTab(activeInfo.tabId);
});

// Listen for tab URL updates
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // Update only when the URL changes and the tab is fully loaded
  if (changeInfo.url && tab.status === 'complete') {
    updateBadgeForTab(tabId);
  } else if (changeInfo.status === 'complete' && tab.url) {
     // Also update if the tab finishes loading (e.g., after initial load)
     updateBadgeForTab(tabId);
  }
}); 