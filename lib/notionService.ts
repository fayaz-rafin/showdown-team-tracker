// Notion MCP Service
// This service handles communication with the Notion MCP server
// NOTE: These functions need to be connected to your MCP server
// The MCP server should expose these operations via HTTP or another protocol

const NOTION_DATABASE_ID = "01791ac3-e808-4219-96d7-5709ecfeab62";
const DATA_SOURCE_ID = "f9b4bc2c-557b-4f90-b7c5-d08cce4c2cce";

export interface NotionTeam {
  "Team Name": string;
  "Team Paste": string;
  "Format"?: string;
  "Generation"?: string;
  "Strategy Notes"?: string;
  "Key Pokemon"?: string[];
  "date:Last Updated:start"?: string;
  "date:Last Updated:is_datetime"?: number;
}

export interface NotionTeamResponse {
  id: string;
  url: string;
  properties: NotionTeam;
  createdTime?: string;
}

/**
 * Create a new team in Notion using MCP
 * Calls the internal API route which will handle MCP integration
 */
export const createTeamInNotion = async (team: NotionTeam): Promise<NotionTeamResponse> => {
  // Call our internal API route that handles MCP operations
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
    (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3001');
  
  try {
    const response = await fetch(`${baseUrl}/api/notion/create-page`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        parent: { data_source_id: DATA_SOURCE_ID },
        team,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      // If it's a 501, it means MCP needs to be implemented
      // Instead of throwing, we'll return the call structure so the AI can make the call
      if (response.status === 501 && data.mcpCall) {
        // Log the MCP call structure for the AI assistant
        console.log("=== MCP CALL NEEDED ===");
        console.log("Tool:", data.mcpCall.tool);
        console.log("Params:", JSON.stringify(data.mcpCall.params, null, 2));
        console.log("======================");
        
        // Return a helpful error that includes the MCP call structure
        // The AI assistant can then make the actual call
        throw new Error(
          `MCP integration needed. ` +
          `Please ask the AI assistant to create this team in Notion using MCP. ` +
          `The MCP call structure is available in the server logs.`
        );
      }
      throw new Error(data.error || data.message || `Failed to create team: ${response.statusText}`);
    }

    // If we get here, the MCP call was successful
    return data;
  } catch (error) {
    console.error("Error creating team in Notion:", error);
    throw error;
  }
};

/**
 * Fetch teams from Notion with optional filters using MCP
 */
export const fetchTeamsFromNotion = async (filters?: {
  format?: string;
  generation?: string;
  strategy?: string;
}): Promise<NotionTeamResponse[]> => {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
    (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3001');
  
  try {
    const response = await fetch(`${baseUrl}/api/notion/search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        data_source_url: `collection://${DATA_SOURCE_ID}`,
        filters,
      }),
    });

    const data = await response.json();

    // If it's a 501, MCP needs to be implemented, but return empty array so UI works
    if (response.status === 501) {
      console.warn("MCP integration needed for search:", data.message);
      return [];
    }

    if (!response.ok) {
      const errorData = data;
      throw new Error(errorData.error || `Failed to fetch teams: ${response.statusText}`);
    }

    return data.teams || [];
  } catch (error) {
    console.error("Error fetching teams from Notion:", error);
    // Return empty array on error to allow UI to still render
    return [];
  }
};

/**
 * Update a team in Notion using MCP
 */
export const updateTeamInNotion = async (
  pageId: string,
  team: Partial<NotionTeam>
): Promise<NotionTeamResponse> => {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  
  try {
    const response = await fetch(`${baseUrl}/api/notion/update-page`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        page_id: pageId,
        team,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to update team: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error updating team in Notion:", error);
    throw error;
  }
};

/**
 * Delete a team from Notion (move to trash) using MCP
 */
export const deleteTeamFromNotion = async (pageId: string): Promise<void> => {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  
  try {
    const response = await fetch(`${baseUrl}/api/notion/delete-page`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        page_id: pageId,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to delete team: ${response.statusText}`);
    }
  } catch (error) {
    console.error("Error deleting team from Notion:", error);
    throw error;
  }
};

