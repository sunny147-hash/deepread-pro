import { getVocabularyByLevel, importDictionaryToDB, isDBEmpty } from '../utils/db.js';

export { getVocabularyByLevel, importDictionaryToDB, isDBEmpty };

const DEFAULT_USER_LEVEL = 1;
const DEFAULT_MIN_LENGTH = 7;

async function ensureDictionaryLoaded({ forceReset = false } = {}) {
  const empty = await isDBEmpty();

  if (!empty && !forceReset) {
    console.log('DeepRead: dictionary DB is ready.');
    return;
  }

  console.log('DeepRead: loading dictionary into DB...');
  const url = chrome.runtime.getURL('dictionary.json') + '?t=' + Date.now();
  const response = await fetch(url);
  const jsonData = await response.json();
  await importDictionaryToDB(jsonData);
}

function shouldShowVocabularyItem(item, userLevel, minLength) {
  if (!item || !item.word) return false;

  const level = item.l !== undefined ? item.l : -1;

  if (level > 0) {
    return level >= userLevel;
  }

  return item.word.length >= minLength;
}

export async function loadHighlightVocabulary({
  userLevel = DEFAULT_USER_LEVEL,
  minLength = DEFAULT_MIN_LENGTH,
  forceReset = false,
} = {}) {
  await ensureDictionaryLoaded({ forceReset });

  console.log(`DeepRead: filtering vocabulary (Level ${userLevel}+ or length ${minLength}+)...`);
  const rawData = await getVocabularyByLevel(-1);
  const items = Array.isArray(rawData) ? rawData : Object.values(rawData);
  const vocabulary = {};

  items.forEach((item) => {
    if (!shouldShowVocabularyItem(item, userLevel, minLength)) return;
    vocabulary[item.word.toLowerCase()] = item;
  });

  console.log(`DeepRead: vocabulary filtered from ${items.length} to ${Object.keys(vocabulary).length}.`);
  return vocabulary;
}
