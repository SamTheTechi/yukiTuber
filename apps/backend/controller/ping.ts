import { type Context } from "hono";

export const ping = async (c: Context) => {
  return c.text("Pong");
}



