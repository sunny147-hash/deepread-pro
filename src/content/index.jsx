import React from 'react';
import { createRoot } from 'react-dom/client';
import PopupCard from './components/PopupCard';
import Highlighter from './Highlighter';
// 引入数据库工具
import { isDBEmpty, importDictionaryToDB, getVocabularyByLevel } from '../services/dictionaryService.js';
import { getHighlightSettings } from '../services/storageService.js';
import { recordLearningEvent } from '../services/learningEventService.js';
// ⚠️ 别忘了引入样式文件，否则高亮没有颜色！
import './index.css'; 

console.log('DeepRead: 🚀 服务启动 (IndexedDB版)...');

// 1. 初始化 React 界面容器 (保持不变)
let root = document.getElementById('deepread-extension-root');
if (!root) {
  root = document.createElement('div');
  root.id = 'deepread-extension-root';
  document.body.appendChild(root);
  createRoot(root).render(<PopupCard />);
}

// 2. 划词监听 (保持不变)
document.addEventListener('mouseup', (e) => {
  if (window.__deepreadSelectionEnabled === false) return;
  if (e.target.closest('#deepread-extension-root')) return;
  const selection = window.getSelection();
  const selectedText = selection.toString().trim();
  
if (selectedText.length > 0 && selectedText.length < 200) {
  // 只过滤掉纯数字和空白，允许字母+空格+标点（词组/句子）
  if (!/[a-zA-Z]/.test(selectedText)) return;

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    
    // 获取上下文句子
    const container = range.commonAncestorContainer.parentElement || document.body;
    let contextText = container.innerText || "";
    if (contextText.length > 300) contextText = contextText.substring(0, 300);
    
    // 发送事件给 React 组件显示卡片
    window.dispatchEvent(new CustomEvent('DEEPREAD_SHOW_CARD', {
      detail: { 
        rect: { bottom: rect.bottom, left: rect.left + (rect.width / 2) - 10 }, 
        word: selectedText, 
        entry: null, 
        context: contextText, 
        isSelection: true 
      }
    }));
  }
});

// 3. 核心启动逻辑 (已修复数据格式问题)
// src/content/index.js 中的 startApp 函数

const startApp = async () => {
  // 🎚️ 设置：只显示难度大于等于 3 的词
  // 0=全显, 1=小学, 2=初中, 3=高中, 4=四级, 5=六级/托福
  const { highlightUserLevel: USER_LEVEL, highlightMinLength: MIN_LENGTH } = await getHighlightSettings();

  try {
    // A. 检查数据库
    // 强制重置开关：如果遇到 "0个词" 的bug，把 forceReset 改成 true 刷新一次，修好后再改回 false
    const forceReset = false; 
    const isEmpty = await isDBEmpty();

    if (isEmpty || forceReset) {
      console.log('DeepRead: 📦 正在初始化/重置数据库...');
      const url = chrome.runtime.getURL('dictionary.json') + '?t=' + new Date().getTime();
      const response = await fetch(url);
      const jsonData = await response.json();
      await importDictionaryToDB(jsonData);
    } else {
      console.log('DeepRead: ⚡️ 数据库已就绪，直接读取...');
    }

    // B. 从数据库取词
    console.log(`DeepRead: 正在筛选难词 (Level ${USER_LEVEL}+ 或 长度 ${MIN_LENGTH}+)...`);
    const rawData = await getVocabularyByLevel(-1); // 先把所有词拿出来
    
    console.log(`DeepRead: 📊 数据库原始数据量: ${rawData.length} 条`); // 👈 调试日志

    // 🔄 C. 智能过滤 (Smart Filter)
    const vocabulary = {};
    const items = Array.isArray(rawData) ? rawData : Object.values(rawData);
    
    items.forEach(item => {
        if (!item || !item.word) return;

        let shouldShow = false;
        const level = item.l !== undefined ? item.l : -1;
        
        // 🧠 核心算法：
        // 情况1：如果数据里有正经等级 (比如 1, 2, 3...)
        if (level > 0) {
            if (level >= USER_LEVEL) shouldShow = true;
        } 
        // 情况2：如果数据里没有等级 (是 -1 或 0)，则按单词长度判断
        // (比如 "abandon" 是7个字，显示； "a" 是1个字，不显示)
        else {
            if (item.word.length >= MIN_LENGTH) shouldShow = true;
        }

        if (shouldShow) {
            vocabulary[item.word.toLowerCase()] = item;
        }
    });

    const count = Object.keys(vocabulary).length;
    console.log(`DeepRead: 🎯 过滤完毕！原本 ${items.length} 个，筛选后剩余 ${count} 个`);

    if (count === 0) {
        console.warn("DeepRead: ⚠️ 警告：筛选后没有剩余单词，可能是过滤条件太严格，或数据库为空。");
        // 兜底：如果过滤完一个都没有，就不启动高亮，或者提示用户
        return;
    }

    // D. 执行高亮
    const highlighter = new Highlighter(vocabulary);
    highlighter.scan(document.body);

    // 延迟扫描 (应对懒加载)
    setTimeout(() => highlighter.scan(document.body), 3000);

  } catch (error) {
    console.error('DeepRead: ❌ 启动失败', error);
  }
};

// 启动时先检查开关状态
chrome.storage.local.get(['enabled', 'highlightEnabled', 'selectionEnabled'], ({ 
  enabled = true, 
  highlightEnabled = true,
  selectionEnabled = true 
}) => {
  // 初始化划词开关状态
  window.__deepreadSelectionEnabled = selectionEnabled;
  
  // 只有两个开关都开着才启动高亮
  if (enabled && highlightEnabled) {
    setTimeout(startApp, 1000);
  }
});

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.action === 'TOGGLE_HIGHLIGHT') {
    chrome.storage.local.set({ highlightEnabled: msg.enabled });
    if (msg.enabled) {
      startApp();
    } else {
      location.reload();
    }
  }
  if (msg.action === 'TOGGLE_SELECTION') {
    window.__deepreadSelectionEnabled = msg.enabled;
  }
  if (msg.action === 'RELOAD_HIGHLIGHTS') {
    location.reload();
  }
});

window.addEventListener('DEEPREAD_LEARNING_EVENT', (e) => {
  recordLearningEvent(e.detail || {});
});
