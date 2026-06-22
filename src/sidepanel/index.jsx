import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import ActiveLearningBox from '../components/ActiveLearningBox.jsx';
import {
  DEFAULT_AI_MODEL,
  DEFAULT_HIGHLIGHT_MIN_LENGTH,
  DEFAULT_HIGHLIGHT_USER_LEVEL,
  saveAISettings,
  saveHighlightSettings,
} from '../services/storageService.js';

// 开关组件
const Toggle = ({ enabled, onToggle }) => (
  <div onClick={onToggle} style={{
    width: '44px', height: '24px', borderRadius: '12px', cursor: 'pointer',
    backgroundColor: enabled ? '#0066cc' : '#ccc',
    position: 'relative', transition: 'background-color 0.2s', flexShrink: 0
  }}>
    <div style={{
      position: 'absolute', top: '2px',
      left: enabled ? '22px' : '2px',
      width: '20px', height: '20px', borderRadius: '50%',
      backgroundColor: '#fff', transition: 'left 0.2s',
      boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
    }} />
  </div>
);

const SidePanel = () => {
  const [tab, setTab] = useState('vocab');
  const [list, setList] = useState([]);
  const [highlightEnabled, setHighlightEnabled] = useState(true);
  const [selectionEnabled, setSelectionEnabled] = useState(true);
  const [aiApiKey, setAiApiKey] = useState('');
  const [aiModel, setAiModel] = useState(DEFAULT_AI_MODEL);
  const [aiConfigSaved, setAiConfigSaved] = useState(false);
  const [highlightUserLevel, setHighlightUserLevel] = useState(DEFAULT_HIGHLIGHT_USER_LEVEL);
  const [highlightMinLength, setHighlightMinLength] = useState(DEFAULT_HIGHLIGHT_MIN_LENGTH);
  const [highlightSettingsSaved, setHighlightSettingsSaved] = useState(false);
  const [learningItemId, setLearningItemId] = useState('');

  useEffect(() => {
    chrome.storage.local.get([
      'vocabulary',
      'highlightEnabled',
      'selectionEnabled',
      'aiApiKey',
      'aiModel',
      'highlightUserLevel',
      'highlightMinLength'
    ], (result) => {
      setList(result.vocabulary || []);
      setLearningItemId((result.vocabulary || [])[0]?.id || '');
      setHighlightEnabled(result.highlightEnabled !== false);
      setSelectionEnabled(result.selectionEnabled !== false);
      setAiApiKey(result.aiApiKey || '');
      setAiModel(result.aiModel || DEFAULT_AI_MODEL);
      setHighlightUserLevel(Number(result.highlightUserLevel ?? DEFAULT_HIGHLIGHT_USER_LEVEL));
      setHighlightMinLength(Number(result.highlightMinLength ?? DEFAULT_HIGHLIGHT_MIN_LENGTH));
    });

    const handleStorageChange = (changes, area) => {
      if (area === 'local') {
        if (changes.vocabulary) {
          const nextList = changes.vocabulary.newValue || [];
          setList(nextList);
          setLearningItemId((currentId) => nextList.some((item) => item.id === currentId) ? currentId : (nextList[0]?.id || ''));
        }
        if (changes.highlightEnabled) setHighlightEnabled(changes.highlightEnabled.newValue);
        if (changes.selectionEnabled) setSelectionEnabled(changes.selectionEnabled.newValue);
        if (changes.aiApiKey) setAiApiKey(changes.aiApiKey.newValue || '');
        if (changes.aiModel) setAiModel(changes.aiModel.newValue || DEFAULT_AI_MODEL);
        if (changes.highlightUserLevel) setHighlightUserLevel(Number(changes.highlightUserLevel.newValue ?? DEFAULT_HIGHLIGHT_USER_LEVEL));
        if (changes.highlightMinLength) setHighlightMinLength(Number(changes.highlightMinLength.newValue ?? DEFAULT_HIGHLIGHT_MIN_LENGTH));
      }
    };
    chrome.storage.onChanged.addListener(handleStorageChange);
    return () => chrome.storage.onChanged.removeListener(handleStorageChange);
  }, []);

  const handleDelete = (id) => {
    const newList = list.filter(item => item.id !== id);
    chrome.storage.local.set({ vocabulary: newList });
  };

  const sendToContent = (action, data) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) chrome.tabs.sendMessage(tabs[0].id, { action, ...data });
    });
  };

  const handleToggleHighlight = () => {
    const newState = !highlightEnabled;
    chrome.storage.local.set({ highlightEnabled: newState });
    sendToContent('TOGGLE_HIGHLIGHT', { enabled: newState });
  };

  const handleToggleSelection = () => {
    const newState = !selectionEnabled;
    chrome.storage.local.set({ selectionEnabled: newState });
    sendToContent('TOGGLE_SELECTION', { enabled: newState });
  };

  const handleSaveAIConfig = () => {
    saveAISettings({
      aiApiKey: aiApiKey.trim(),
      aiModel: aiModel.trim() || DEFAULT_AI_MODEL,
    }, () => {
      setAiConfigSaved(true);
      setTimeout(() => setAiConfigSaved(false), 1500);
    });
  };

  const handleSaveHighlightSettings = () => {
    saveHighlightSettings({
      highlightUserLevel,
      highlightMinLength,
    }, () => {
      setHighlightSettingsSaved(true);
      sendToContent('RELOAD_HIGHLIGHTS', {});
      setTimeout(() => setHighlightSettingsSaved(false), 1500);
    });
  };

  const learningItem = list.find((item) => item.id === learningItemId) || list[0];

  const styles = {
    container: { fontFamily: 'system-ui, sans-serif', height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#f8f9fa' },
    tabBar: { display: 'flex', borderBottom: '1px solid #eee', backgroundColor: '#fff' },
    tabBtn: (active) => ({
      flex: 1, padding: '12px', border: 'none', background: 'none', cursor: 'pointer',
      fontSize: '13px', fontWeight: active ? '600' : '400',
      color: active ? '#0066cc' : '#888',
      borderBottom: active ? '2px solid #0066cc' : '2px solid transparent',
    }),
    content: { flex: 1, overflowY: 'auto', padding: '16px' },
  };

  return (
    <div style={styles.container}>
      <div style={styles.tabBar}>
        <button style={styles.tabBtn(tab === 'vocab')} onClick={() => setTab('vocab')}>
          📚 生词本 {list.length > 0 && `(${list.length})`}
        </button>
        <button style={styles.tabBtn(tab === 'settings')} onClick={() => setTab('settings')}>
          ⚙️ 设置
        </button>
      </div>

      <div style={styles.content}>
        {/* 生词本 */}
        {tab === 'vocab' && (
          list.length === 0 ? (
            <div style={{ color: '#999', textAlign: 'center', marginTop: '40px', fontSize: '14px' }}>
              还没有生词哦 <br /> 去网页上划词收藏吧！
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ backgroundColor: '#fff', borderRadius: '8px', padding: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #eee' }}>
                <div style={{ fontSize: '13px', fontWeight: '600', color: '#1a1a1a', marginBottom: '8px' }}>Active Learning</div>
                <select
                  value={learningItem?.id || ''}
                  onChange={(e) => setLearningItemId(Number(e.target.value))}
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '13px',
                    marginBottom: '8px'
                  }}
                >
                  {list.map(item => (
                    <option key={item.id} value={item.id}>{item.word}</option>
                  ))}
                </select>
                <ActiveLearningBox
                  key={learningItem?.id || 'empty-learning-item'}
                  word={learningItem?.word || ''}
                  context={learningItem?.context || learningItem?.aiExplanation || learningItem?.definition || ''}
                />
              </div>
              {list.map(item => (
                <div key={item.id} style={{ backgroundColor: '#fff', borderRadius: '8px', padding: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #eee' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <strong style={{ fontSize: '16px', color: '#0066cc' }}>{item.word}</strong>
                    <button onClick={() => handleDelete(item.id)} style={{ border: 'none', background: 'none', color: '#999', cursor: 'pointer', fontSize: '18px' }}>
                      &times;
                    </button>
                  </div>
                  <div style={{ fontSize: '13px', color: '#333', marginBottom: '8px' }}>{item.definition}</div>
                  {item.context && (
                    <div style={{ fontSize: '12px', color: '#666', borderLeft: '3px solid #e0e0e0', paddingLeft: '8px', fontStyle: 'italic' }}>
                      "{item.context.length > 60 ? item.context.substring(0, 60) + '...' : item.context}"
                    </div>
                  )}
                  <div style={{ fontSize: '10px', color: '#aaa', marginTop: '8px', textAlign: 'right' }}>已收录于 {item.date}</div>
                </div>
              ))}
            </div>
          )
        )}

        {/* 设置 */}
        {tab === 'settings' && (
          <div>
            <h3 style={{ fontSize: '15px', color: '#333', marginBottom: '16px' }}>插件设置</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

              <div style={{ backgroundColor: '#fff', borderRadius: '10px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#1a1a1a', marginBottom: '10px' }}>AI API Key</div>
                <input
                  type="password"
                  value={aiApiKey}
                  onChange={(e) => {
                    setAiApiKey(e.target.value);
                    setAiConfigSaved(false);
                  }}
                  placeholder="Paste your API key"
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '8px 10px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '13px',
                    marginBottom: '8px'
                  }}
                />
                <input
                  type="text"
                  value={aiModel}
                  onChange={(e) => {
                    setAiModel(e.target.value);
                    setAiConfigSaved(false);
                  }}
                  placeholder="Model"
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '8px 10px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '13px',
                    marginBottom: '10px'
                  }}
                />
                <button
                  onClick={handleSaveAIConfig}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: 'none',
                    borderRadius: '6px',
                    backgroundColor: '#0066cc',
                    color: '#fff',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: '600'
                  }}
                >
                  {aiConfigSaved ? 'Saved' : 'Save AI Settings'}
                </button>
              </div>

              <div style={{ backgroundColor: '#fff', borderRadius: '10px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#1a1a1a' }}>🖊️ 单词高亮</div>
                    <div style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>关闭后停止高亮难词</div>
                  </div>
                  <Toggle enabled={highlightEnabled} onToggle={handleToggleHighlight} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '12px' }}>
                  <label style={{ fontSize: '12px', color: '#555' }}>
                    Level
                    <input
                      type="number"
                      min="0"
                      max="5"
                      value={highlightUserLevel}
                      onChange={(e) => {
                        setHighlightUserLevel(Number(e.target.value));
                        setHighlightSettingsSaved(false);
                      }}
                      style={{
                        width: '100%',
                        boxSizing: 'border-box',
                        padding: '7px 8px',
                        border: '1px solid #ddd',
                        borderRadius: '6px',
                        fontSize: '13px',
                        marginTop: '4px'
                      }}
                    />
                  </label>
                  <label style={{ fontSize: '12px', color: '#555' }}>
                    Min length
                    <input
                      type="number"
                      min="1"
                      max="30"
                      value={highlightMinLength}
                      onChange={(e) => {
                        setHighlightMinLength(Number(e.target.value));
                        setHighlightSettingsSaved(false);
                      }}
                      style={{
                        width: '100%',
                        boxSizing: 'border-box',
                        padding: '7px 8px',
                        border: '1px solid #ddd',
                        borderRadius: '6px',
                        fontSize: '13px',
                        marginTop: '4px'
                      }}
                    />
                  </label>
                </div>
                <button
                  onClick={handleSaveHighlightSettings}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: 'none',
                    borderRadius: '6px',
                    backgroundColor: '#0066cc',
                    color: '#fff',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: '600',
                    marginTop: '10px'
                  }}
                >
                  {highlightSettingsSaved ? 'Saved' : 'Save Highlight Settings'}
                </button>
              </div>

              <div style={{ backgroundColor: '#fff', borderRadius: '10px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#1a1a1a' }}>✋ 划词翻译</div>
                    <div style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>关闭后停止响应划词</div>
                  </div>
                  <Toggle enabled={selectionEnabled} onToggle={handleToggleSelection} />
                </div>
              </div>

            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const container = document.getElementById('root');
const root = createRoot(container);
root.render(<SidePanel />);

export { Toggle, SidePanel };
