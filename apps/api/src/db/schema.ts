import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const profiles = sqliteTable("profiles", {
  userId: text("user_id").primaryKey(),
  email: text("email").notNull().unique(),
  status: text("status", { enum: ["pending", "active", "blocked"] }).notNull().default("pending"),
  activatedAt: text("activated_at"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull()
});

export const clients = sqliteTable("clients", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  label: text("label").notNull().default(""),
  city: text("city").notNull().default(""),
  phone: text("phone").notNull().default(""),
  telegram: text("telegram").notNull().default(""),
  vk: text("vk").notNull().default(""),
  instagram: text("instagram").notNull().default(""),
  note: text("note").notNull().default(""),
  customData: text("custom_data", { mode: "json" }).notNull().default("{}"),
  archivedAt: text("archived_at"),
  deletedAt: text("deleted_at"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
  revision: integer("revision").notNull().default(0)
});

export const appointments = sqliteTable("appointments", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  clientId: text("client_id"),
  startsAt: text("starts_at").notNull(),
  title: text("title").notNull(),
  type: text("type", { enum: ["work", "personal"] }).notNull(),
  status: text("status", { enum: ["scheduled", "cancelled"] }).notNull().default("scheduled"),
  sessionAmount: integer("session_amount").notNull().default(0),
  prepaymentAmount: integer("prepayment_amount").notNull().default(0),
  note: text("note").notNull().default(""),
  customData: text("custom_data", { mode: "json" }).notNull().default("{}"),
  deletedAt: text("deleted_at"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
  revision: integer("revision").notNull().default(0)
});

export const attachments = sqliteTable("attachments", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  appointmentId: text("appointment_id").notNull(),
  storageKey: text("storage_key").notNull(),
  originalName: text("original_name").notNull(),
  mimeType: text("mime_type").notNull(),
  sizeBytes: integer("size_bytes").notNull(),
  createdAt: text("created_at").notNull(),
  deletedAt: text("deleted_at"),
  revision: integer("revision").notNull().default(0)
});

export const schema = {
  profiles,
  clients,
  appointments,
  attachments
};
