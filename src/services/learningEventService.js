import { getTopicTags } from './topicService.js';

const EVENTS_KEY = 'learningEvents';
const MAX_EVENTS = 300;
const DAY_MS = 24 * 60 * 60 * 1000;

function normalizeWord(word) {
  return (word || '').trim().toLowerCase();
}

async function getEvents() {
  const result = await chrome.storage.local.get([EVENTS_KEY]);
  return Array.isArray(result[EVENTS_KEY]) ? result[EVENTS_KEY] : [];
}

async function saveEvents(events) {
  await chrome.storage.local.set({
    [EVENTS_KEY]: events
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, MAX_EVENTS),
  });
}

export async function recordLearningEvent({ type, word, context = '', duration = 0, topicTags = [] }) {
  const normalizedWord = normalizeWord(word);
  if (!normalizedWord || !type) return;

  const textForTags = `${word} ${context}`;
  const event = {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    type,
    word: normalizedWord,
    context,
    duration,
    topicTags: topicTags.length ? topicTags : getTopicTags(textForTags),
    createdAt: Date.now(),
  };

  const events = await getEvents();
  await saveEvents([event, ...events]);
}

export async function getRepeatCount(word, days = 7) {
  const normalizedWord = normalizeWord(word);
  if (!normalizedWord) return 0;

  const since = Date.now() - (days * DAY_MS);
  const events = await getEvents();
  return events.filter((event) => (
    event.type === 'query'
    && event.word === normalizedWord
    && event.createdAt >= since
  )).length;
}

export async function getLearningInsight(word, topicTags = []) {
  const repeatCount = await getRepeatCount(word, 7);
  if (repeatCount >= 3) {
    return `这个词你最近 7 天已经查过 ${repeatCount} 次。`;
  }

  const tags = topicTags.slice(0, 3);
  if (tags.length > 0) {
    return `你最近遇到的内容可能属于：${tags.join('、')}。`;
  }

  return '';
}
