import { NextRequest, NextResponse } from "next/server";

const DATA_SOURCE_ID = "f9b4bc2c-557b-4f90-b7c5-d08cce4c2cce";

/**
 * This route creates a team in Notion using MCP
 * 
 * Since MCP tools aren't available in Next.js runtime,
 * this route prepares the data and the AI assistant makes the actual call.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { parent, team } = body;

    // Prepare properties for Notion - matching the exact database schema
    const properties: Record<string, any> = {
      "Team Name": team["Team Name"],
      "Team Paste": team["Team Paste"],
    };

    // Add optional properties only if they have values
    if (team["Format"]) {
      properties["Format"] = team["Format"];
    }
    if (team["Generation"]) {
      properties["Generation"] = team["Generation"];
    }
    if (team["Strategy Notes"]) {
      properties["Strategy Notes"] = team["Strategy Notes"];
    }
    if (team["Key Pokemon"] && Array.isArray(team["Key Pokemon"]) && team["Key Pokemon"].length > 0) {
      properties["Key Pokemon"] = team["Key Pokemon"];
    }

    // Set Last Updated date
    const today = new Date().toISOString().split("T")[0];
    properties["date:Last Updated:start"] = today;
    properties["date:Last Updated:is_datetime"] = 0;

    // MCP call structure - this is what needs to be called
    const mcpCallParams = {
      parent: { data_source_id: DATA_SOURCE_ID },
      pages: [{ properties }],
    };

    // Log for the AI assistant to make the call
    console.log("\n" + "=".repeat(50));
    console.log("NOTION MCP CALL - CREATE TEAM");
    console.log("=".repeat(50));
    console.log("Team Name:", team["Team Name"]);
    console.log("Format:", team["Format"] || "Not specified");
    console.log("Generation:", team["Generation"] || "Not specified");
    console.log("\nMCP Call Parameters:");
    console.log(JSON.stringify(mcpCallParams, null, 2));
    console.log("=".repeat(50) + "\n");
    
    // Return the structure - the AI assistant will make the actual MCP call
    // For now, return 501 to indicate MCP call is needed
    return NextResponse.json({
      error: "MCP call required",
      message: "The AI assistant needs to make the MCP call to create this team",
      mcpCall: {
        tool: "notion-create-pages",
        params: mcpCallParams,
      },
      teamInfo: {
        name: team["Team Name"],
        format: team["Format"],
        generation: team["Generation"],
      },
    }, { status: 501 });
  } catch (error) {
    console.error("Error in create-page route:", error);
    return NextResponse.json(
      { error: "Failed to create page", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
