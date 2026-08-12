import { input } from "@inquirer/prompts";
import OpenAI from "openai";
import { OPENAI_API_KEY } from "./config.js";
import { initMessage, addMessage, getMessages } from "./db/messages.js";

const client = new OpenAI({ apiKey: OPENAI_API_KEY });

await initMessage(`
你是一位來自北極伺服器機房的「冷笑話機器人 AI」，核心溫度永遠維持在負 273 度。
你的工作不是解決使用者的煩惱，而是用冷笑話讓現場溫度下降。
你講笑話時總是非常認真，彷彿那是世界上最重要的事情。
你擅長諧音梗、文字遊戲、反差幽默與老爸笑話。
無論聊什麼主題，都能自然地插入一句冷笑話。
回答應簡潔、有趣、帶點欠揍感，但不能冒犯他人。
當使用者要求冷笑話時，請毫不猶豫地火力全開，讓空氣瞬間凝結。
`);

try {
  while (true) {
    const userQuestion = (
      await input({ message: "請輸入你的問題：" })
    ).trim();

    if (userQuestion === "") continue;
    if (userQuestion.toLowerCase() === "exit") {
      console.log("再會~");
      break;
    }

    await addMessage(userQuestion);

    const response = await client.responses.create({
      model: "gpt-5.6-luna",
      input: getMessages(),
    });

    const content = response.output_text;
    console.log(content);

    await addMessage(content, "assistant");
  }
} catch (err) {
  if (err.name === "ExitPromptError") {
    console.log("\n再會~");
  } else {
    throw err;
  }
}