# AGENTS.md

## Project

AI English Learning Chrome Extension.

Main features:
- Translation
- AI explanation
- Vocabulary learning
- Popup interaction

---

## Tech Stack

- Chrome Extension Manifest V3
- JavaScript
- Minimal dependencies

---

## Important Rules

- Never delete files without permission
- Never rewrite working logic
- Never refactor unrelated code
- Never rename files unless requested
- Never change project structure automatically
- Preserve existing functionality
- Make minimal safe edits only

---

## File Structure

- public/manifest.json = extension config
- public/loader.js = content script loader
- sidepanel.html = side panel HTML entry
- src/background/index.js = background service worker
- src/content/index.jsx = page interaction and content UI bootstrap
- src/content/Highlighter.js = page vocabulary highlighting
- src/content/components/PopupCard.jsx = in-page popup card
- src/components/ActiveLearningBox.jsx = reusable active learning Q&A UI
- src/sidepanel/index.jsx = side panel UI
- src/services/aiService.js = AI request logic
- src/services/dictionaryService.js = dictionary loading and vocabulary filtering
- src/services/storageService.js = Chrome storage helpers
- src/prompts/explainPrompt.js = AI explanation prompt
- src/prompts/learningPrompt.js = active learning Q&A prompts
- src/utils/ai.js = compatibility export for AI service
- src/utils/db.js = IndexedDB dictionary utilities

---

## Coding Style

- Prefer simple readable code
- Avoid unnecessary abstraction
- Avoid large rewrites
- Reuse existing utilities first
- Use async/await

---

## Before Finishing

Check:
- extension still loads
- popup works
- no console errors
- AI requests still function
