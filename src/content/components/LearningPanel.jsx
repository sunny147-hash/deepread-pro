import React, { useEffect, useState } from 'react';
import ActiveLearningBox from '../../components/ActiveLearningBox.jsx';
import { getLearningInsight } from '../../services/learningEventService.js';

const sectionStyle = {
  borderTop: '1px solid #e5e7eb',
  paddingTop: '10px',
  marginTop: '10px',
};

const titleStyle = {
  fontSize: '12px',
  fontWeight: '700',
  color: '#475569',
  marginBottom: '6px',
};

const textStyle = {
  margin: 0,
  fontSize: '13px',
  color: '#1f2937',
  lineHeight: '1.55',
  whiteSpace: 'pre-wrap',
};

function sendMessage(payload) {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(payload, (response) => resolve(response));
  });
}

const CollapsibleSection = ({ title, children }) => {
  const [open, setOpen] = useState(false);

  return (
    <div style={sectionStyle}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        style={{
          width: '100%',
          border: 'none',
          background: 'transparent',
          padding: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          color: '#475569',
          fontSize: '12px',
          fontWeight: '700',
        }}
      >
        <span>{title}</span>
        <span aria-hidden="true">{open ? '-' : '+'}</span>
      </button>
      {open && <div style={{ marginTop: '8px' }}>{children}</div>}
    </div>
  );
};

const LearningPanel = ({ word, context }) => {
  const [panel, setPanel] = useState(null);
  const [insight, setInsight] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadPanel() {
      if (!word) return;
      setLoading(true);
      setPanel(null);
      setInsight('');

      const response = await sendMessage({
        action: 'FETCH_LEARNING_PANEL',
        word,
        context,
      });

      if (cancelled) return;
      setLoading(false);

      const data = response?.success ? response.data : null;
      setPanel(data);
      setInsight(await getLearningInsight(word, data?.topicTags || []));
    }

    loadPanel();
    return () => {
      cancelled = true;
    };
  }, [word, context]);

  return (
    <div
      style={{
        marginTop: '12px',
        borderTop: '1px solid #dbeafe',
        paddingTop: '12px',
      }}
    >
      <div style={{ ...titleStyle, color: '#1d4ed8' }}>AI Learning Panel</div>

      {loading && (
        <p style={{ ...textStyle, color: '#64748b' }}>Generating focused explanation...</p>
      )}

      {!loading && panel && (
        <>
          <div>
            <div style={titleStyle}>一句话理解</div>
            <p style={{ ...textStyle, fontWeight: '600' }}>
              {panel.oneLineMeaning || '暂无一句话理解。'}
            </p>
          </div>

          <div style={sectionStyle}>
            <div style={titleStyle}>In This Context</div>
            <p style={textStyle}>
              {panel.contextExplanation || '暂无当前语境解释。'}
            </p>
          </div>

          {panel.sentenceLogic?.length > 0 && (
            <CollapsibleSection title="句子逻辑解释">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {panel.sentenceLogic.map((item, index) => (
                  <div key={`${item.part}-${index}`} style={{ fontSize: '13px', lineHeight: '1.5' }}>
                    <strong style={{ color: '#111827' }}>{item.part}</strong>
                    <span style={{ color: '#475569' }}>：{item.explanation}</span>
                  </div>
                ))}
              </div>
            </CollapsibleSection>
          )}

          {panel.whyDifficult && (
            <CollapsibleSection title="Why This Is Difficult">
              <p style={textStyle}>{panel.whyDifficult}</p>
            </CollapsibleSection>
          )}

          {insight && (
            <div style={{ ...sectionStyle, backgroundColor: '#f8fafc', borderRadius: '6px', padding: '10px' }}>
              <div style={titleStyle}>Learning Insight</div>
              <p style={{ ...textStyle, color: '#475569' }}>{insight}</p>
            </div>
          )}

          <ActiveLearningBox word={word} context={context} />
        </>
      )}
    </div>
  );
};

export default LearningPanel;
