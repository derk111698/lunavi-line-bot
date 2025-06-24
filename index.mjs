import express from "express";
import bodyParser from "body-parser";
import axios from "axios";
import fetch from "node-fetch";

const app = express();
app.use(bodyParser.json());

// 🔑 環境変数の取得＆確認
const LINE_CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN?.trim();
const DIFY_API_KEY = process.env.DIFY_API_KEY?.trim();

console.log("🔧 LINE_TOKEN:", LINE_CHANNEL_ACCESS_TOKEN ? "[OK]" : "[MISSING]");
console.log("🔧 DIFY_API_KEY:", DIFY_API_KEY ? "[OK]" : "[MISSING]");

const userConversations = {};

app.post("/webhook", async (req, res) => {
  const events = req.body.events;

  for (const event of events) {
    if (event.type === "message" && event.message.type === "text") {
      const userId = event.source.userId;
      const userMessage = event.message.text;
      const conversationId = userConversations[userId] || null;

      try {
        // 💬 Dify APIへのリクエスト
        console.log("📨 Sending to Dify:", userMessage);
        const response = await axios.post(
          "https://api.dify.ai/v1/chat-messages",
          {
            conversation_id: conversationId,
            inputs: {},
            query: userMessage,
            user: userId
          },
          {
            headers: {
              Authorization: `Bearer ${DIFY_API_KEY}`,
              "Content-Type": "application/json"
            }
          }
        );

        const difyReply = response.data.answer || "ルナヴィ、ちょっと分からなかったです💦もう少し詳しく教えてください！";

        if (response.data.conversation_id) {
          userConversations[userId] = response.data.conversation_id;
        }

        // 📤 LINEへの返信
        await axios.post(
          "https://api.line.me/v2/bot/message/reply",
          {
            replyToken: event.replyToken,
            messages: [{ type: "text", text: difyReply }]
          },
          {
            headers: {
              Authorization: `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`,
              "Content-Type": "application/json"
            }
          }
        );
      } catch (error) {
        console.error("❌ エラーが発生しました:", error.message);
        if (error.response) {
          console.error("📦 response data:", error.response.data);
        }
      }
    }
  }

  res.status(200).send("OK");
});

// 🚀 簡易確認ページ
app.get("/", (req, res) => {
  res.send("🟢 ルナヴィ中継サーバー ONLINEです！");
});

// 🌀 定期アクセスでスリープ防止
setInterval(() => {
  fetch("https://lunavi-line-bot-production.up.railway.app/").catch(() => {});
}, 1000 * 60 * 4); // 4分おき

// 🌐 ポート設定
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("🟢 Server is running on port", PORT);
});
