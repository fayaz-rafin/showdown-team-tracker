# Setting Up Notion API

## Quick Setup

1. **Install the Notion package**:
```bash
npm install
```

2. **Get your Notion API Key**:
   - Go to https://www.notion.so/my-integrations
   - Click "New integration"
   - Name it "Pokemon Team Manager"
   - Copy the token (starts with `secret_`)

3. **Share your database with the integration**:
   - Open your "Pokemon Showdown Teams" database in Notion
   - Click "..." menu → "Connections" or "Add connections"
   - Select your integration

4. **Create `.env.local` file**:
```bash
NOTION_API_KEY=secret_your_token_here
```

5. **Restart your dev server**:
```bash
npm run dev
```

That's it! The app will now automatically save teams to your Notion database.

