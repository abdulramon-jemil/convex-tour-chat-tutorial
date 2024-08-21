import { api } from "./_generated/api"
import { query, mutation } from "./_generated/server"
import { v } from "convex/values"
import { AI_MESSAGE_AUTHOR_FIELD_VALUE } from "./base"

const MESSAGE_BODY_AI_TRIGGER = "@ai"

export const list = query({
  args: {},
  handler: async (ctx) => {
    // Grab the most recent messages.
    const messages = await ctx.db.query("messages").order("desc").take(100)
    const messagesWithLikes = await Promise.all(
      messages.map(async (message) => {
        // Find the likes for each message

        const likes = await ctx.db
          .query("likes")
          .withIndex("byMessageId", (q) => q.eq("messageId", message._id))
          .collect()
        return { ...message, likes: likes.length }
      })
    )

    // Reverse the list so that it's in a chronological order.
    return messagesWithLikes.reverse().map((message) => {
      return { ...message, body: message.body.replace(/\:\)/g, "😀") }
    })
  }
})

export const send = mutation({
  args: { body: v.string(), author: v.string() },
  handler: async (ctx, { body, author }) => {
    // Send a new message.
    await ctx.db.insert("messages", { body, author })

    if (
      body.startsWith(MESSAGE_BODY_AI_TRIGGER) &&
      author !== AI_MESSAGE_AUTHOR_FIELD_VALUE
    ) {
      // Schedule the chat action to run immediately
      await ctx.scheduler.runAfter(0, api.ai.chat, { messageBody: body })
    }
  }
})

export const like = mutation({
  args: { liker: v.string(), messageId: v.id("messages") },
  handler: async (ctx, { liker, messageId }) => {
    await ctx.db.insert("likes", { liker, messageId })
  }
})
