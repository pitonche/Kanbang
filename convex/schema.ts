import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  tasks: defineTable({
    // Core fields
    title: v.string(),
    notes: v.optional(v.string()),

    // Board position
    column: v.union(
      v.literal("backlog"),
      v.literal("in_progress"),
      v.literal("needs_info"),
      v.literal("done"),
      v.literal("archived"),
    ),

    // Task metadata
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

    // Timestamps (milliseconds since epoch via Date.now())
    createdAt: v.number(),
    updatedAt: v.number(),
    completedAt: v.optional(v.number()),
    archivedAt: v.optional(v.number()),

    // Composite search field (title + notes, computed at write time)
    searchText: v.string(),
  })
    // Database index: query tasks by column (for board rendering)
    .index("by_column", ["column"])
    .index("by_column_completedAt", ["column", "completedAt"])
    // Full-text search index: search across title+notes via searchText
    .searchIndex("search_text", {
      searchField: "searchText",
      filterFields: ["column"],
    }),
});
