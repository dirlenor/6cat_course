import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { resultContent, readError, number, paginationMeta, type ResponseFormat } from "./format.js";
import { MetaClient } from "./meta-client.js";

const server = new McpServer({ name: "meta-ads-mcp-server", version: "0.1.0" });
const responseFormat = z.enum(["markdown", "json"]);
const datePreset = z.enum(["today", "yesterday", "last_7d", "last_30d", "this_month", "last_month"]);
const level = z.enum(["campaign", "adset", "ad"]);

function client() {
  return new MetaClient();
}

function actionValue(actions: Array<{ action_type?: string; value?: string }> | undefined, actionType: string) {
  return number(actions?.find((action) => action.action_type === actionType)?.value);
}

server.registerTool(
  "meta_ads_get_account",
  {
    title: "Get Meta Ads Account",
    description: "Read the configured Meta ad account's name, currency, spend limit, and account status. This tool never changes Meta data.",
    inputSchema: { response_format: responseFormat.default("markdown") },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true }
  },
  async ({ response_format }) => {
    try {
      const api = client();
      const account = await api.get<Record<string, unknown>>(api.adAccountId, {
        fields: "id,name,account_status,currency,amount_spent,spend_cap,balance"
      });
      const output = { ad_account: account };
      const markdown = `# Meta ad account\n\n- **Name:** ${String(account.name ?? "Unknown")}\n- **ID:** ${String(account.id ?? api.adAccountId)}\n- **Currency:** ${String(account.currency ?? "Unknown")}\n- **Status:** ${String(account.account_status ?? "Unknown")}\n- **Amount spent:** ${String(account.amount_spent ?? "0")}`;
      return resultContent(output, markdown, response_format as ResponseFormat);
    } catch (error) {
      return readError(error);
    }
  }
);

server.registerTool(
  "meta_ads_list_campaigns",
  {
    title: "List Meta Ads Campaigns",
    description: "List campaigns in the configured Meta ad account with status, objective, budgets, and dates. Use the returned next_cursor to fetch the next page. This tool never changes Meta data.",
    inputSchema: {
      limit: z.number().int().min(1).max(100).default(25).describe("Campaigns to return, from 1 to 100."),
      after: z.string().min(1).optional().describe("Cursor returned as next_cursor by an earlier call."),
      response_format: responseFormat.default("markdown")
    },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true }
  },
  async ({ limit, after, response_format }) => {
    try {
      const api = client();
      const response = await api.list<Record<string, unknown>>(`${api.adAccountId}/campaigns`, {
        fields: "id,name,status,effective_status,objective,daily_budget,lifetime_budget,start_time,stop_time,created_time,updated_time",
        limit,
        after
      });
      const campaigns = response.data ?? [];
      const output = { count: campaigns.length, campaigns, ...paginationMeta(response.paging) };
      const rows = campaigns.map((campaign) => `- **${String(campaign.name ?? "Untitled")}** (${String(campaign.id ?? "Unknown")}) — ${String(campaign.effective_status ?? campaign.status ?? "Unknown")}, ${String(campaign.objective ?? "No objective")}`);
      const markdown = ["# Meta campaigns", "", `Showing ${campaigns.length} campaign(s).`, "", ...(rows.length ? rows : ["No campaigns found."])].join("\n");
      return resultContent(output, markdown, response_format as ResponseFormat);
    } catch (error) {
      return readError(error);
    }
  }
);

