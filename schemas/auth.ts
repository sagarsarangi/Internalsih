import { z } from "zod";

export const LoginPayloadSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export type LoginPayload = z.infer<typeof LoginPayloadSchema>;

export const SessionPayloadSchema = z.object({
  username: z.string(),
  role: z.literal("admin").default("admin"),
  iat: z.number().optional(),
  exp: z.number().optional(),
});

export type SessionPayload = z.infer<typeof SessionPayloadSchema>;
