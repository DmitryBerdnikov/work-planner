import { z } from "zod";

export const authModeSchema = z.enum(["login", "register"]);
export type AuthMode = z.infer<typeof authModeSchema>;

export const authCredentialsSchema = z.object({
  email: z.email(),
  password: z.string().min(8, "Пароль должен быть не короче 8 символов")
});

export type AuthCredentials = z.infer<typeof authCredentialsSchema>;

export const defaultAuthCredentials: AuthCredentials = {
  email: "",
  password: ""
};
