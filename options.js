// Funzione per caricare le associazioni IP-nome salvate
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

// Funzione per aggiungere una nuova voce all'interfaccia
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
  
  // Aggiungere event listener al pulsante di eliminazione
  entryDiv.querySelector('.delete-btn').addEventListener('click', function() {
    entryDiv.remove();
    saveEntries();
  });
  
  // Aggiungere event listener agli input per salvare automaticamente
  const inputs = entryDiv.querySelectorAll('input');
  inputs.forEach(input => {
    input.addEventListener('change', saveEntries);
  });
}

// Funzione per aggiungere una nuova voce vuota
function addNewEntry() {
  const container = document.getElementById('ip-entries');
  const currentEntries = container.querySelectorAll('.ip-entry');
  addEntryToUI('', '', currentEntries.length);
}

// Funzione per salvare tutte le voci
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
    
    // Validazione
    errorDiv.textContent = '';
    if (ip && name) {
      // Validazione semplice dell'IP (potrebbe essere migliorata)
      const ipPattern = /^(\d{1,3}\.){3}\d{1,3}$|^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
      if (!ipPattern.test(ip)) {
        errorDiv.textContent = 'Formato IP non valido';
        hasError = true;
      } else if (name.length > 10) {
        errorDiv.textContent = 'Il nome deve essere max 10 caratteri';
        hasError = true;
      } else {
        ipNames.push({ ip, name });
      }
    }
  });
  
  if (!hasError) {
    chrome.storage.sync.set({ ipNames }, function() {
      const status = document.getElementById('status');
      status.textContent = 'Impostazioni salvate!';
      setTimeout(() => { status.textContent = ''; }, 1500);
    });
  }
}

// Inizializzazione
document.addEventListener('DOMContentLoaded', function() {
  loadSavedIpNames();
  
  document.getElementById('add-new').addEventListener('click', function() {
    addNewEntry();
  });
}); 