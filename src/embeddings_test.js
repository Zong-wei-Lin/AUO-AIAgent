import { QdrantClient } from "@qdrant/js-client-rest";
import { QDRANT_URL, QDRANT_API_KEY } from "./config.js";
import { client } from "./lib/openai.js";

const qdrant = new QdrantClient({
  url: QDRANT_URL,
  ...(QDRANT_API_KEY && { apiKey: QDRANT_API_KEY }),
  checkCompatibility: false,
});

const TEST_COLLECTION = "test_similarity";
const EMBEDDING_MODEL = "text-embedding-3-small";
const EMBEDDING_DIM = 1536;

/**
 * 獲取文本的 embedding
 */
async function embed(text) {
  const res = await client.embeddings.create({
    model: EMBEDDING_MODEL,
    input: text,
  });
  return res.data[0].embedding;
}

/**
 * 建立測試 collection
 */
async function createTestCollection() {
  const exists = await qdrant.collectionExists(TEST_COLLECTION);
  if (exists.exists) {
    await qdrant.deleteCollection(TEST_COLLECTION);
  }
  
  await qdrant.createCollection(TEST_COLLECTION, {
    vectors: {
      size: EMBEDDING_DIM,
      distance: "Cosine",
    },
  });
  console.log(`✓ 建立 collection: ${TEST_COLLECTION}`);
}

/**
 * 計算句子組的相似度
 */
async function calculateGroupSimilarity(groupName, sentences) {
  console.log(`\n📊 ${groupName}`);
  console.log("=".repeat(60));

  // 先清空 collection
  await qdrant.deleteCollection(TEST_COLLECTION);
  await qdrant.createCollection(TEST_COLLECTION, {
    vectors: { size: EMBEDDING_DIM, distance: "Cosine" },
  });

  // 將句子存入 Qdrant
  const vectors = await Promise.all(
    sentences.map((text) => embed(text))
  );

  const points = sentences.map((text, idx) => ({
    id: idx,
    vector: vectors[idx],
    payload: { text, index: idx },
  }));

  await qdrant.upsert(TEST_COLLECTION, { wait: true, points });
  console.log(`✓ 已存儲 ${sentences.length} 句句子`);

  // 計算兩兩相似度（使用 Qdrant query）
  const similarities = [];
  for (let i = 0; i < sentences.length; i++) {
    for (let j = i + 1; j < sentences.length; j++) {
      // 用句子 i 搜索，查看與句子 j 的相似度
      const results = await qdrant.query(TEST_COLLECTION, {
        query: vectors[i],
        limit: sentences.length,
        with_payload: true,
      });

      // 找到句子 j 的 score
      const scoreForJ = results.points.find((r) => r.payload.index === j).score;

      similarities.push({
        sentence1: sentences[i],
        sentence2: sentences[j],
        similarity: scoreForJ.toFixed(4),
      });

      console.log(
        `\n句子 ${i + 1}: "${sentences[i]}"`
      );
      console.log(`句子 ${j + 1}: "${sentences[j]}"`);
      console.log(`相似度 (Qdrant Score): ${scoreForJ.toFixed(4)}`);
    }
  }

  return {
    groupName,
    similarities,
    averageSimilarity: (
      similarities.reduce((sum, s) => sum + parseFloat(s.similarity), 0) /
      similarities.length
    ).toFixed(4),
  };
}

/**
 * 主程式
 */
async function main() {
  console.log("🚀 Embeddings API + Qdrant 相似度測試");
  console.log("=".repeat(60));

  // 建立 collection
  await createTestCollection();

  // 測試資料組
  const testGroups = [
    {
      name: "第 1 組：意思相近的句子",
      sentences: ["我喜歡貓", "貓咪很可愛", "我養了一隻貓"],
    },
    {
      name: "第 2 組：意思不同的句子",
      sentences: ["今天天氣很好", "我要去買菜", "電腦壞了"],
    },
    {
      name: "第 3 組：自訂測試案例（技術相關）",
      sentences: [
        "JavaScript 是一種程式語言",
        "Node.js 用於後端開發",
        "Python 適合數據分析",
      ],
    },
  ];

  // 執行測試
  const results = [];
  for (const group of testGroups) {
    const result = await calculateGroupSimilarity(group.name, group.sentences);
    results.push(result);
  }

  // 總結
  console.log("\n\n📈 測試結果總結");
  console.log("=".repeat(60));
  results.forEach((group) => {
    console.log(`\n${group.groupName}`);
    console.log(`平均相似度: ${group.averageSimilarity}`);
    group.similarities.forEach((sim, idx) => {
      console.log(
        `  ${idx + 1}. "${sim.sentence1}" <-> "${sim.sentence2}": ${sim.similarity}`
      );
    });
  });

  // 分析
  console.log("\n\n💡 分析結果");
  console.log("=".repeat(60));
  console.log(`第 1 組平均相似度: ${results[0].averageSimilarity} (相近文本)`);
  console.log(`第 2 組平均相似度: ${results[1].averageSimilarity} (不同文本)`);
  console.log(`\n✅ 驗證: 第 1 組相似度應高於第 2 組`);

  const group1Avg = parseFloat(results[0].averageSimilarity);
  const group2Avg = parseFloat(results[1].averageSimilarity);
  if (group1Avg > group2Avg) {
    console.log(
      `✓ 符合預期 (${group1Avg.toFixed(4)} > ${group2Avg.toFixed(4)})`
    );
  } else {
    console.log(
      `✗ 未符合預期 (${group1Avg.toFixed(4)} < ${group2Avg.toFixed(4)})`
    );
  }

  return results;
}

// 執行程式
main().catch(console.error);
