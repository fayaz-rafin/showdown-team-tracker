import { Client } from "@notionhq/client";

// Initialize Notion client
const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

const PANTRY_DB_ID = process.env.NOTION_PANTRY_DB_ID || "";
const GROCERY_DB_ID = process.env.NOTION_GROCERY_DB_ID || "";

/**
 * Query the Pantry database and return a simple string list of items (Name + Quantity)
 * to save LLM tokens
 */
export const queryPantry = async (): Promise<string> => {
  try {
    if (!PANTRY_DB_ID) {
      throw new Error("NOTION_PANTRY_DB_ID is not set");
    }

    const response = await notion.databases.query({
      database_id: PANTRY_DB_ID,
    });

    const items: string[] = [];

    for (const page of response.results) {
      if ("properties" in page) {
        const nameProperty = page.properties.Name;
        const quantityProperty = page.properties.Quantity;

        let name = "";
        let quantity = "";

        // Extract Name (Title property)
        if (nameProperty.type === "title" && nameProperty.title.length > 0) {
          name = nameProperty.title[0].plain_text;
        }

        // Extract Quantity (Rich Text property)
        if (quantityProperty.type === "rich_text" && quantityProperty.rich_text.length > 0) {
          quantity = quantityProperty.rich_text[0].plain_text;
        }

        if (name) {
          items.push(quantity ? `${name} (${quantity})` : name);
        }
      }
    }

    return items.length > 0 ? items.join(", ") : "Pantry is empty";
  } catch (error) {
    console.error("Error querying pantry:", error);
    throw new Error(`Failed to query pantry: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
};

/**
 * Add an item to the Grocery List database
 * @param item - The item name (maps to Title property)
 * @param reason - The reason/notes (maps to Notes property)
 */
export const addToGroceryList = async (item: string, reason: string): Promise<void> => {
  try {
    if (!GROCERY_DB_ID) {
      throw new Error("NOTION_GROCERY_DB_ID is not set");
    }

    await notion.pages.create({
      parent: {
        database_id: GROCERY_DB_ID,
      },
      properties: {
        Item: {
          title: [
            {
              text: {
                content: item,
              },
            },
          ],
        },
        Notes: {
          rich_text: [
            {
              text: {
                content: reason,
              },
            },
          ],
        },
        Status: {
          checkbox: false,
        },
      },
    });
  } catch (error) {
    console.error("Error adding to grocery list:", error);
    throw new Error(`Failed to add item to grocery list: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
};

