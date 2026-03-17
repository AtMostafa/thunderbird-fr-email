// options.js
// Handles saving and loading Deepl API key

document.addEventListener("DOMContentLoaded", async () => {
  const apiKeyInput = document.getElementById("deeplApiKey");
  const saveBtn = document.getElementById("saveBtn");
  const statusDiv = document.getElementById("status");

  // Load existing key
  const { deeplApiKey } = await browser.storage.local.get("deeplApiKey");
  if (deeplApiKey) {
    apiKeyInput.value = deeplApiKey;
  }

  saveBtn.addEventListener("click", async () => {
    const key = apiKeyInput.value.trim();
    await browser.storage.local.set({ deeplApiKey: key });
    statusDiv.textContent = "API key saved.";
    setTimeout(() => { statusDiv.textContent = ""; }, 2000);
  });
});
