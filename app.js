document.addEventListener('DOMContentLoaded', function() {

  chrome.tabs.query({
    'active': true,
    'lastFocusedWindow': true
  }, function(tabs) {

    let url = tabs[0].url; //Get current url
    let parser = document.createElement('a');
    parser.href = url;
    let urlFetch = 'http://ip-api.com/json/' + parser.hostname; //url to fetch

    let copyField = document.querySelector('#copyField');
    let nameDisplay = document.querySelector('#nameDisplay');
    let optionsLink = document.querySelector('#optionsLink');

    function copyToClipboard() {
        copyField.select();
        document.execCommand("copy");
        
        // Aggiungere feedback visivo quando l'IP viene copiato
        const originalValue = copyField.value;
        copyField.value = "Copiato!";
        copyField.style.color = "#4CAF50";
        
        setTimeout(() => {
            copyField.value = originalValue;
            copyField.style.color = "#000";
        }, 1000);
    }

    // Aggiungere event listener per il link alle opzioni
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
        
        // Controllare se l'IP corrisponde a uno di quelli salvati
        chrome.storage.sync.get('ipNames', function(data) {
          const ipNames = data.ipNames || [];
          const matchingEntry = ipNames.find(entry => entry.ip === currentIp);
          
          if (matchingEntry) {
            nameDisplay.textContent = matchingEntry.name;
            nameDisplay.style.display = 'block';
          } else {
            nameDisplay.style.display = 'none';
          }
        });
        
        // Aggiungere l'event listener solo al campo copyField invece che all'intero documento
        copyField.addEventListener('click', copyToClipboard, false);
      })
      .catch(err => {
        console.log(err);
        copyField.value = "Errore";
        nameDisplay.textContent = "Impossibile recuperare l'IP";
        nameDisplay.style.display = "block";
        nameDisplay.style.color = "#f44336";
      });

  });

}, false);