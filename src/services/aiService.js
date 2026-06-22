import { buildExplainPrompt } from '../prompts/explainPrompt.js';
import { buildLearningPanelPrompt } from '../prompts/panelPrompt.js';
import {
  buildLearningFeedbackPrompt,
  buildLearningQuestionPrompt,
} from '../prompts/learningPrompt.js';
import {
  getAISettings,
  getCachedAIExplanation,
  saveCachedAIExplanation,
} from './storageService.js';

let requestCount = 0;

const API_URL = 'https://ark.cn-beijing.volces.com/api/v3/responses';

async function requestAI(promptText, { cacheKey, cachePayload } = {}) {
  const { aiApiKey, aiModel } = await getAISettings();
  if (!aiApiKey) {
    return 'Set AI API Key in DeepRead settings first.';
  }

  if (cacheKey && cachePayload) {
    const cached = await getCachedAIExplanation(cacheKey, cachePayload, aiModel);
    if (cached) {
      console.log('DeepRead AI cache hit', { cacheKey });
      return cached;
    }
  }

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${aiApiKey}`,
    },
    body: JSON.stringify({
      model: aiModel,
      input: [
        {
          role: 'user',
          content: [
            {
              type: 'input_text',
              text: promptText,
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('API HTTP Error:', { status: response.status, body: errorText });
    throw new Error(`API Error ${response.status}`);
  }

  const json = await response.json();
  console.log('AI Raw Response:', json);

  const content = json?.output?.[1]?.content[0]?.text?.trim();
  if (!content) throw new Error('Empty AI response');

  if (cacheKey && cachePayload) {
    await saveCachedAIExplanation(cacheKey, cachePayload, aiModel, content);
  }

  return content;
}

function parseJsonObject(text) {
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('AI response is not JSON');
    return JSON.parse(match[0]);
  }
}

export async function fetchAIExplanation(word, context) {
  requestCount += 1;
  console.log(`DeepRead AI request #${requestCount}`, { word });

  const startTime = Date.now();

  try {
    const content = await requestAI(buildExplainPrompt(word, context), {
      cacheKey: word,
      cachePayload: context,
    });

    console.log(`DeepRead AI time: ${Date.now() - startTime}ms`);
    return content;
  } catch (error) {
    console.error('AI Request Failed:', error);
    return 'AI is temporarily unavailable. Please try again later.';
  }
}

export async function fetchLearningQuestion(word, context) {
  try {
    return await requestAI(buildLearningQuestionPrompt(word, context));
  } catch (error) {
    console.error('Learning Question Failed:', error);
    return 'AI learning question is temporarily unavailable.';
  }
}

export async function fetchLearningPanel(word, context) {
  try {
    const content = await requestAI(buildLearningPanelPrompt(word, context), {
      cacheKey: `panel:${word}`,
      cachePayload: context,
    });
    const panel = parseJsonObject(content);

    return {
      oneLineMeaning: panel.oneLineMeaning || '',
      contextExplanation: panel.contextExplanation || '',
      sentenceLogic: Array.isArray(panel.sentenceLogic) ? panel.sentenceLogic : [],
      whyDifficult: panel.whyDifficult || '',
      topicTags: Array.isArray(panel.topicTags) ? panel.topicTags : [],
    };
  } catch (error) {
    console.error('Learning Panel Failed:', error);
    return {
      oneLineMeaning: '',
      contextExplanation: 'AI learning panel is temporarily unavailable.',
      sentenceLogic: [],
      whyDifficult: '',
      topicTags: [],
    };
  }
}

export async function fetchLearningFeedback(word, context, question, answer) {
  try {
    return await requestAI(buildLearningFeedbackPrompt(word, context, question, answer));
  } catch (error) {
    console.error('Learning Feedback Failed:', error);
    return 'AI feedback is temporarily unavailable.';
  }
}
