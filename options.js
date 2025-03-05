// Function to load saved IP-name associations
function loadSavedIpNames() {
  chrome.storage.sync.get('ipNames', function(data) {
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
  
  entryDiv.innerHTML = `
    <input type="text" class="ip-input" placeholder="Indirizzo IP" value="${ip}" maxlength="45">
    <input type="text" class="name-input" placeholder="Nome" value="${name}" maxlength="10">
    <button class="delete-btn">Elimina</button>
    <div class="error"></div>
  `;
  
  container.appendChild(entryDiv);
  
  // Add event listener to the delete button
  entryDiv.querySelector('.delete-btn').addEventListener('click', function() {
    entryDiv.remove();
    saveEntries();
  });
  
  // Add event listener to the inputs to save automatically
  const inputs = entryDiv.querySelectorAll('input');
  inputs.forEach(input => {
    input.addEventListener('change', saveEntries);
  });
}

// Function to add a new empty entry
function addNewEntry() {
  const container = document.getElementById('ip-entries');
  const currentEntries = container.querySelectorAll('.ip-entry');
  addEntryToUI('', '', currentEntries.length);
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
      // Simple IP validation (could be improved)
      const ipPattern = /^(\d{1,3}\.){3}\d{1,3}$|^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
      if (!ipPattern.test(ip)) {
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
      status.textContent = 'Settings saved!';
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