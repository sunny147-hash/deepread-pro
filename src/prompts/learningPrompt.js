export function buildLearningQuestionPrompt(word, context) {
  return `
你是一个英语主动学习教练。

请基于用户正在学习的英文内容，提出 1 个简短问题，帮助用户主动回忆和理解。

要求：
1. 问题用中文提出。
2. 问题要围绕英文含义、语境、用法或近义表达。
3. 不要直接给答案。
4. 不要输出 Markdown。
5. 控制在 60 字以内。

英文内容:${word}
上下文:${context || word}
`;
}

export function buildLearningFeedbackPrompt(word, context, question, answer) {
  return `
你是一个英语主动学习教练。

请根据学习内容、问题和用户回答，给出简短反馈。

要求：
1. 先判断回答是否基本正确。
2. 如果不完整，补充正确理解。
3. 用中文说明。
4. 不要输出 Markdown。
5. 控制在 100 字以内。

英文内容:${word}
上下文:${context || word}
问题:${question}
用户回答:${answer}
`;
}
