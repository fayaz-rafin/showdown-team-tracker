import { NextRequest, NextResponse } from "next/server";
import { notion, DATABASE_ID } from "@/lib/notionClient";
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

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const format = searchParams.get("format") || undefined;
    const generation = searchParams.get("generation") || undefined;
    const strategy = searchParams.get("strategy") || undefined;

    // Build filter for Notion API
    const filters: any[] = [];
    
    if (format) {
      filters.push({
        property: "Format",
        select: { equals: format },
      });
    }
    
    if (generation) {
      filters.push({
        property: "Generation",
        select: { equals: generation },
      });
    }
    
    if (strategy) {
      filters.push({
        property: "Strategy Notes",
        rich_text: { contains: strategy },
      });
    }

    const response = await notion.databases.query({
      database_id: DATABASE_ID,
      filter: filters.length > 0 ? { and: filters } : undefined,
    });

    const teams = response.results.map(convertNotionPageToTeam);

    return NextResponse.json({ teams });
  } catch (error) {
    console.error("Error fetching teams:", error);
    return NextResponse.json(
      { error: "Failed to fetch teams", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { teamPaste, teamName, format, generation, strategy, keyPokemon } = body;

    if (!teamPaste) {
      return NextResponse.json(
        { error: "Team paste is required" },
        { status: 400 }
      );
    }

    if (!process.env.NOTION_API_KEY) {
      return NextResponse.json(
        { error: "NOTION_API_KEY environment variable is not set" },
        { status: 500 }
      );
    }

    // Prepare properties for Notion API
    const properties: any = {
      "Team Name": {
        title: [{ text: { content: teamName || "Untitled Team" } }],
      },
      "Team Paste": {
        rich_text: [{ text: { content: teamPaste } }],
      },
    };

    if (format) {
      properties["Format"] = {
        select: { name: format },
      };
    }

    if (generation) {
      properties["Generation"] = {
        select: { name: generation },
      };
    }

    if (strategy) {
      properties["Strategy Notes"] = {
        rich_text: [{ text: { content: strategy } }],
      };
    }

    if (keyPokemon && Array.isArray(keyPokemon) && keyPokemon.length > 0) {
      properties["Key Pokemon"] = {
        multi_select: keyPokemon.map((pokemon: string) => ({ name: pokemon })),
      };
    }

    // Set Last Updated date
    properties["Last Updated"] = {
      date: {
        start: new Date().toISOString().split("T")[0],
      },
    };

    // Create page in Notion database
    const response = await notion.pages.create({
      parent: {
        database_id: DATABASE_ID,
      },
      properties,
    });

    const team = convertNotionPageToTeam(response);

    return NextResponse.json({ team }, { status: 201 });
  } catch (error) {
    console.error("Error creating team:", error);
    return NextResponse.json(
      { 
        error: "Failed to create team", 
        details: error instanceof Error ? error.message : "Unknown error",
        hint: error instanceof Error && error.message.includes("API key") 
          ? "Make sure NOTION_API_KEY is set in your .env.local file"
          : undefined
      },
      { status: 500 }
    );
  }
}
