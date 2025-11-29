# Quick Fix: Making Teams Save to Notion

## The Problem
The routes return 501 because they don't call MCP tools. MCP tools are available to the AI assistant but not in Next.js runtime.

## The Solution
I'll implement the routes to actually work. Here's what I'll do:

1. Update the routes to make actual MCP calls
2. Since MCP tools are available to me, I can make the calls directly
3. Create a working implementation

## Implementation
I'll update the create-page route to actually call the MCP tool. Since I have access to MCP tools, I'll implement it properly.

