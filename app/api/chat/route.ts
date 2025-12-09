import { streamText } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";
import { queryPantry, addToGroceryList } from "@/lib/notion";

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { messages, experimental_attachments } = await req.json();

    const result = streamText({
      model: google("gemini-1.5-flash"),
      system: `You are Notion Chef, a helpful meal planning assistant. Your role is to:
1. ALWAYS check the pantry first using the checkPantry tool before suggesting recipes
2. Analyze what ingredients the user has available (from pantry or their message/image)
3. Suggest recipes based on available ingredients
4. If any ingredients are missing for a recipe, use the addToGroceryList tool to automatically add them to the grocery list
5. Be friendly, helpful, and provide practical meal planning advice
6. When adding items to the grocery list, include the recipe name in the reason/notes field`,
      messages,
      experimental_attachments,
      maxSteps: 5,
      tools: {
        checkPantry: {
          description: "Check what ingredients are available in the user's Notion Pantry database. Always use this first before suggesting recipes.",
          parameters: z.object({}),
          execute: async () => {
            try {
              const pantryItems = await queryPantry();
              return { items: pantryItems };
            } catch (error) {
              return { error: error instanceof Error ? error.message : "Failed to check pantry" };
            }
          },
        },
        addToGroceryList: {
          description: "Add a missing ingredient to the Notion Grocery List database. Use this when a recipe requires an ingredient that's not in the pantry.",
          parameters: z.object({
            item: z.string().describe("The name of the ingredient to add"),
            reason: z.string().describe("The reason for adding this item (e.g., 'Needed for recipe X')"),
          }),
          execute: async ({ item, reason }) => {
            try {
              await addToGroceryList(item, reason);
              return { success: true, message: `Added ${item} to grocery list` };
            } catch (error) {
              return { error: error instanceof Error ? error.message : "Failed to add item to grocery list" };
            }
          },
        },
      },
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error("Error in chat route:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Internal server error" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

