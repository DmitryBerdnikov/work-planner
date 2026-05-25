import { createAuthClient } from "better-auth/react";
import { config } from "../config/env";

export const authClient = createAuthClient({
  baseURL: config.apiBaseUrl
});
