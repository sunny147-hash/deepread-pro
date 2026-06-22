import React, { useState, useEffect } from 'react';
import LearningPanel from './LearningPanel.jsx';
import { recordLearningEvent } from '../../services/learningEventService.js';

const PopupCard = () => {
  const [visible, setVisible] = useState(false);
  const [data, setData] = useState(null);
  const [aiResult, setAiResult] = useState(''); 
  const [loading, setLoading] = useState(false); 
  const [showAiSection, setShowAiSection] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const [context, setContext] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [showLearningPanel, setShowLearningPanel] = useState(false);
  
  // 🆕 新增：判断是否是划词模式
  const isSelectionMode = data?.isSelection;

  useEffect(() => {
    const handleShow = (e) => {
  const { rect, word, entry, context, isSelection } = e.detail;
  
  setPos({ top: rect.bottom + window.scrollY + 8, left: rect.left + window.scrollX });
  setData({ word, entry, isSelection });
  setContext(context);
  setAiResult('');
  setLoading(false);
  setShowAiSection(false);
  setIsSaved(false);
  setShowLearningPanel(false);
  setVisible(true);
  if (isSelection) {
    recordLearningEvent({
      type: 'query',
      word,
      context,
    });
  }

  // 👇 如果是词组或句子，自动触发AI翻译
  if (word.includes(' ') || word.length > 20) {
    setShowAiSection(true);
    setLoading(true);
    chrome.runtime.sendMessage({
      action: 'FETCH_AI_EXPLANATION',
      word: word,
      context: word // 直接用选中内容作为上下文
    }, (response) => {
      setLoading(false);
      if (response && response.success) {
        setAiResult(response.data);
      } else {
        setAiResult("AI 请求失败");
      }
    });
  }
};

    // 监听我们的自定义事件
    window.addEventListener('DEEPREAD_SHOW_CARD', handleShow);
    
    // 🆕 点击页面空白处关闭卡片
    const handleGlobalClick = (e) => {
      // 如果点击的不是卡片内部，就关闭
      if (!e.target.closest('#deepread-extension-root')) {
        setVisible(false);
      }
    };
    document.addEventListener('mousedown', handleGlobalClick);

    return () => {
      window.removeEventListener('DEEPREAD_SHOW_CARD', handleShow);
      document.removeEventListener('mousedown', handleGlobalClick);
    };
  }, []);

  const handleAskAI = () => {
    setShowAiSection(true);
    setLoading(true);

    chrome.runtime.sendMessage({
      action: 'FETCH_AI_EXPLANATION',
      word: data.word,
      context: context
    }, (response) => {
      setLoading(false);
      if (response && response.success) {
        setAiResult(response.data);
      } else {
        setAiResult("AI 请求失败");
      }
    });
  };

  const handleSave = () => {
    const newItem = {
      id: Date.now(),
      word: data.word,
      // 如果是划词，可能没有 entry.d，我们用 "AI 翻译" 或 AI 结果代替
      definition: data.entry?.d || (aiResult ? "AI 翻译" : "划词选段"),
      context: context,
      aiExplanation: aiResult || "",
      date: new Date().toLocaleDateString()
    };

    chrome.storage.local.get(['vocabulary'], (result) => {
      const list = result.vocabulary || [];
      if (!list.some(item => item.word === newItem.word)) {
        const newList = [newItem, ...list];
        chrome.storage.local.set({ vocabulary: newList }, () => {
          setIsSaved(true);
        });
      } else {
        setIsSaved(true);
      }
    });
  };

  const handleSpeak = () => {
    if (!data) return;
    const utterance = new SpeechSynthesisUtterance(data.word);
    utterance.lang = 'en-US'; 
    window.speechSynthesis.speak(utterance);
  };

  const handleOpenLearningPanel = () => {
    setShowLearningPanel(true);
    setShowAiSection(false);
  };

  if (!visible || !data) return null;

  return (
    <div
      style={{
        position: 'absolute',
        top: pos.top,
        left: pos.left,
        zIndex: 2147483647,
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
        padding: '16px',
        minWidth: '280px',
        maxWidth: '350px', // 划句子时可以宽一点
        border: '1px solid #eee',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        textAlign: 'left',
        color: '#333'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px', borderBottom: '1px solid #f0f0f0', paddingBottom: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
            {/* 划词模式下，如果字数太多，就截断显示，防止标题太长 */}
            <strong style={{ fontSize: '18px', color: '#1a1a1a', wordBreak: 'break-word', lineHeight: '1.2' }}>
                {data.word.length > 20 ? data.word.substring(0, 20) + '...' : data.word}
            </strong>
            
            <button 
                onClick={handleSpeak}
                title="发音"
                style={{
                    background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', padding: '4px',
                    borderRadius: '50%', backgroundColor: '#ffecd1', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    minWidth: '24px', height: '24px'
                }}
            >
                🔊
            </button>
        </div>
        
        <button 
          onClick={handleSave}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: isSaved ? '#f59e0b' : '#ccc', marginLeft: '8px' }}
          title="加入生词本"
        >
          {isSaved ? '★' : '☆'}
        </button>
      </div>

      {/* 逻辑判断：
          1. 如果有本地释义 (entry.d)，显示本地释义。
          2. 如果是划词 (没有entry)，默认显示 "点击下方按钮进行翻译"。
      */}
      <p style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#444', lineHeight: '1.5' }}>
  {(data.entry && !data.word.includes(' ')) 
    ? data.entry.d 
    : <span style={{color: '#888', fontStyle: 'italic'}}>点击下方按钮翻译所选内容</span>}
</p>

      {!showAiSection ? (
        <button 
          onClick={handleAskAI}
          style={{
            width: '100%',
            padding: '8px',
            backgroundColor: '#e6f4ff', // 蓝色按钮
            color: '#0066cc',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            transition: 'all 0.2s'
          }}
          onMouseOver={(e) => e.target.style.backgroundColor = '#d1e9ff'}
          onMouseOut={(e) => e.target.style.backgroundColor = '#e6f4ff'}
        >
          {/* 这里根据模式显示不同的文案 */}
          <span>✨</span> {isSelectionMode ? "AI 智能翻译" : "查看豆包 AI 深度解析"}
        </button>
      ) : (
        <div style={{ backgroundColor: '#f0f9ff', borderRadius: '8px', padding: '10px', marginTop: '8px', border: '1px solid #bae6fd' }}>
          <div style={{ fontSize: '12px', color: '#0066cc', marginBottom: '4px', fontWeight: 'bold' }}>
             ✨ 豆包 AI {isSelectionMode ? "翻译结果" : "解析中"}...
          </div>
          <p style={{ margin: 0, fontSize: '13px', color: '#334155', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
            {loading ? "正在思考..." : aiResult}
          </p>
        </div>
      )}
      {!showLearningPanel ? (
        <button
          onClick={handleOpenLearningPanel}
          style={{
            width: '100%',
            padding: '8px',
            backgroundColor: '#f8fafc',
            color: '#0f172a',
            border: '1px solid #cbd5e1',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: '600',
            marginTop: '10px'
          }}
        >
          Open Learning Panel
        </button>
      ) : (
        <LearningPanel key={`${data.word}-${context}`} word={data.word} context={context} />
      )}
    </div>
  );
};

export default PopupCard;
