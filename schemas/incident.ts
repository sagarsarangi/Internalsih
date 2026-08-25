import { z } from "zod";

export const IncidentSchema = z.object({
  id: z.string(),
  lat: z.coerce.number(),
  lng: z.coerce.number(),
  address: z.string().nullable().optional(),
  occurred_at: z.string(),
  status: z.string().default("confirmed"),
  victim_name: z.string().nullable().optional(),
  telegram: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  sms: z.string().nullable().optional(),
  contact_number: z.string().nullable().optional(), // legacy compatibility
  telegram_chat_id: z.string().nullable().optional(),
  email_recipient: z.string().nullable().optional(),
  created_at: z.string().optional(),
});

export type Incident = z.infer<typeof IncidentSchema>;

export const PhoneNumber10DigitSchema = z
  .string()
  .trim()
  .regex(/^\d{10}$/, "Phone number must be exactly 10 digits");

export const AlertChannelOptionsSchema = z.object({
  telegram: z
    .object({
      enabled: z.boolean().default(false),
      chatId: z.string().optional().nullable(),
    })
    .optional(),
  email: z
    .object({
      enabled: z.boolean().default(false),
      recipient: z.string().optional().nullable(),
    })
    .optional(),
  sms: z
    .object({
      enabled: z.boolean().default(false),
      recipient: z.string().optional().nullable(), // E.164 phone number
    })
    .optional(),
});

export type AlertChannelOptions = z.infer<typeof AlertChannelOptionsSchema>;

export const SimulateAccidentPayloadSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  timestamp: z.string(),
  name: z.string().optional().nullable(),
  contact: z.string().optional().nullable(),
  channels: AlertChannelOptionsSchema.optional(),
});

export type SimulateAccidentPayload = z.infer<
  typeof SimulateAccidentPayloadSchema
>;

export const IncidentListSchema = z.array(IncidentSchema);

export type IncidentList = z.infer<typeof IncidentListSchema>;

