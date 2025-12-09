# Setting Up Google Gemini API

To use the AI team suggestion feature, you need to set up a Google Gemini API key.

## Steps:

1. **Get a Gemini API Key:**
   - Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Sign in with your Google account
   - Click "Create API Key"
   - Copy the API key

2. **Add to Environment Variables:**
   - Add the following to your `.env` file:
   ```
   GOOGLE_GEMINI_API_KEY=your_api_key_here
   ```

3. **Restart your development server:**
   ```bash
   npm run dev
   ```

## Usage:

1. Click the "AI Team Suggestions" button on the home page
2. Select a generation (Gen 1-9)
3. Select a format (OU, UU, RU, etc.)
4. Optionally add a strategy description
5. Click "Generate Team"
6. Review the suggested team
7. Click "Save to Notion" to save it to your database

The AI will use current Smogon usage stats to generate optimal teams based on the selected generation and format.


