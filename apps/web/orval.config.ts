import { defineConfig } from "orval";

export default defineConfig({
  workPlanner: {
    input: {
      target: "../api/openapi.json"
    },
    output: {
      target: "src/shared/api/generated/work-planner-api.ts",
      client: "fetch",
      clean: true,
      override: {
        useTypeOverInterfaces: true,
        fetch: {
          includeHttpResponseReturnType: false
        },
        mutator: {
          path: "src/shared/api/orval-mutator.ts",
          name: "workPlannerApi"
        }
      }
    }
  }
});
