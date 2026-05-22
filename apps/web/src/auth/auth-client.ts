import { createAuthClient } from "better-auth/react";
import { config } from "../config.js";

export const authClient = createAuthClient({
  baseURL: config.apiBaseUrl
});

