import { client, DEFAULT_MODEL } from "./lib/openai.js";
import { calculateTool, calculate } from "./tools/calculator.js";
import { spinner } from "./utils/spinner.js";

const AVAILABLE_TOOLS = {
  calculate,
};

const tools = [calculateTool];
const MAX_TOOL_ROUNDS = 8;

const history = [
  {
    role: "user",
    content:
      "請幫我計算 10 + 4 * 2",
  },
];

let completed = false;

for (let round = 1; round <= MAX_TOOL_ROUNDS; round += 1) {
  const spin = spinner("思考中...").start();

  const response = await client.responses.create({
    model: DEFAULT_MODEL,
    input: history,
    tools,
    tool_choice: "auto",
  });

  spin.stop();

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
    const args = JSON.parse(functionCall.arguments);
    console.log(`\n[呼叫 tool] ${fnName}(${JSON.stringify(args)})`);

    const fn = AVAILABLE_TOOLS[fnName];
    const result = await fn(args);

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