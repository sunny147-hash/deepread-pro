// src/utils/db.js
import { openDB } from 'idb';

const DB_NAME = 'DeepReadDB';
const STORE_NAME = 'vocabulary';

// 1. 初始化数据库
export const initDB = async () => {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        // 创建仓库，主键设为 'word' (这样以后查词更快)
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'word' });
        // 创建索引，方便按等级查询
        store.createIndex('level', 'l', { unique: false }); 
        console.log('DeepReadDB: ✅ 数据库表已创建');
      }
    },
  });
};

// 2. 检查是不是空的
export const isDBEmpty = async () => {
  const db = await initDB();
  const count = await db.count(STORE_NAME);
  return count === 0;
};

// 3. 【核心修复】导入数据
export const importDictionaryToDB = async (jsonData) => {
  const db = await initDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);

  console.log('DeepReadDB: 🔄 正在导入数据 (智能模式)...');
  
  const entries = Object.entries(jsonData);
  
  const promises = entries.map(([key, value]) => {
    // 确保 record 是个对象
    const record = (typeof value === 'object') ? value : { definition: value };
    
    // 🛡️ 关键修复：优先使用原本的 'word' 字段！
    // 只有当原本没有 word 字段时，才勉强使用 key (索引)
    if (record.word) {
        record.word = record.word.toLowerCase();
    } else {
        record.word = key.toLowerCase();
    }
    
    // 补全 level
    if (record.l === undefined) record.l = -1;

    return store.put(record);
  });

  await Promise.all(promises);
  await tx.done;
  console.log(`DeepReadDB: 🎉 导入完成！共 ${entries.length} 条`);
};

// 4. 按等级取词
export const getVocabularyByLevel = async (level) => {
  const db = await initDB();
  // 简单粗暴：直接获取所有词 (在 MVP 阶段性能足够)
  // 如果以后数据量大了，可以用 index 筛选
  if (level < 0) return await db.getAll(STORE_NAME);
  return await db.getAllFromIndex(STORE_NAME, 'level', level);
};
