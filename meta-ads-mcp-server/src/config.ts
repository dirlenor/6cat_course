export type MetaConfig = {
  accessToken: string;
  adAccountId: string;
  graphApiVersion: string;
};

export function normalizeAdAccountId(value: string): string {
  const numericId = value.trim().replace(/^act_/, "");
  if (!/^\d{5,30}$/.test(numericId)) {
    throw new Error("META_AD_ACCOUNT_ID must be the numeric ad account ID, with or without the act_ prefix.");
  }
  return `act_${numericId}`;
}
export function getMetaConfig(env: NodeJS.ProcessEnv = process.env): MetaConfig {
  const accessToken = env.META_ACCESS_TOKEN?.trim();
  const adAccountId = env.META_AD_ACCOUNT_ID?.trim();
  const graphApiVersion = env.META_GRAPH_API_VERSION?.trim();

  if (!accessToken || accessToken === "replace_with_system_user_token") {
    throw new Error("Missing META_ACCESS_TOKEN. Add a Meta System User token to the MCP connection environment.");
  }
  if (!adAccountId || adAccountId === "replace_with_numeric_ad_account_id") {
    throw new Error("Missing META_AD_ACCOUNT_ID. Add the numeric Meta ad account ID to the MCP connection environment.");
  }
  if (!graphApiVersion || !/^v\d+\.\d+$/.test(graphApiVersion) || graphApiVersion === "vXX.0") {
    throw new Error("Missing META_GRAPH_API_VERSION. Set a supported version from your Meta app dashboard, for example vXX.0.");
  }

  return {
    accessToken,
    adAccountId: normalizeAdAccountId(adAccountId),
    graphApiVersion
  };
}
