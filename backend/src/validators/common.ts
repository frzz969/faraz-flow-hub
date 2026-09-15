import { z } from "zod";

/** Shared pagination query: ?q=&limit=&offset= */
export const paginationSchema = z.object({
  q: z.string().trim().max(190).optional(),
  limit: z.coerce.number().int().min(1).max(200).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export type PaginationQuery = z.infer<typeof paginationSchema>;

/** Shared `:id` route param (numeric primary key). */
export const idParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export type IdParam = z.infer<typeof idParamSchema>;
