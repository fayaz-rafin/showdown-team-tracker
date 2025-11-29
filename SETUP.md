# Quick Setup Guide

## Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables (optional):
```bash
cp .env.example .env.local
# Edit .env.local with your MCP server endpoint if needed
```

## Running the App

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Connecting to Notion MCP

The app is ready to connect to your Notion MCP server. You have three options:

### Option 1: Direct MCP Integration (If MCP tools are available in Next.js)

Modify `lib/notionService.ts` to directly call MCP tools instead of HTTP requests.

### Option 2: MCP HTTP Server

1. Set up an HTTP server that exposes MCP tools
2. Configure `MCP_SERVER_ENDPOINT` in `.env.local`
3. The service layer will automatically use it

### Option 3: Use Cursor's MCP Integration

Since you're using Cursor with Notion MCP, you can:
1. Create server actions that use MCP tools directly
2. Or set up a proxy that forwards requests to MCP

## Current Status

✅ Project structure complete
✅ UI components built
✅ Team parser implemented
✅ API routes structured
✅ Notion service layer ready
⚠️ MCP connection needs to be configured (see README.md)

## Testing Without MCP

The app will show helpful error messages if MCP is not connected. You can still:
- Parse Pokemon Showdown teams
- See the UI and form structure
- Test the team parser locally

To fully test, connect your Notion MCP server.

