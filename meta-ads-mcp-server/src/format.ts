export type ResponseFormat = "markdown" | "json";

export function paginationMeta(paging: { cursors?: { after?: string }; next?: string } | undefined) {
  return {
    has_more: Boolean(paging?.next),
    next_cursor: paging?.cursors?.after ?? null
  };
}

export function resultContent<T extends Record<string, unknown>>(output: T, markdown: string, responseFormat: ResponseFormat) {
  return {
    content: [{ type: "text" as const, text: responseFormat === "json" ? JSON.stringify(output, null, 2) : markdown }],
    structuredContent: output
  };
}

export function readError(error: unknown) {
  const message = error instanceof Error ? error.message : "Unknown error";
  return {
    isError: true,
    content: [{ type: "text" as const, text: `${message} Check the MCP connection environment and that the System User can access this ad account.` }]
  };
}

export function number(value: string | number | undefined): number {
  const result = Number(value ?? 0);
  return Number.isFinite(result) ? result : 0;
}
