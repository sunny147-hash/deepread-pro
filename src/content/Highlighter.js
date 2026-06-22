// src/content/Highlighter.js

export default class Highlighter {
  constructor(vocabulary) {
    this.vocabulary = vocabulary;
    // 提取所有单词 key
    // 如果 vocabulary 是个对象，这里拿到的就是 ["apple", "banana"...]
    this.keywords = Object.keys(vocabulary); 
    this.className = 'deepread-highlight';
    
    console.log(`DeepRead: Highlighter 就绪，词汇量: ${this.keywords.length}`);
  }

  // 1. 扫描入口 (保持不变)
  scan(rootNode) {
    const walker = document.createTreeWalker(
      rootNode,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          const parent = node.parentNode;
          if (!parent) return NodeFilter.FILTER_REJECT;
          const tag = parent.tagName;
          if (['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEXTAREA', 'INPUT', 'CODE', 'PRE'].includes(tag)) {
            return NodeFilter.FILTER_REJECT;
          }
          if (parent.closest('#deepread-extension-root')) return NodeFilter.FILTER_REJECT;
          if (parent.classList.contains(this.className)) return NodeFilter.FILTER_REJECT;
          return NodeFilter.FILTER_ACCEPT;
        }
      }
    );

    const nodes = [];
    let currentNode;
    while ((currentNode = walker.nextNode())) {
      nodes.push(currentNode);
    }
    nodes.forEach(node => this.highlightNode(node));
  }

  // 2. 核心匹配逻辑 (这里就是你刚刚 test.js 里的逻辑！)
  highlightNode(node) {
    const text = node.nodeValue;
    if (!text || text.trim().length < 3) return;

    for (const rawWord of this.keywords) {
      
      // ✅ A. 清洗 (和 test.js 一样)
      const word = rawWord.trim().replace(/['"]/g, '');

      // ✅ B. 过滤 (和 test.js 一样)
      if (/[0-9]/.test(word)) continue; // 拦截数字
      if (word.length < 3) continue;    // 拦截太短的词

      try {
        // ✅ C. 安全正则 (和 test.js 一样)
        const safeWord = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`\\b(${safeWord})\\b`, 'i');
        const match = regex.exec(text);

        if (match) {
          // 找到对应的定义 (兼容清洗前后的 key)
          const entry = this.vocabulary[word] || this.vocabulary[rawWord];
          
          if (entry) {
            this.applyHighlight(node, match, word, entry);
            return; // 找到一个就停止，防止冲突
          }
        }
      } catch {
        continue;
      }
    }
  }

 // 3. 上色逻辑 (带交互功能版)
// src/content/Highlighter.js 中的 applyHighlight 方法

applyHighlight(node, match, word, entry) {
  const matchIndex = match.index;
  const matchLength = match[0].length;
  
  const afterNode = node.splitText(matchIndex);
  afterNode.splitText(matchLength);

  const highlightSpan = document.createElement('span');
  highlightSpan.className = this.className;
  highlightSpan.textContent = match[0]; 
  highlightSpan.dataset.word = word;
  
  // 👇👇👇 【核心升级：根据等级分配颜色】 👇👇👇
  
  // 1. 获取等级 (修复版)
  let level = -1;
  if (entry.level !== undefined) level = entry.level;
  else if (entry.l !== undefined) level = entry.l;

  console.log(`DeepRead: 🎨 [${word}] 的等级是: ${level}`); // 打开控制台看看日志！

  // 2. 定义颜色
  let baseColor, borderColor;

  if (level >= 4) {
      // 🔴 难词 (4, 5+): 红色 - 警示
      baseColor = 'rgba(255, 82, 82, 0.4)';
      borderColor = '#ff5252';
  } else if (level === 3) {
      // 🟠 中等 (3): 橙色 - 重点
      baseColor = 'rgba(255, 152, 0, 0.4)';
      borderColor = '#ff9800';
  } else if (level >= 0 && level <= 2) {
      // 🟢 简单 (0, 1, 2): 绿色 - 轻松
      baseColor = 'rgba(105, 240, 174, 0.4)';
      borderColor = '#69f0ae';
  } else {
      // ⚪️ 未知 (-1): 灰色/蓝色 - 默认
      baseColor = 'rgba(158, 158, 158, 0.3)';
      borderColor = '#9e9e9e';
  }

  // 应用颜色
  highlightSpan.style.backgroundColor = baseColor;
  highlightSpan.style.borderBottom = `2px solid ${borderColor}`;
  highlightSpan.style.cursor = 'pointer';
  highlightSpan.style.transition = 'all 0.2s';
  highlightSpan.style.borderRadius = '3px';
  
  // 👆👆👆 【升级结束】 👆👆👆

  // 交互事件 (保持之前修复好的逻辑)
  let hoverTimer = null;

  highlightSpan.onmouseenter = (e) => {
      // 悬停时加深颜色
      highlightSpan.style.backgroundColor = baseColor.replace('0.3', '0.6').replace('0.4', '0.7').replace('0.5', '0.8');
      highlightSpan.style.transform = 'scale(1.05)';
      this.triggerCard(e.target, word, entry, 'hover');
      hoverTimer = window.setTimeout(() => {
        window.dispatchEvent(new CustomEvent('DEEPREAD_LEARNING_EVENT', {
          detail: {
            type: 'hover',
            word,
            context: '',
            duration: 8000
          }
        }));
      }, 8000);
  };

  highlightSpan.onmouseleave = () => {
      highlightSpan.style.backgroundColor = baseColor;
      highlightSpan.style.transform = 'scale(1)';
      if (hoverTimer) {
        window.clearTimeout(hoverTimer);
        hoverTimer = null;
      }
  };

  highlightSpan.onclick = (e) => {
      e.stopPropagation();
      this.triggerCard(e.target, word, entry, 'click');
  };

  node.parentNode.replaceChild(highlightSpan, afterNode);
}

// 📡 新增一个辅助函数，用来发射信号
triggerCard(targetElement, word, entry, source = 'click') {
    const rect = targetElement.getBoundingClientRect();
    
    // 发送自定义事件 (index.js 或者 PopupCard 会监听到这个事件)
    window.dispatchEvent(new CustomEvent('DEEPREAD_SHOW_CARD', {
      detail: { 
        // 计算卡片位置：在单词正下方
        rect: { 
            bottom: rect.bottom, 
            left: rect.left + (rect.width / 2) - 10 
        }, 
        word: word,      // 单词拼写
        entry: entry,    // 单词定义 (来自数据库)
        context: "",     // 上下文 (高亮模式下暂时留空)
        isSelection: false // 告诉卡片这是高亮词，不是划词
      }
    }));
} }
