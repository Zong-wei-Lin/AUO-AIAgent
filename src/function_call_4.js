import { input } from "@inquirer/prompts";
import { spinner } from "./utils/spinner.js";
import { toOpenAITool } from "./utils/func-tool.js";
import * as allTools from "./tools/index.js";
import {
  client,
  DEFAULT_MODEL,
  DEFAULT_REASONING,
} from "./lib/openai.js";

const toolList = Object.values(allTools);
const tools = toolList.map(toOpenAITool);
const TOOLS_BY_NAME = Object.fromEntries(toolList.map((tool) => [tool.name, tool]));
const MAX_TOOL_ROUNDS = 8;

const history = [
  {
    role: "developer",
    content:
      "你是一位貼心的助理，可以使用提供的工具回答使用者的問題。請用繁體中文回答。",
  },
];

try {
  while (true) {
    const userQuestion =(
      await input({ message: "請輸入你的問題：" })
    ).trim();

    if (userQuestion === "") continue;
    if (userQuestion.toLowerCase() === "exit") {
      console.log("再會~");
      break;
    }

    history.push({ role: "user", content: userQuestion });
    let completed = false;

    for (let round = 1; round <= MAX_TOOL_ROUNDS; round += 1) {
      const spin = spinner("思考中...").start();
      let response;

      try {
        response = await client.responses.create({
          model: DEFAULT_MODEL,
          reasoning: DEFAULT_REASONING,
          input: history,
          tools,
          tool_choice: "auto",
        });
      } finally {
        spin.stop();
      }

      history.push(...response.output);

      const functionCalls = response.output.filter(
        (item) => item.type === "function_call",
      );

      if (functionCalls.length === 0) {
        console.log(response.output_text);
        completed = true;
        break;
      }

      for (const functionCall of functionCalls) {
        const fnName = functionCall.name;
        const tool = TOOLS_BY_NAME[fnName];
        if (!tool) {
          throw new Error(`模型要求了未註冊的工具：${fnName}`);
        }

        const args = tool.parameters.parse(
          JSON.parse(functionCall.arguments),
        );
        console.log(`\n[呼叫 tool] ${fnName}(${JSON.stringify(args)})`);

        const result = await tool.fn(args);
        history.push({
          type: "function_call_output",
          call_id: functionCall.call_id,
          output: JSON.stringify(result),
        });
      }
    }

    if (!completed) {
      throw new Error(`Tool calling 超過 ${MAX_TOOL_ROUNDS} 輪，已停止執行`);
    }
  }
} catch (err) {
  if (err.name === "ExitPromptError") {
    console.log("\n再會~");
  } else {
    throw err;
  }
}