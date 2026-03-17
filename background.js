// background.js
// Handles translation requests and messaging

console.log("background.js loaded");

// Register compose_script.js for compose windows
messenger.composeScripts.register({
  js: [{ file: "compose_script.js" }]
});

async function translateText(text) {
  // Retrieve Deepl API key from storage
  const { deeplApiKey } = await browser.storage.local.get("deeplApiKey");
  if (!deeplApiKey) {
    throw new Error("Deepl API key not set.");
  }

  // Deepl API endpoint
  const url = "https://api.deepl.com/v2/translate";
  const body = JSON.stringify({
    text: [text],
    target_lang: "FR"
  });

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `DeepL-Auth-Key ${deeplApiKey}`,
      "Content-Type": "application/json"
    },
    body
  });

  if (!response.ok) {
    throw new Error("Translation failed.");
  }

  const data = await response.json();
  return data.translations[0].text;
}

browser.runtime.onMessage.addListener(async (message, sender) => {
  if (message.type === "translate") {
    try {
      const translated = await translateText(message.text);
      return Promise.resolve({ success: true, translated });
    } catch (error) {
      return Promise.resolve({ success: false, error: error.message });
    }
  }
});
