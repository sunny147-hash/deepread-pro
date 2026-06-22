(async () => {
    // 动态加载真正的插件逻辑
    const src = chrome.runtime.getURL('src/content/index.js');
    await import(src);
  })();