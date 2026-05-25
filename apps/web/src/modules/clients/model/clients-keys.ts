export const clientsKeys = {
  all: ["clients"] as const,
  list: (params: { query: string; includeArchived: boolean }) => ["clients", params] as const
};
