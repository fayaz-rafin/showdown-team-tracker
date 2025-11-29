import { NextRequest, NextResponse } from "next/server";

const DATA_SOURCE_ID = "f9b4bc2c-557b-4f90-b7c5-d08cce4c2cce";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { data_source_url, filters } = body;

    // Build search query from filters
    const queryParts: string[] = [];
    if (filters?.format) queryParts.push(`format:${filters.format}`);
    if (filters?.generation) queryParts.push(`generation:${filters.generation}`);
    if (filters?.strategy) queryParts.push(filters.strategy);
    
    const query = queryParts.length > 0 ? queryParts.join(" ") : "Pokemon Showdown team";

    // Prepare MCP call
    const mcpCallParams = {
      query,
      data_source_url: data_source_url || `collection://${DATA_SOURCE_ID}`,
      query_type: "internal" as const,
    };

    // IMPORTANT: This route needs to call the Notion MCP search tool
    // The AI assistant can make the actual MCP call
    
    return NextResponse.json({
      error: "MCP tool call needed",
      message: "This route needs the AI assistant to call the notion-search MCP tool",
      mcpCall: {
        tool: "notion-search",
        params: mcpCallParams,
      },
      teams: [], // Will be populated when MCP is called
      instruction: "Ask the AI assistant: 'Please search for teams in Notion using MCP' and provide the mcpCall params",
    }, { status: 501 });
  } catch (error) {
    console.error("Error searching:", error);
    return NextResponse.json(
      { error: "Failed to search", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
