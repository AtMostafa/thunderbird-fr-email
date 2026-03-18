// compose_script.js
// Injected into compose window via composeScripts API; handles translate button click.

console.log("compose_script.js loaded");

function splitBodyAndSignature(body, isHtml) {
  if (isHtml) {
    const hrMatch = body.match(/<hr[\s>\/]/i);
    if (hrMatch) {
      return {
        main: body.substring(0, hrMatch.index),
        signature: body.substring(hrMatch.index)
      };
    }
  } else {
    // RFC 3676 signature delimiter: "-- " on its own line
    const sigIndex = body.indexOf("\n-- ");
    if (sigIndex !== -1) {
      return {
        main: body.substring(0, sigIndex),
        signature: body.substring(sigIndex)
      };
    }
  }
  return { main: body, signature: "" };
}

let isTranslating = false;

async function handleTranslateClick(tab) {
  if (isTranslating) return;
  isTranslating = true;
  try {
    const details = await messenger.compose.getComposeDetails(tab.id);
    const isHtml = !details.isPlainText;

    const mode = isHtml
      ? { bodyText: details.body, separator: "<hr><p><em>Automatically translated from English.</em></p>", updateKey: "body" }
      : { bodyText: details.plainTextBody, separator: "\n\n---\nAutomatically translated from English.\n\n", updateKey: "plainTextBody" };

    const { main, signature } = splitBodyAndSignature(mode.bodyText, isHtml);

    const response = await messenger.runtime.sendMessage({ type: "translate", text: main, isHtml });
    if (!response.success) {
      throw new Error(response.error);
    }

    await messenger.compose.setComposeDetails(tab.id, {
      [mode.updateKey]: `${response.translated}${mode.separator}${main}${signature}`
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
}

messenger.composeAction.onClicked.addListener(handleTranslateClick);
