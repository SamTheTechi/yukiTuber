import { z } from "zod"

export const URLSchema = z.object({
  url: z.string(),
  quality: z.string().optional().default("720")
}).strict()

export type URL = z.infer<typeof URLSchema>;