server.registerTool(
  "meta_ads_get_overview",
  {
    title: "Get Meta Ads Overview",
    description: "Read account-level Meta Ads performance for a standard period, including spend, reach, impressions, clicks, CTR, CPC, CPM, purchases, and purchase value when Meta reports them. This tool never changes Meta data.",
    inputSchema: {
      date_preset: datePreset.default("last_7d").describe("Reporting period, such as last_7d or last_30d."),
      response_format: responseFormat.default("markdown")
    },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true }
  },
  async ({ date_preset, response_format }) => {
    try {
      const api = client();
      const response = await api.list<{ spend?: string; reach?: string; impressions?: string; clicks?: string; inline_link_clicks?: string; ctr?: string; cpc?: string; cpm?: string; actions?: Array<{ action_type?: string; value?: string }>; action_values?: Array<{ action_type?: string; value?: string }> }>(`${api.adAccountId}/insights`, {
        fields: "spend,reach,impressions,clicks,inline_link_clicks,ctr,cpc,cpm,actions,action_values",
        date_preset,
        level: "account",
        limit: 1
      });
      const metrics = response.data?.[0] ?? {};
      const output = {
        date_preset,
        spend: number(metrics.spend),
        reach: number(metrics.reach),
        impressions: number(metrics.impressions),
        clicks: number(metrics.clicks),
        link_clicks: number(metrics.inline_link_clicks),
        ctr: number(metrics.ctr),
        cpc: number(metrics.cpc),
        cpm: number(metrics.cpm),
        purchases: actionValue(metrics.actions, "purchase"),
        purchase_value: actionValue(metrics.action_values, "purchase"),
        raw_actions: metrics.actions ?? []
      };
      const markdown = `# Meta Ads overview — ${date_preset}\n\n- **Spend:** ${output.spend}\n- **Reach:** ${output.reach}\n- **Impressions:** ${output.impressions}\n- **Link clicks:** ${output.link_clicks}\n- **CTR:** ${output.ctr}%\n- **CPC:** ${output.cpc}\n- **CPM:** ${output.cpm}\n- **Purchases:** ${output.purchases}\n- **Purchase value:** ${output.purchase_value}`;
      return resultContent(output, markdown, response_format as ResponseFormat);
    } catch (error) {
      return readError(error);
    }
  }
);

server.registerTool(
  "meta_ads_get_campaign_insights",
  {
    title: "Get Meta Ads Campaign Insights",
    description: "Read campaign, ad set, or ad performance for a standard period. Returns spend and delivery metrics plus the raw Meta conversion actions, without changing Meta data.",
    inputSchema: {
      level: level.default("campaign").describe("Reporting level: campaign, adset, or ad."),
      date_preset: datePreset.default("last_7d").describe("Reporting period, such as last_7d or last_30d."),
      limit: z.number().int().min(1).max(100).default(25).describe("Rows to return, from 1 to 100."),
      after: z.string().min(1).optional().describe("Cursor returned as next_cursor by an earlier call."),
      response_format: responseFormat.default("markdown")
    },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true }
  },
  async ({ level: selectedLevel, date_preset, limit, after, response_format }) => {
    try {
      const api = client();
      const response = await api.list<Record<string, unknown>>(`${api.adAccountId}/insights`, {
        fields: "campaign_id,campaign_name,adset_id,adset_name,ad_id,ad_name,spend,reach,impressions,clicks,inline_link_clicks,ctr,cpc,cpm,actions,action_values",
        level: selectedLevel,
        date_preset,
        limit,
        after
      });
      const insights = response.data ?? [];
      const output = { level: selectedLevel, date_preset, count: insights.length, insights, ...paginationMeta(response.paging) };
      const rows = insights.map((item) => {
        const name = item[`${selectedLevel}_name`] ?? item.campaign_name ?? "Untitled";
        return `- **${String(name)}** — spend ${String(item.spend ?? "0")}, link clicks ${String(item.inline_link_clicks ?? "0")}, CTR ${String(item.ctr ?? "0")}%`;
      });
      const markdown = ["# Meta Ads insights", "", `**Level:** ${selectedLevel} · **Period:** ${date_preset}`, "", ...(rows.length ? rows : ["No insight rows returned for this period."])].join("\n");
      return resultContent(output, markdown, response_format as ResponseFormat);
    } catch (error) {
      return readError(error);
    }
  }
);

await server.connect(new StdioServerTransport());
