// background.js
// Registers compose script and handles DeepL translation requests.

console.log("background.js loaded");

messenger.composeScripts.register({
  js: [{ file: "compose_script.js" }]
});

// Cache the API key so translateText doesn't hit storage on every call.
let cachedApiKey = null;
const keyReady = messenger.storage.local.get("deeplApiKey").then(({ deeplApiKey }) => {
  cachedApiKey = deeplApiKey || null;
});

messenger.storage.onChanged.addListener((changes) => {
  if ("deeplApiKey" in changes) {
    cachedApiKey = changes.deeplApiKey.newValue || null;
  }
});

async function translateText(text, isHtml) {
  await keyReady; // no-op after the first storage read resolves
  if (!cachedApiKey) {
    throw new Error("DeepL API key not set. Please configure it in the add-on options.");
  }

  const payload = {
    text: [text],
    target_lang: "FR"
  };

  if (isHtml) {
    payload.tag_handling = "html";
  }

  const response = await fetch("https://api.deepl.com/v2/translate", {
    method: "POST",
    headers: {
      "Authorization": `DeepL-Auth-Key ${cachedApiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`DeepL API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data.translations[0].text;
}

messenger.runtime.onMessage.addListener(async (message) => {
  if (message.type === "translate") {
    try {
      const translated = await translateText(message.text, message.isHtml);
      return { success: true, translated };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
});
