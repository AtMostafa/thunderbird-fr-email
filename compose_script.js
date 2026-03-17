// compose_script.js
// Injected into compose window, handles button click and modifies email body

console.log("compose_script.js loaded");

function splitBodyAndSignature(body) {
  console.log("splitBodyAndSignature called with body:", body);
  const sigSeparator = "\n-- ";
  const htmlSeparator = /<hr\s*\/?>/i;

  let main = body;
  let signature = "";

  const sigIndex = body.indexOf(sigSeparator);
  if (sigIndex !== -1) {
    main = body.substring(0, sigIndex);
    signature = body.substring(sigIndex);
    console.log("Signature found with -- separator.");
    return { main, signature };
  }

  const htmlMatch = body.match(htmlSeparator);
  if (htmlMatch) {
    const htmlIndex = body.indexOf(htmlMatch[0]);
    main = body.substring(0, htmlIndex);
    signature = body.substring(htmlIndex);
    console.log("Signature found with <hr> separator.");
    return { main, signature };
  }

  console.log("No signature separator found.");
  return { main: body, signature: "" };
}

async function handleTranslateClick() {
  console.log("handleTranslateClick called");
  try {
    const tab = await messenger.compose.getCurrentTab();
    console.log("Current compose tab:", tab);
    const details = await messenger.compose.getComposeDetails(tab.id);
    console.log("Compose details:", details);
    const originalText = details.body;
    console.log("Original text:", originalText);
    const { main, signature } = splitBodyAndSignature(originalText);
    const response = await messenger.runtime.sendMessage({
      type: "translate",
      text: main
    });
    console.log("Translation response:", response);
    if (response.success) {
      const frenchText = response.translated;
      let newBody = `${frenchText}\n\n---\nAutomatically translated from English.\n\n${main}`;
      if (signature) {
        newBody += `\n${signature}`;
      }
      await messenger.compose.setComposeDetails(tab.id, { body: newBody });
      console.log("Body updated with translation.");
    } else {
      messenger.notifications.create({
        type: "basic",
        title: "Translation Error",
        message: response.error
      });
      console.error("Translation error:", response.error);
    }
  } catch (err) {
    console.error("Error in compose_script handler:", err);
  }
}

messenger.composeAction.onClicked.addListener(() => {
  console.log("composeAction button clicked");
  handleTranslateClick();
});
