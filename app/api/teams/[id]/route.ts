import { NextRequest, NextResponse } from "next/server";
import { notion } from "@/lib/notionClient";
import { type Team } from "@/types/team";

// Convert Notion page to app team format
const convertNotionPageToTeam = (page: any): Team => {
  const props = page.properties || {};
  
  return {
    id: page.id,
    url: page.url,
    teamName: props["Team Name"]?.title?.[0]?.plain_text || "",
    teamPaste: props["Team Paste"]?.rich_text?.[0]?.plain_text || "",
    format: props["Format"]?.select?.name || undefined,
    generation: props["Generation"]?.select?.name || undefined,
    strategy: props["Strategy Notes"]?.rich_text?.[0]?.plain_text || undefined,
    keyPokemon: props["Key Pokemon"]?.multi_select?.map((item: any) => item.name) || undefined,
    lastUpdated: props["Last Updated"]?.date?.start || undefined,
    createdTime: page.created_time,
  };
};

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    const page = await notion.pages.retrieve({ page_id: id });
    const team = convertNotionPageToTeam(page);

    return NextResponse.json({ team });
  } catch (error) {
    console.error("Error fetching team:", error);
    return NextResponse.json(
      { error: "Failed to fetch team", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { teamPaste, teamName, format, generation, strategy, keyPokemon } = body;

    if (!process.env.NOTION_API_KEY) {
      return NextResponse.json(
        { error: "NOTION_API_KEY environment variable is not set" },
        { status: 500 }
      );
    }

    // Prepare properties for Notion API
    const properties: any = {};

    if (teamName !== undefined) {
      properties["Team Name"] = {
        title: [{ text: { content: teamName } }],
      };
    }

    if (teamPaste !== undefined) {
      properties["Team Paste"] = {
        rich_text: [{ text: { content: teamPaste } }],
      };
    }

    if (format !== undefined) {
      properties["Format"] = format
        ? { select: { name: format } }
        : { select: null };
    }

    if (generation !== undefined) {
      properties["Generation"] = generation
        ? { select: { name: generation } }
        : { select: null };
    }

    if (strategy !== undefined) {
      properties["Strategy Notes"] = strategy
        ? { rich_text: [{ text: { content: strategy } }] }
        : { rich_text: [] };
    }

    if (keyPokemon !== undefined) {
      properties["Key Pokemon"] = {
        multi_select: Array.isArray(keyPokemon) && keyPokemon.length > 0
          ? keyPokemon.map((pokemon: string) => ({ name: pokemon }))
          : [],
      };
    }

    // Update Last Updated date
    properties["Last Updated"] = {
      date: {
        start: new Date().toISOString().split("T")[0],
      },
    };

    const response = await notion.pages.update({
      page_id: id,
      properties,
    });

    const team = convertNotionPageToTeam(response);

    return NextResponse.json({ team });
  } catch (error) {
    console.error("Error updating team:", error);
    return NextResponse.json(
      { error: "Failed to update team", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!process.env.NOTION_API_KEY) {
      return NextResponse.json(
        { error: "NOTION_API_KEY environment variable is not set" },
        { status: 500 }
      );
    }

    // Archive the page (Notion doesn't have delete, only archive)
    await notion.pages.update({
      page_id: id,
      archived: true,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting team:", error);
    return NextResponse.json(
      { error: "Failed to delete team", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
