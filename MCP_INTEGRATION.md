# Notion MCP Integration Guide

## Current Status

The app is set up to use Notion MCP tools, but the API routes need to be connected to actually call the MCP tools. The structure is ready - you just need to implement the MCP calls.

## How to Implement

Since you're using Cursor with Notion MCP available, here are your options:

### Option 1: Direct MCP Implementation (Recommended for Cursor)

Update the API routes in `app/api/notion/` to actually call the MCP tools. The structure is already prepared - you just need to add the MCP tool calls.

For example, in `app/api/notion/create-page/route.ts`, replace the placeholder with:

```typescript
// After preparing the properties, call the MCP tool:
const result = await mcp_Notion_notion-create-pages({
  parent: { data_source_id: DATA_SOURCE_ID },
  pages: [{ properties }],
});

return NextResponse.json({
  id: result.pages[0].id,
  url: result.pages[0].url,
  properties: team,
});
```

### Option 2: Use AI Assistant to Make MCP Calls

Since the AI assistant (me) has access to MCP tools, you can:

1. Ask me to implement the MCP calls in the routes
2. Or have me make the MCP calls directly when you need to create/update teams

### Option 3: Set Up MCP Server

Create a separate MCP server that exposes the tools via HTTP, then call it from the API routes.

## Quick Fix

To get it working right now, I can implement the MCP calls directly. Just ask me to:
- "Implement the MCP calls in the API routes"
- Or "Create a team using MCP" and I'll show you how

## Files That Need MCP Integration

1. `app/api/notion/create-page/route.ts` - Create teams
2. `app/api/notion/search/route.ts` - Search/fetch teams  
3. `app/api/notion/update-page/route.ts` - Update teams
4. `app/api/notion/delete-page/route.ts` - Delete teams

All files have the structure ready - they just need the actual MCP tool calls added.

