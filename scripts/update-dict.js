/**
 * DeepRead Pro - 真实数据清洗脚本 (v3.0 广撒网版)
 * 目标：提取 1.5w - 2w 实用词汇 (包含基础词 + 核心考级词)
 */
import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CSV_PATH = path.resolve(__dirname, 'ecdict.csv');
const OUTPUT_PATH = path.resolve(__dirname, '../public/dictionary.json');

if (!fs.existsSync(CSV_PATH)) {
    console.error('❌ 错误：找不到 ecdict.csv 文件！');
    process.exit(1);
}

console.log('🚀 开始构建“全能型”词库 (v3.0)...');

const output = [];
// 用于统计分布，让你看清楚词都是哪来的
const stats = { zk: 0, gk: 0, cet4: 0, cet6: 0, other: 0 };

const fileStream = fs.createReadStream(CSV_PATH);
const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
});

// 智能 CSV 切割 (复用之前的逻辑)
function csvSplit(line) {
    const res = [];
    let current = '';
    let inQuote = false;
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') inQuote = !inQuote;
        else if (char === ',' && !inQuote) {
            res.push(current);
            current = '';
        } else current += char;
    }
    res.push(current);
    return res;
}

rl.on('line', (line) => {
    if (!line || line.startsWith('word,phonetic')) return;
    const parts = csvSplit(line);
    if (parts.length < 8) return;

    let word = parts[0];
    let translation = parts[3];
    let tag = parts[7] || ""; // 标签字段
    // 清理翻译格式
    if (translation.startsWith('"')) translation = translation.slice(1, -1);
    translation = translation.replace(/\\n/g, "; ");

    // 排除没有中文翻译的词
    if (!translation || translation === 'undefined') return;

    // 排除过于生僻的词长度 (太长的短语通常是垃圾数据)
    if (word.length > 20 || word.includes(' ')) return; 

    // ✅ 核心修改：扩大筛选范围
    let level = -1;

    // 逻辑：越基础的词，Level 越低 (0 = 基础, 1 = 四级, 2 = 六级/考研/托福)
    if (tag.includes('zk') || tag.includes('gk')) {
        level = 0; // 中考/高考 (基础词) -> 可以在设置里选择不高亮
        stats.zk++;
    } else if (tag.includes('cet4')) {
        level = 1;
        stats.cet4++;
    } else if (tag.includes('cet6') || tag.includes('kaoyan') || tag.includes('toefl') || tag.includes('programmer')) {
        level = 2;
        stats.cet6++;
    }

    // 只要命中了上面的任意一个等级，就收录
    if (level !== -1) {
        output.push({
            word: word,
            translation: translation.substring(0, 50) + (translation.length > 50 ? '...' : ''),
            level: level
        });
    }
});

rl.on('close', () => {
    console.log(`\n📊 词库统计报告:`);
    console.log(`   - 基础词 (中/高考): ${stats.zk} 个`);
    console.log(`   - 进阶词 (四级):    ${stats.cet4} 个`);
    console.log(`   - 高阶词 (六级+):   ${stats.cet6} 个`);
    console.log(`-----------------------------------`);
    console.log(`✅ 总计收录: ${output.length} 个单词`);
    
    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2));
    console.log(`📂 文件已保存到: ${OUTPUT_PATH}`);
});
