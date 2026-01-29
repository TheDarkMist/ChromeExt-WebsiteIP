document.addEventListener('DOMContentLoaded', function() {

  chrome.tabs.query({
    'active': true,
    'lastFocusedWindow': true
  }, function(tabs) {

    let url = tabs[0].url; //Get current url
    let parser = document.createElement('a');
    parser.href = url;
    let urlFetch = 'https://ip-api.com/json/' + encodeURIComponent(parser.hostname); //url to fetch (HTTPS for security)

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

    fetch(urlFetch)
      .then(res => res.json())
      .then((output) => {
        const currentIp = output.query;
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
      })
      .catch(err => {
        copyField.value = "Error";
        nameDisplay.textContent = "Failed to retrieve the IP";
        nameDisplay.style.display = "block";
        nameDisplay.style.color = "#f44336";
      });

  });

}, false);