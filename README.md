# Pokemon Showdown Team Manager

A Next.js web application for organizing and managing Pokemon Showdown teams using Notion as the database backend via MCP (Model Context Protocol).

## Features

- 📋 **Paste Pokemon Showdown Teams**: Paste your team exports directly from Pokemon Showdown
- 🔍 **Smart Parsing**: Automatically extracts Pokemon, items, moves, EVs, and more
- 🏷️ **Organization**: Organize teams by format, generation, and strategy
- 🔎 **Filtering**: Filter teams by format, generation, and strategy keywords
- 💾 **Notion Integration**: Store all teams in your Notion database
- ✏️ **Edit & Delete**: Manage your teams with full CRUD operations

## Setup

### Prerequisites

- Node.js 18+ installed
- A Notion workspace with the "Pokemon Showdown Teams" database
- Notion MCP server configured and running

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up Notion MCP connection:
   - Ensure your Notion MCP server is running and accessible
   - The app expects the MCP server to be available at the configured endpoint
   - Update the MCP connection settings in `lib/notionService.ts` if needed

3. Configure the database:
   - The app is configured to use the database ID: `01791ac3-e808-4219-96d7-5709ecfeab62`
   - Data source ID: `f9b4bc2c-557b-4f90-b7c5-d08cce4c2cce`
   - Make sure your Notion database has the following properties:
     - Team Name (Title)
     - Team Paste (Text)
     - Format (Select)
     - Generation (Select)
     - Strategy Notes (Text)
     - Key Pokemon (Multi-select)
     - Last Updated (Date)

### Running the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Notion API Integration

The app uses the Notion API directly to interact with your Notion database. This is more reliable than MCP and works automatically in Next.js.

### Setting Up Notion API

1. **Get Notion API Key**:
   - Go to https://www.notion.so/my-integrations
   - Click "New integration"
   - Give it a name (e.g., "Pokemon Team Manager")
   - Copy the "Internal Integration Token" (starts with `secret_`)

2. **Share Database with Integration**:
   - Open your "Pokemon Showdown Teams" database in Notion
   - Click the "..." menu in the top right
   - Select "Add connections" or "Connections"
   - Find and add your integration

3. **Set Environment Variable**:
   - Create a `.env.local` file in the project root
   - Add: `NOTION_API_KEY=secret_your_token_here`
   - Restart your dev server

### Notion API Used

The app uses the official `@notionhq/client` package to:
- Create new team entries
- Query and filter teams
- Update existing teams
- Archive (delete) teams

### Database Configuration

The app is pre-configured to use:
- Database ID: `01791ac3-e808-4219-96d7-5709ecfeab62`
- Data Source ID: `f9b4bc2c-557b-4f90-b7c5-d08cce4c2cce`

Make sure your Notion database has these properties:
- **Team Name** (Title) - Required
- **Team Paste** (Text) - Required
- **Format** (Select) - Optional
- **Generation** (Select) - Optional
- **Strategy Notes** (Text) - Optional
- **Key Pokemon** (Multi-select) - Optional
- **Last Updated** (Date) - Auto-set

## Usage

1. **Add a Team**:
   - Click "Add New Team"
   - Paste your Pokemon Showdown team export
   - Click "Parse Team" to auto-detect format and generation
   - Fill in team name, format, generation, and strategy notes
   - Click "Save Team"

2. **Filter Teams**:
   - Use the filter panel to filter by format, generation, or strategy
   - Filters work in combination (AND logic)

3. **Edit/Delete Teams**:
   - Click "Edit" on any team card to modify it
   - Click "Delete" to remove a team (with confirmation)

## Team Paste Format

The app supports standard Pokemon Showdown export format:

```
Pokemon Name (Nickname) @ Item
Ability: Ability Name
Level: 50
Tera Type: Type
EVs: 252 HP / 252 Atk / 4 SpD
Nature
- Move 1
- Move 2
- Move 3
- Move 4
```

## Project Structure

```
├── app/
│   ├── api/              # API routes for teams and Notion integration
│   ├── globals.css       # Global styles
│   ├── layout.tsx        # Root layout
│   └── page.tsx          # Main page
├── components/
│   ├── TeamCard.tsx      # Team display card
│   ├── TeamFilters.tsx   # Filter component
│   └── TeamPasteForm.tsx # Form for adding/editing teams
├── lib/
│   └── notionService.ts  # Notion MCP service layer
├── types/
│   └── team.ts           # TypeScript types
└── utils/
    └── teamParser.ts     # Pokemon Showdown team parser
```

## Technologies

- **Next.js 14**: React framework
- **TypeScript**: Type safety
- **Tailwind CSS**: Styling
- **Notion MCP**: Database integration

## License

MIT

