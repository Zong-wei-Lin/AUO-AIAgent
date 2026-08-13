import { input } from "@inquirer/prompts";
import { searchNetflix } from "./lib/qdrant.js";
import { spinner } from "./utils/spinner.js";

try {
  while (true) {
    const query = (
      await input({ message: "請輸入要搜尋的程式語言：" })
    ).trim();

    if (query === "") continue;
    if (query.toLowerCase() === "exit") {
      console.log("再會~");
      break;
    }

    const spin = spinner("搜尋中...").start();
    const results = await searchNetflix(query, 5);
    spin.stop();

    for (const [i, r] of results.entries()) {

      console.log(`   語言：${r.language} 分數：${r.score.toFixed(3)}`);

    }
    console.log();
  }
} catch (err) {
  if (err.name === "ExitPromptError") {
    console.log("\n再會~");
  } else {
    throw err;
  }
}