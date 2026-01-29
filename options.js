// Function to load saved IP-name associations
function loadSavedIpNames() {
  chrome.storage.sync.get('ipNames', function(data) {
    if (chrome.runtime.lastError) {
      return;
    }
    const ipNames = data.ipNames || [];
    const container = document.getElementById('ip-entries');
    container.innerHTML = '';

    if (ipNames.length === 0) {
      addNewEntry();
    } else {
      ipNames.forEach((entry, index) => {
        addEntryToUI(entry.ip, entry.name, index);
      });
    }
  });
}

// Function to add a new entry to the interface
function addEntryToUI(ip = '', name = '', index) {
  const container = document.getElementById('ip-entries');
  const entryDiv = document.createElement('div');
  entryDiv.className = 'ip-entry';
  entryDiv.dataset.index = index;

  // Create elements programmatically to prevent XSS
  const ipInput = document.createElement('input');
  ipInput.type = 'text';
  ipInput.className = 'ip-input';
  ipInput.placeholder = 'Indirizzo IP';
  ipInput.value = ip;
  ipInput.maxLength = 45;

  const nameInput = document.createElement('input');
  nameInput.type = 'text';
  nameInput.className = 'name-input';
  nameInput.placeholder = 'Nome';
  nameInput.value = name;
  nameInput.maxLength = 10;

  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'delete-btn';
  deleteBtn.textContent = 'Elimina';

  const errorDiv = document.createElement('div');
  errorDiv.className = 'error';

  entryDiv.appendChild(ipInput);
  entryDiv.appendChild(nameInput);
  entryDiv.appendChild(deleteBtn);
  entryDiv.appendChild(errorDiv);

  container.appendChild(entryDiv);

  // Add event listener to the delete button
  deleteBtn.addEventListener('click', function() {
    entryDiv.remove();
    saveEntries();
  });

  // Add event listener to the inputs to save automatically
  ipInput.addEventListener('change', saveEntries);
  nameInput.addEventListener('change', saveEntries);
}

// Function to add a new empty entry
function addNewEntry() {
  const container = document.getElementById('ip-entries');
  const currentEntries = container.querySelectorAll('.ip-entry');
  addEntryToUI('', '', currentEntries.length);
}

// Validate IPv4 address with proper octet range check
function isValidIPv4(ip) {
  const parts = ip.split('.');
  if (parts.length !== 4) return false;
  return parts.every(part => {
    const num = parseInt(part, 10);
    return !isNaN(num) && num >= 0 && num <= 255 && part === num.toString();
  });
}

// Validate IPv6 address (supports full and compressed formats)
function isValidIPv6(ip) {
  // Full IPv6 or compressed format
  const ipv6Pattern = /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]+|::(ffff(:0{1,4})?:)?((25[0-5]|(2[0-4]|1?[0-9])?[0-9])\.){3}(25[0-5]|(2[0-4]|1?[0-9])?[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1?[0-9])?[0-9])\.){3}(25[0-5]|(2[0-4]|1?[0-9])?[0-9]))$/;
  return ipv6Pattern.test(ip);
}

// Function to save all entries
function saveEntries() {
  const entries = document.querySelectorAll('.ip-entry');
  const ipNames = [];
  let hasError = false;

  entries.forEach(entry => {
    const ipInput = entry.querySelector('.ip-input');
    const nameInput = entry.querySelector('.name-input');
    const errorDiv = entry.querySelector('.error');

    const ip = ipInput.value.trim();
    const name = nameInput.value.trim();

    // Validation
    errorDiv.textContent = '';
    if (ip && name) {
      // Proper IP validation for IPv4 and IPv6
      if (!isValidIPv4(ip) && !isValidIPv6(ip)) {
        errorDiv.textContent = 'Invalid IP format';
        hasError = true;
      } else if (name.length > 10) {
        errorDiv.textContent = 'The name must be max 10 characters';
        hasError = true;
      } else {
        ipNames.push({ ip, name });
      }
    }
  });

  if (!hasError) {
    chrome.storage.sync.set({ ipNames }, function() {
      const status = document.getElementById('status');
      if (chrome.runtime.lastError) {
        status.textContent = 'Error saving settings';
        status.style.color = '#f44336';
        setTimeout(() => {
          status.textContent = '';
          status.style.color = '';
        }, 1500);
        return;
      }
      status.textContent = 'Settings saved!';
      status.style.color = '';
      setTimeout(() => { status.textContent = ''; }, 1500);
    });
  }
}

// Initialization
document.addEventListener('DOMContentLoaded', function() {
  loadSavedIpNames();
  
  document.getElementById('add-new').addEventListener('click', function() {
    addNewEntry();
  });
}); 