import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("tasks").collect();
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    notes: v.optional(v.string()),
    cadence: v.union(
      v.literal("daily"),
      v.literal("weekly"),
      v.literal("monthly"),
      v.literal("none"),
    ),
    priority: v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
    ),
  },
  handler: async (ctx, args) => {
    const searchText = `${args.title} ${args.notes ?? ""}`.trim();
    const now = Date.now();
    return await ctx.db.insert("tasks", {
      title: args.title,
      notes: args.notes,
      cadence: args.cadence,
      priority: args.priority,
      column: "inbox",
      searchText,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("tasks"),
    title: v.optional(v.string()),
    notes: v.optional(v.string()),
    cadence: v.optional(
      v.union(
        v.literal("daily"),
        v.literal("weekly"),
        v.literal("monthly"),
        v.literal("none"),
      ),
    ),
    priority: v.optional(
      v.union(
        v.literal("low"),
        v.literal("medium"),
        v.literal("high"),
      ),
    ),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) {
      throw new Error(`Task ${args.id} not found`);
    }

    const title = args.title ?? existing.title;
    const notes = args.notes ?? existing.notes;
    const searchText = `${title} ${notes ?? ""}`.trim();

    const updates: Record<string, unknown> = {
      searchText,
      updatedAt: Date.now(),
    };
    if (args.title !== undefined) updates.title = args.title;
    if (args.notes !== undefined) updates.notes = args.notes;
    if (args.cadence !== undefined) updates.cadence = args.cadence;
    if (args.priority !== undefined) updates.priority = args.priority;

    await ctx.db.patch(args.id, updates);
  },
});

export const remove = mutation({
  args: {
    id: v.id("tasks"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
