// test.js - 用于快速验证逻辑，不需要启动 Chrome

// 1. 模拟你的“脏数据” (包含数字、空格、引号、索引)
const mockVocabularyKeys = [
    "0",          // 索引 (最坏的情况)
    "1", 
    " apple ",    // 带空格
    "'code'",     // 带引号
    "1990",       // 纯数字
    "c++",        // 特殊符号
    "abandon",    // 正常词
    "ability"     // 正常词
];

console.log("🔥 开始测试数据清洗逻辑...\n");

// 2. 模拟 Highlighter.js 里的循环逻辑
for (const rawWord of mockVocabularyKeys) {
    
    // --- 这里是你在插件里写的核心逻辑 ---
    
    // A. 清洗
    const word = rawWord.trim().replace(/['"]/g, '');

    // B. 过滤
    let status = "✅ 通过";
    if (/[0-9]/.test(word)) status = "❌ 被数字拦截";
    else if (word.length < 3) status = "❌ 太短被拦截";

    // --- 打印结果 ---
    console.log(`原始: [${rawWord}] \t-> 清洗后: [${word}] \t-> 结果: ${status}`);
    
    // C. 如果通过了，测试一下正则
    if (status.includes("通过")) {
        try {
            const safeWord = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp(`\\b(${safeWord})\\b`, 'i');
            console.log(`   └-> 正则生成成功: ${regex}`);
        } catch (e) {
            console.log(`   └-> 😱 正则报错: ${e.message}`);
        }
    }
}

console.log("\n🏁 测试结束。如果你看到 '0' 和 '1' 被拦截了，说明逻辑是对的！");