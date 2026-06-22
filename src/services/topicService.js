const TOPIC_KEYWORDS = {
  AI: [
    'ai',
    'model',
    'prompt',
    'token',
    'inference',
    'synthetic data',
    'training',
    'openai',
    'llm',
  ],
  '商业': [
    'business',
    'market',
    'revenue',
    'strategy',
    'leverage',
    'growth',
    'customer',
  ],
  '金融': [
    'capital',
    'valuation',
    'liquidity',
    'yield',
    'asset',
    'debt',
    'equity',
  ],
  '工程': [
    'infrastructure',
    'deployment',
    'scalability',
    'latency',
    'architecture',
    'system',
    'compute',
  ],
};

export function getTopicTags(text) {
  const normalized = (text || '').toLowerCase();
  return Object.entries(TOPIC_KEYWORDS)
    .filter(([, keywords]) => keywords.some((keyword) => normalized.includes(keyword)))
    .map(([topic]) => topic);
}
