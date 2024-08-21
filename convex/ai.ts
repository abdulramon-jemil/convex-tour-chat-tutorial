import { action } from "./_generated/server"
import { api } from "./_generated/api"
import { v } from "convex/values"
import { AI_MESSAGE_AUTHOR_FIELD_VALUE } from "./base"

const TOGETHERAI_API_KEY = process.env.TOGETHERAI_API_KEY!
const CHOSEN_TOGETHERAI_CHAT_MODEL = "meta-llama/Llama-3-8b-chat-hf"
const TOGETHERAI_CHAT_ENDPOINT = "https://api.together.xyz/v1/chat/completions"

export const chat = action({
  args: { messageBody: v.string() },
  handler: async (ctx, args) => {
    const response = await fetch(TOGETHERAI_CHAT_ENDPOINT, {
      method: "POST",
      headers: {
        // Set the Authorization header with your API key
        Authorization: `Bearer ${TOGETHERAI_API_KEY}`,
        "Content-Type": "application/json"
      },

      body: JSON.stringify({
        model: CHOSEN_TOGETHERAI_CHAT_MODEL,
        messages: [
          {
            // Provide a 'system' message giving context about how to respond
            role: "system",
            content:
              "You are a terse bot in a group chat responding to questions with 1-sentence answers."
          },
          {
            // Pass on the chat user's message to the AI agent
            role: "user",
            content: args.messageBody
          }
        ]
      })
    })

    const resposeJSON = await response.json()
    const messageContent = resposeJSON.choices[0].message?.content as
      | string
      | undefined

    // Send AI's response as a new message
    await ctx.runMutation(api.messages.send, {
      author: AI_MESSAGE_AUTHOR_FIELD_VALUE,
      body: messageContent || "Sorry, I don't have an answer for that."
    })
  }
})
