# Meta Ads MCP Server

This is a local, read-only MCP server for asking questions about one Meta ad account from Codex. It does not create, publish, pause, or edit campaigns, ad sets, ads, audiences, or budgets.

## Included tools

- `meta_ads_get_account` — account identity, currency, and status
- `meta_ads_list_campaigns` — paginated campaign list
- `meta_ads_get_overview` — account-level spend and conversion summary
- `meta_ads_get_campaign_insights` — paginated campaign, ad set, or ad metrics

## Meta setup

1. In Meta Business Settings, create a **System User** for this integration.
2. Give that System User access to only the intended ad account.
3. Create a System User access token for your Meta app with the minimum approved read permissions needed for Marketing API reporting, typically `ads_read`. Do not grant `ads_management` to this read-only server.
4. In the Meta app dashboard, find a currently supported Graph API version.

Do not paste the token into source files or commit it. Use the MCP connection's secret environment instead.

## Codex connection configuration

After installing dependencies and building, add a local MCP configuration similar to this to `~/.codex/config.toml`. Replace the placeholder values in your local secret store/configuration; keep the token private.

```toml
[mcp_servers.meta_ads]
command = "node"
args = ["/Users/apple/Documents/ChatGPT/6CAT_COURSE/meta-ads-mcp-server/dist/src/index.js"]

[mcp_servers.meta_ads.env]
META_ACCESS_TOKEN = "<system-user-token>"
META_AD_ACCOUNT_ID = "<numeric-ad-account-id>"
META_GRAPH_API_VERSION = "<supported-version-from-meta>"
```

The test command exercises local input validation only. After the account is connected, validate the integration by calling `meta_ads_get_account`, then `meta_ads_get_overview` with `date_preset: "last_7d"`.
