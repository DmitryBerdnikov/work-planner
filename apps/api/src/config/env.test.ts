import { describe, expect, it } from "vitest";
import { parseEnv } from "./env.js";

describe("parseEnv", () => {
  it("defaults API_HOST to localhost for development", () => {
    expect(parseEnv({}).API_HOST).toBe("127.0.0.1");
  });

  it("accepts an API_HOST override for container runtime", () => {
    expect(parseEnv({ API_HOST: "0.0.0.0" }).API_HOST).toBe("0.0.0.0");
  });
});
