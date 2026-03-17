// compose.js
// Minimal compose script for Thunderbird add-on

console.log("compose.js loaded");

messenger.composeAction.onClicked.addListener(() => {
  console.log("composeAction button clicked in compose.js");
});
