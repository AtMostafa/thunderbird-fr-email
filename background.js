// background.js
// Handles compose action button click, translation via DeepL, and body update.

console.log("background.js loaded");

// Cache the API key to avoid a storage read on every translation.
let cachedApiKey = null;
const keyReady = messenger.storage.local.get("deeplApiKey").then(({ deeplApiKey }) => {
  cachedApiKey = deeplApiKey || null;
});

messenger.storage.onChanged.addListener((changes) => {
  if ("deeplApiKey" in changes) {
    cachedApiKey = changes.deeplApiKey.newValue || null;
  }
});

// Free-plan keys end with ":fx" and require a different base URL.
function getApiUrl(apiKey) {
  return apiKey.endsWith(":fx")
    ? "https://api-free.deepl.com/v2/translate"
    : "https://api.deepl.com/v2/translate";
}

function splitBodyAndSignature(body, isHtml) {
  if (isHtml) {
    const hrMatch = body.match(/<hr[\s>\/]/i);
    if (hrMatch) {
      return { main: body.substring(0, hrMatch.index), signature: body.substring(hrMatch.index) };
    }
  } else {
    const sigIndex = body.indexOf("\n-- ");
    if (sigIndex !== -1) {
      return { main: body.substring(0, sigIndex), signature: body.substring(sigIndex) };
    }
  }
  return { main: body, signature: "" };
}

async function translateText(text, isHtml) {
  await keyReady;
  if (!cachedApiKey) {
    throw new Error("DeepL API key not set. Please configure it in the add-on options.");
  }

  const payload = { text: [text], target_lang: "FR" };
  if (isHtml) {
    payload.tag_handling = "html";
  }

  const response = await fetch(getApiUrl(cachedApiKey), {
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

let isTranslating = false;

messenger.composeAction.onClicked.addListener(async (tab) => {
  if (isTranslating) return;
  isTranslating = true;
  try {
    const details = await messenger.compose.getComposeDetails(tab.id);
    const isHtml = !details.isPlainText;

    const mode = isHtml
      ? {
          bodyText: details.body,
          header: "<p><em>Traduit automatiquement de l'anglais :</em></p>",
          divider: "<hr>",
          originalLabel: "<p><em>Texte original en anglais :</em></p>",
          updateKey: "body"
        }
      : {
          bodyText: details.plainTextBody,
          header: "Traduit automatiquement de l'anglais : \n\n",
          divider: "\n\n---\n\n",
          originalLabel: "Texte original en anglais :\n\n",
          updateKey: "plainTextBody"
        };

    const { main, signature } = splitBodyAndSignature(mode.bodyText, isHtml);
    const translated = await translateText(main, isHtml);

    await messenger.compose.setComposeDetails(tab.id, {
      [mode.updateKey]: `${mode.header}${translated}${mode.divider}${mode.originalLabel}${main}${signature}`
    });

    console.log("Body updated with translation.");
  } catch (err) {
    console.error("Translation failed:", err);
    await messenger.notifications.create({
      type: "basic",
      title: "Translation Error",
      message: err.message || "An unknown error occurred."
    });
  } finally {
    isTranslating = false;
  }
});
