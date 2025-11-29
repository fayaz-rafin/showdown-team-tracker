import { Client } from "@notionhq/client";

// Initialize Notion client
// Get API key from environment variable
const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

const DATABASE_ID = "01791ac3e808421996d75709ecfeab62";

export { notion, DATABASE_ID };

