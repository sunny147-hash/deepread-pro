export const DEFAULT_AI_MODEL = 'doubao-seed-1-6-251015';
export const DEFAULT_HIGHLIGHT_USER_LEVEL = 1;
export const DEFAULT_HIGHLIGHT_MIN_LENGTH = 7;
const AI_CACHE_KEY = 'aiExplanationCache';
const AI_CACHE_LIMIT = 100;

function clampNumber(value, fallback, min, max) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, number));
}

export async function getAISettings() {
  const settings = await chrome.storage.local.get(['aiApiKey', 'aiModel']);
  return {
    aiApiKey: settings.aiApiKey?.trim() || '',
    aiModel: settings.aiModel?.trim() || DEFAULT_AI_MODEL,
  };
}

export function saveAISettings(settings, callback) {
  chrome.storage.local.set({
    aiApiKey: settings.aiApiKey?.trim() || '',
    aiModel: settings.aiModel?.trim() || DEFAULT_AI_MODEL,
  }, callback);
}

export async function getHighlightSettings() {
  const settings = await chrome.storage.local.get(['highlightUserLevel', 'highlightMinLength']);
  return {
    highlightUserLevel: clampNumber(settings.highlightUserLevel, DEFAULT_HIGHLIGHT_USER_LEVEL, 0, 5),
    highlightMinLength: clampNumber(settings.highlightMinLength, DEFAULT_HIGHLIGHT_MIN_LENGTH, 1, 30),
  };
}

export function saveHighlightSettings(settings, callback) {
  chrome.storage.local.set({
    highlightUserLevel: clampNumber(settings.highlightUserLevel, DEFAULT_HIGHLIGHT_USER_LEVEL, 0, 5),
    highlightMinLength: clampNumber(settings.highlightMinLength, DEFAULT_HIGHLIGHT_MIN_LENGTH, 1, 30),
  }, callback);
}

function getCacheKey(word, context, model) {
  const text = `${model}\n${word}\n${context || ''}`;
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) {
    hash = ((hash << 5) - hash) + text.charCodeAt(i);
    hash |= 0;
  }
  return String(hash);
}

export async function getCachedAIExplanation(word, context, model) {
  const result = await chrome.storage.local.get([AI_CACHE_KEY]);
  const cache = result[AI_CACHE_KEY] || {};
  const item = cache[getCacheKey(word, context, model)];
  if (!item) return '';
  if (item.word !== word || item.context !== (context || '') || item.model !== model) return '';
  return item.value || '';
}

export async function saveCachedAIExplanation(word, context, model, value) {
  const result = await chrome.storage.local.get([AI_CACHE_KEY]);
  const cache = result[AI_CACHE_KEY] || {};
  const key = getCacheKey(word, context, model);

  cache[key] = {
    word,
    context: context || '',
    model,
    value,
    updatedAt: Date.now(),
  };

  const entries = Object.entries(cache)
    .sort((a, b) => b[1].updatedAt - a[1].updatedAt)
    .slice(0, AI_CACHE_LIMIT);

  await chrome.storage.local.set({ [AI_CACHE_KEY]: Object.fromEntries(entries) });
}
