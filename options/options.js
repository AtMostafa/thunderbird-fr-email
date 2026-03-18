// options.js
// Handles saving and loading DeepL API key and target language

document.addEventListener("DOMContentLoaded", async () => {
  const apiKeyInput = document.getElementById("deeplApiKey");
  const targetLangSelect = document.getElementById("targetLang");
  const saveBtn = document.getElementById("saveBtn");
  const statusDiv = document.getElementById("status");

  const { deeplApiKey, targetLang } = await messenger.storage.local.get(["deeplApiKey", "targetLang"]);
  if (deeplApiKey) {
    apiKeyInput.value = deeplApiKey;
  }
  targetLangSelect.value = targetLang || "FR";

  saveBtn.addEventListener("click", async () => {
    await messenger.storage.local.set({
      deeplApiKey: apiKeyInput.value.trim(),
      targetLang: targetLangSelect.value
    });
    statusDiv.textContent = "Settings saved.";
    setTimeout(() => { statusDiv.textContent = ""; }, 2000);
  });
});
