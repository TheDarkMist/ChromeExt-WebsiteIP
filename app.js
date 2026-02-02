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

document.addEventListener('DOMContentLoaded', function() {

  chrome.tabs.query({
    'active': true,
    'lastFocusedWindow': true
  }, async function(tabs) {

    let copyField = document.querySelector('#copyField');
    let nameDisplay = document.querySelector('#nameDisplay');
    let optionsLink = document.querySelector('#optionsLink');

    async function copyToClipboard() {
        const textToCopy = copyField.value;
        try {
            await navigator.clipboard.writeText(textToCopy);

            // Add visual feedback when the IP is copied
            copyField.value = "Copied!";
            copyField.style.color = "#4CAF50";

            setTimeout(() => {
                copyField.value = textToCopy;
                copyField.style.color = "#000";
            }, 1000);
        } catch (err) {
            // Fallback for older browsers or if clipboard API fails
            copyField.select();
            document.execCommand("copy");

            copyField.value = "Copied!";
            copyField.style.color = "#4CAF50";

            setTimeout(() => {
                copyField.value = textToCopy;
                copyField.style.color = "#000";
            }, 1000);
        }
    }

    // Add event listener for the options link
    if (optionsLink) {
      optionsLink.addEventListener('click', function() {
        chrome.runtime.openOptionsPage();
      });
    }

    try {
      let url = tabs[0].url; //Get current url
      let parser = document.createElement('a');
      parser.href = url;
      const hostname = parser.hostname;

      // Check if it's a valid HTTP/HTTPS URL
      if (!url.startsWith('http')) {
        copyField.value = "N/A";
        nameDisplay.textContent = "Not a web page";
        nameDisplay.style.display = "block";
        nameDisplay.style.color = "#666";
        return;
      }

      // Resolve IP using DoH
      const resolvedIps = await getIpFromHostname(hostname);
      
      if (resolvedIps && resolvedIps.length > 0) {
        const currentIp = resolvedIps[0]; // Use the first IP
        copyField.value = currentIp;

        // Check if the IP matches any of the saved IPs
        chrome.storage.sync.get('ipNames', function(data) {
          if (chrome.runtime.lastError) {
            return;
          }
          const ipNames = data.ipNames || [];
          const matchingEntry = ipNames.find(entry => entry.ip === currentIp);

          if (matchingEntry) {
            nameDisplay.textContent = matchingEntry.name;
            nameDisplay.style.display = 'block';
          } else {
            nameDisplay.style.display = 'none';
          }
        });

        // Add event listener only to the copyField instead of the entire document
        copyField.addEventListener('click', copyToClipboard, false);
      } else {
        copyField.value = "N/A";
        nameDisplay.textContent = "Unable to resolve IP";
        nameDisplay.style.display = "block";
        nameDisplay.style.color = "#666";
      }
    } catch (err) {
      copyField.value = "Error";
      nameDisplay.textContent = "Failed to retrieve the IP";
      nameDisplay.style.display = "block";
      nameDisplay.style.color = "#f44336";
    }

  });

}, false);