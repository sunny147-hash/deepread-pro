import {
  fetchAIExplanation,
  fetchLearningFeedback,
  fetchLearningPanel,
  fetchLearningQuestion,
} from '../utils/ai.js';

console.log('DeepRead Background Service Started');

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'FETCH_AI_EXPLANATION') {
    (async () => {
      try {
        const result = await fetchAIExplanation(message.word, message.context);
        sendResponse({ success: true, data: result });
      } catch (error) {
        console.error("Message Handler Error:", error);
        sendResponse({ success: false, error: error?.message || "Unknown Error" });
      }
    })();
    return true;
  }

  if (message.action === 'FETCH_LEARNING_QUESTION') {
    (async () => {
      try {
        const result = await fetchLearningQuestion(message.word, message.context);
        sendResponse({ success: true, data: result });
      } catch (error) {
        console.error("Learning Question Handler Error:", error);
        sendResponse({ success: false, error: error?.message || "Unknown Error" });
      }
    })();
    return true;
  }

  if (message.action === 'FETCH_LEARNING_PANEL') {
    (async () => {
      try {
        const result = await fetchLearningPanel(message.word, message.context);
        sendResponse({ success: true, data: result });
      } catch (error) {
        console.error("Learning Panel Handler Error:", error);
        sendResponse({ success: false, error: error?.message || "Unknown Error" });
      }
    })();
    return true;
  }

  if (message.action === 'FETCH_LEARNING_FEEDBACK') {
    (async () => {
      try {
        const result = await fetchLearningFeedback(
          message.word,
          message.context,
          message.question,
          message.answer
        );
        sendResponse({ success: true, data: result });
      } catch (error) {
        console.error("Learning Feedback Handler Error:", error);
        sendResponse({ success: false, error: error?.message || "Unknown Error" });
      }
    })();
    return true;
  }
});

chrome.action.onClicked.addListener((tab) => {
  chrome.sidePanel.open({ tabId: tab.id });
});
