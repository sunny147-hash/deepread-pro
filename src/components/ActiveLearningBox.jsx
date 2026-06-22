import React, { useState } from 'react';

const cardStyle = {
  backgroundColor: '#fff7ed',
  border: '1px solid #fed7aa',
  borderRadius: '8px',
  padding: '10px',
  marginTop: '10px',
};

const buttonStyle = {
  width: '100%',
  padding: '8px',
  border: 'none',
  borderRadius: '6px',
  backgroundColor: '#c2410c',
  color: '#fff',
  cursor: 'pointer',
  fontSize: '13px',
  fontWeight: '600',
};

const inputStyle = {
  width: '100%',
  boxSizing: 'border-box',
  minHeight: '56px',
  padding: '8px',
  border: '1px solid #fdba74',
  borderRadius: '6px',
  resize: 'vertical',
  fontSize: '13px',
  marginTop: '8px',
};

function sendMessage(payload) {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(payload, (response) => resolve(response));
  });
}

const ActiveLearningBox = ({ word, context }) => {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState('');
  const [loadingQuestion, setLoadingQuestion] = useState(false);
  const [loadingFeedback, setLoadingFeedback] = useState(false);

  const handleGenerateQuestion = async () => {
    if (!word) return;
    setLoadingQuestion(true);
    setFeedback('');

    const response = await sendMessage({
      action: 'FETCH_LEARNING_QUESTION',
      word,
      context,
    });

    setLoadingQuestion(false);
    setQuestion(response?.success ? response.data : 'Failed to generate a question.');
  };

  const handleSubmitAnswer = async () => {
    if (!word || !question || !answer.trim()) return;
    setLoadingFeedback(true);

    const response = await sendMessage({
      action: 'FETCH_LEARNING_FEEDBACK',
      word,
      context,
      question,
      answer,
    });

    setLoadingFeedback(false);
    setFeedback(response?.success ? response.data : 'Failed to check your answer.');
  };

  return (
    <div style={cardStyle}>
      <div style={{ fontSize: '12px', fontWeight: '700', color: '#9a3412', marginBottom: '6px' }}>
        Active Learning
      </div>

      {!question ? (
        <button onClick={handleGenerateQuestion} disabled={loadingQuestion || !word} style={buttonStyle}>
          {loadingQuestion ? 'Generating...' : 'Ask me a question'}
        </button>
      ) : (
        <>
          <div style={{ fontSize: '13px', color: '#431407', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
            {question}
          </div>
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Type your answer"
            style={inputStyle}
          />
          <button
            onClick={handleSubmitAnswer}
            disabled={loadingFeedback || !answer.trim()}
            style={{ ...buttonStyle, marginTop: '8px', opacity: answer.trim() ? 1 : 0.6 }}
          >
            {loadingFeedback ? 'Checking...' : 'Check answer'}
          </button>
          {feedback && (
            <div style={{ fontSize: '13px', color: '#431407', lineHeight: '1.5', marginTop: '8px', whiteSpace: 'pre-wrap' }}>
              {feedback}
            </div>
          )}
          <button
            onClick={handleGenerateQuestion}
            disabled={loadingQuestion}
            style={{
              ...buttonStyle,
              backgroundColor: '#fff',
              color: '#c2410c',
              border: '1px solid #fdba74',
              marginTop: '8px',
            }}
          >
            New question
          </button>
        </>
      )}
    </div>
  );
};

export default ActiveLearningBox;
