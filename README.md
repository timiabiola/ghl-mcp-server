# GoHighLevel MCP Server

A Claude Code plugin providing 314 tools across 28 categories for the GoHighLevel API v2.

## Categories
Contacts · Conversations · Calendars · Opportunities · Workflows · Campaigns · Users · Businesses · Invoices · Payments · Forms · Surveys · Products · Funnels · Blogs · Social Media · Locations · Trigger Links · Emails · Media Library · Custom Objects · Associations · Custom Fields · Courses · Store · SaaS · Snapshots · Voice AI · Documents & Contracts · Phone System · Companies · Custom Menus

## Installation

### As a Claude Code plugin (recommended)
```
/plugin marketplace add <your-username>/ghl-mcp-server
/plugin install ghl-mcp@ghl-mcp-server
```

### Manually
```bash
git clone <repo-url> ~/.claude/mcp-servers/ghl-mcp-server
cd ~/.claude/mcp-servers/ghl-mcp-server
npm install

claude mcp add ghl-api -s user \
  -e GHL_API_KEY=pit-your-token \
  -e GHL_LOCATION_ID=your-location-id \
  -- node ~/.claude/mcp-servers/ghl-mcp-server/src/index.js
```

## Configuration

Set these environment variables:
- `GHL_API_KEY` — Your Private Integration Token from GHL (Settings → Private Integrations)
- `GHL_LOCATION_ID` — Your sub-account/location ID

See `.env.example` for reference.

## Required scopes
For full functionality, enable all available scopes when creating your Private Integration Token in GoHighLevel.
