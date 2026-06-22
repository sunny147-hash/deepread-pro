document.addEventListener("DOMContentLoaded", () => {
    const toggle = document.getElementById("toggleSwitch");
  
    chrome.storage.sync.get("enabled", (res) => {
      toggle.checked = res.enabled ?? true;
    });
  
    toggle.addEventListener("change", () => {
      chrome.storage.sync.set({ enabled: toggle.checked });
    });
  });
  