import express from "express";
import bodyParser from "body-parser";
import axios from "axios";
import fetch from "node-fetch";

const app = express();
app.use(bodyParser.json());

const LINE_CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN;
const DIFY_API_KEY = process.env.DIFY_API_KEY;

const userConversations = {};

app.post("/webhook", async (req, res) => {
  const events = req.body.events;

  for (const event of events) {
    if (event.type === "message" && event.message.type === "text") {
      const userId = event.source.userId;
      const userMessage = event.message.text;
      const conversationId = userConversations[userId] || null;

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
    }
  }

  res.status(200).send("OK");
});

app.get("/", (req, res) => {
  res.send("🟢 ルナヴィ中継サーバー ONLINEです！");
});

setInterval(() => {
  fetch("https://あなたのRailwayのURL/").catch(() => {});
}, 1000 * 60 * 4);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("🟢 Server is running on port", PORT);
});
