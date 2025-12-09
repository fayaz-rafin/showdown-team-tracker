import { NextRequest, NextResponse } from "next/server";

interface MoveUsage {
  move: string;
  usage: number;
}

interface DetailedStats {
  pokemon: string;
  generation: string;
  format: string;
  usage: number;
  rank: number;
  moves: MoveUsage[];
  abilities?: Array<{ ability: string; usage: number }>;
  items?: Array<{ item: string; usage: number }>;
  spreads?: Array<{ spread: string; usage: number }>;
}

/**
 * Fetch detailed Pokemon stats including moves from Smogon
 */
async function fetchDetailedStats(
  pokemonName: string,
  generation: string,
  format: string
): Promise<DetailedStats | null> {
  try {
    const currentDate = new Date();
    let year = currentDate.getFullYear();
    let month = currentDate.getMonth();
    
    if (month === 0) {
      month = 11;
      year -= 1;
    } else {
      month -= 1;
    }
    
    const statsMonth = `${year}-${String(month + 1).padStart(2, "0")}`;
    const genNum = generation.replace("Gen ", "").replace("Generation ", "").trim();
    const formatLower = format.toLowerCase();
    
    // Smogon stores detailed stats in separate files
    // Format: https://www.smogon.com/stats/2024-11/moveset/gen9ou-0.txt
    const movesetUrl = `https://www.smogon.com/stats/${statsMonth}/moveset/gen${genNum}${formatLower}-0.txt`;
    
    const response = await fetch(movesetUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; PokemonTeamManager/1.0)",
      },
    });
    
    if (!response.ok) {
      console.log(`[Detailed Stats] Failed to fetch moveset stats from ${movesetUrl}: ${response.status} ${response.statusText}`);
      return null;
    }
    
    console.log(`[Detailed Stats] Successfully fetched moveset file from ${movesetUrl}`);
    
    const statsText = await response.text();
    const lines = statsText.split("\n");
    
    console.log(`[Detailed Stats] Parsing moveset file for ${pokemonName} in ${generation} ${format}`);
    console.log(`[Detailed Stats] File length: ${lines.length} lines`);
    
    // Normalize Pokemon name for matching - try multiple variations
    const normalizedSearch = pokemonName.toLowerCase()
      .replace(/\s+/g, "")
      .replace(/-/g, "")
      .replace(/'/g, "")
      .replace(/\./g, "");
    
    // Also try with hyphen preserved (for forms like Ogerpon-Wellspring)
    const normalizedWithHyphen = pokemonName.toLowerCase()
      .replace(/\s+/g, "")
      .replace(/'/g, "")
      .replace(/\./g, "");
    
    console.log(`[Detailed Stats] Searching for normalized name: "${normalizedSearch}" or "${normalizedWithHyphen}"`);
    
    let inPokemonSection = false;
    let currentSection = "";
    let currentPokemon = "";
    const moves: MoveUsage[] = [];
    const abilities: Array<{ ability: string; usage: number }> = [];
    const items: Array<{ item: string; usage: number }> = [];
    let usage = 0;
    let rank = 0;
    let pokemonRank = 0;
    
    // First, find the Pokemon in the usage stats to get rank
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith("|") && line.includes("|")) {
        const parts = line.split("|").map(p => p.trim()).filter(Boolean);
        if (parts.length >= 2) {
          const pokemonInLine = parts[0]?.toLowerCase()
            .replace(/\s+/g, "")
            .replace(/-/g, "")
            .replace(/'/g, "")
            .replace(/\./g, "");
          
          if (pokemonInLine === normalizedSearch && parts[1]?.includes("%")) {
            usage = parseFloat(parts[1]?.replace("%", "") || "0");
            pokemonRank = i; // Approximate rank based on position
            break;
          }
        }
      }
    }
    
    // Now parse the moveset section
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (!line.startsWith("|")) continue;
      
      const parts = line.split("|").map(p => p.trim()).filter(Boolean);
      
      // Check for Pokemon header: | Pokemon Name | (single part, no %, starts with capital)
      // Format: | Kingambit | or | Ogerpon-Wellspring | (may have trailing spaces)
      // The line should have exactly 2 pipes (start, content, end) and after filtering empty strings, 1 part
      // Exclude metadata lines like "Raw count:", "Avg. weight:", etc.
      if (line.match(/^\|\s+[A-Z]/) && parts.length === 1 && parts[0] && 
          parts[0].charAt(0) === parts[0].charAt(0).toUpperCase() &&
          !parts[0].includes("%") && 
          !parts[0].startsWith("+") && 
          !parts[0].startsWith("-") &&
          !parts[0].includes(":") && // Exclude lines like "Raw count: 123"
          parts[0] !== "Abilities" && parts[0] !== "Items" && 
          parts[0] !== "Spreads" && parts[0] !== "Moves" &&
          parts[0] !== "Tera Types" && parts[0] !== "Teammates" &&
          parts[0] !== "Checks and Counters" && parts[0] !== "Raw count" &&
          parts[0] !== "Avg. weight" && parts[0] !== "Viability Ceiling" &&
          parts[0] !== "Other" && parts[0] !== "Nothing" &&
          !parts[0].match(/^\d+$/) && // Not just a number
          parts[0].length > 1) { // At least 2 characters
        const pokemonInLineNoHyphen = parts[0].toLowerCase()
          .replace(/\s+/g, "")
          .replace(/-/g, "")
          .replace(/'/g, "")
          .replace(/\./g, "");
        
        const pokemonInLineWithHyphen = parts[0].toLowerCase()
          .replace(/\s+/g, "")
          .replace(/'/g, "")
          .replace(/\./g, "");
        
        // Only log first few to avoid spam
        if (i < 50 || pokemonInLineNoHyphen.includes(normalizedSearch.substring(0, 3))) {
          console.log(`[Detailed Stats] Checking line ${i}: "${parts[0]}" -> noHyphen: "${pokemonInLineNoHyphen}", withHyphen: "${pokemonInLineWithHyphen}"`);
        }
        
        if (pokemonInLineNoHyphen === normalizedSearch || pokemonInLineWithHyphen === normalizedWithHyphen) {
          console.log(`[Detailed Stats] Found Pokemon section for ${pokemonName}!`);
          inPokemonSection = true;
          currentPokemon = parts[0];
          currentSection = "";
          continue;
        } else if (inPokemonSection && parts.length === 1 && 
                   parts[0].charAt(0) === parts[0].charAt(0).toUpperCase() &&
                   !parts[0].includes("%") &&
                   !parts[0].includes(":") && // Exclude metadata lines like "Raw count: 123"
                   parts[0] !== "Abilities" && parts[0] !== "Items" && 
                   parts[0] !== "Spreads" && parts[0] !== "Moves" &&
                   parts[0] !== "Raw count" && parts[0] !== "Avg. weight" &&
                   parts[0] !== "Viability Ceiling" && parts[0] !== "Tera Types" &&
                   parts[0] !== "Teammates" && parts[0] !== "Checks and Counters" &&
                   parts[0] !== "Other" && parts[0] !== "Nothing" &&
                   !parts[0].match(/^\d+$/) && // Not just a number
                   parts[0].length > 1) {
          // New Pokemon section started (another Pokemon name, not metadata)
          console.log(`[Detailed Stats] New Pokemon section started: ${parts[0]}, ending search`);
          break;
        }
      }
      
      // Skip separator lines
      if (parts.length === 1 && (parts[0].startsWith("+") || parts[0].startsWith("-"))) {
        continue;
      }
      
      // Check for section headers (only when in Pokemon section)
      if (inPokemonSection && parts.length === 1) {
        if (parts[0] === "Abilities") {
          currentSection = "abilities";
          console.log(`[Detailed Stats] Entered Abilities section`);
          continue;
        } else if (parts[0] === "Items") {
          currentSection = "items";
          console.log(`[Detailed Stats] Entered Items section`);
          continue;
        } else if (parts[0] === "Moves") {
          currentSection = "moves";
          console.log(`[Detailed Stats] Entered Moves section`);
          continue;
        } else if (parts[0] === "Spreads") {
          currentSection = "spreads";
          continue;
        } else if (parts[0] === "Tera Types" || parts[0] === "Teammates" || parts[0] === "Checks and Counters") {
          // End of useful data sections
          console.log(`[Detailed Stats] Reached end section: ${parts[0]}`);
          break;
        }
      }
      
      // Parse data within Pokemon section
      if (inPokemonSection && parts.length >= 2) {
        const name = parts[0];
        const usageStr = parts[1];
        
        // Skip "Other" entries and section headers
        if (name === "Other" || name === "Nothing" || 
            name === "Abilities" || name === "Items" || 
            name === "Moves" || name === "Spreads" ||
            name === "Raw count" || name === "Avg. weight" ||
            name === "Viability Ceiling") {
          continue;
        }
        
        if (usageStr && usageStr.includes("%")) {
          const usageValue = parseFloat(usageStr.replace("%", "").trim());
          
          if (currentSection === "moves" && usageValue > 0 && name !== "Other") {
            moves.push({ move: name, usage: usageValue });
            if (moves.length <= 5) {
              console.log(`[Detailed Stats] Found move: ${name} (${usageValue}%)`);
            }
          } else if (currentSection === "abilities" && usageValue > 0 && name !== "Other") {
            abilities.push({ ability: name, usage: usageValue });
            console.log(`[Detailed Stats] Found ability: ${name} (${usageValue}%)`);
          } else if (currentSection === "items" && usageValue > 0 && name !== "Other") {
            items.push({ item: name, usage: usageValue });
            if (items.length <= 3) {
              console.log(`[Detailed Stats] Found item: ${name} (${usageValue}%)`);
            }
          }
        }
      }
    }
    
    // Calculate rank from usage stats (approximate)
    if (usage > 0) {
      // Try to get rank from usage stats file
      const statsMonth = `${year}-${String(month + 1).padStart(2, "0")}`;
      const genNum = generation.replace("Gen ", "").replace("Generation ", "").trim();
      const formatLower = format.toLowerCase();
      const usageUrl = `https://www.smogon.com/stats/${statsMonth}/gen${genNum}${formatLower}-0.txt`;
      
      try {
        const usageResponse = await fetch(usageUrl, {
          headers: {
            "User-Agent": "Mozilla/5.0 (compatible; PokemonTeamManager/1.0)",
          },
        });
        
        if (usageResponse.ok) {
          const usageText = await usageResponse.text();
          const usageLines = usageText.split("\n");
          
          for (const usageLine of usageLines) {
            if (!usageLine.trim() || !usageLine.includes("|")) continue;
            const parts = usageLine.split("|").map(p => p.trim()).filter(Boolean);
            if (parts.length >= 3) {
              const rankNum = parseInt(parts[0]);
              const pokemonInLine = parts[1]?.toLowerCase()
                .replace(/\s+/g, "")
                .replace(/-/g, "")
                .replace(/'/g, "")
                .replace(/\./g, "");
              
              if (pokemonInLine === normalizedSearch && !isNaN(rankNum)) {
                rank = rankNum;
                break;
              }
            }
          }
        }
      } catch (err) {
        console.warn("Could not fetch rank from usage stats:", err);
      }
    }
    
    console.log(`[Detailed Stats] Final state - inPokemonSection: ${inPokemonSection}, currentPokemon: "${currentPokemon}", moves: ${moves.length}, abilities: ${abilities.length}, items: ${items.length}, usage: ${usage}`);
    
    // Return stats even if we found the Pokemon section but no moves/abilities/items
    // (some Pokemon might have very low usage)
    if (inPokemonSection && currentPokemon) {
      console.log(`[Detailed Stats] Returning stats for ${currentPokemon}`);
      return {
        pokemon: currentPokemon,
        generation,
        format,
        usage: usage || 0,
        rank: rank || 0,
        moves: moves.slice(0, 20), // Top 20 moves
        abilities: abilities.slice(0, 5), // Top 5 abilities
        items: items.slice(0, 10), // Top 10 items
      };
    }
    
    console.log(`[Detailed Stats] No stats found for ${pokemonName} - searched for "${normalizedSearch}" or "${normalizedWithHyphen}"`);
    console.log(`[Detailed Stats] Sample Pokemon names found in file (first 10):`);
    let sampleCount = 0;
    for (let i = 0; i < lines.length && sampleCount < 10; i++) {
      const line = lines[i].trim();
      if (line.startsWith("|") && line.match(/^\|\s+[A-Z]/)) {
        const parts = line.split("|").map(p => p.trim()).filter(Boolean);
        if (parts.length === 1 && parts[0].charAt(0) === parts[0].charAt(0).toUpperCase() && 
            !parts[0].includes("%") && parts[0].length > 1) {
          console.log(`  - "${parts[0]}"`);
          sampleCount++;
        }
      }
    }
    
    return null;
  } catch (error) {
    console.error(`Error fetching detailed stats for ${pokemonName}:`, error);
    return null;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { pokemon: string } }
) {
  try {
    const pokemonName = decodeURIComponent(params.pokemon);
    const { searchParams } = new URL(request.url);
    let generation = searchParams.get("generation") || "Gen 9";
    let format = searchParams.get("format") || "OU";
    
    // Normalize format - extract just the format name (e.g., "OU (Overused)" -> "OU")
    format = format.split(" ")[0].trim();
    
    // Normalize Pokemon name - handle hyphens and capitalization
    // e.g., "ogerpon-wellspring" -> "Ogerpon-Wellspring"
    const normalizedPokemonName = pokemonName
      .split("-")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join("-");
    
    console.log(`Fetching detailed stats for: ${pokemonName} (normalized: ${normalizedPokemonName}) in ${generation} ${format}`);
    
    const stats = await fetchDetailedStats(normalizedPokemonName, generation, format);
    
    if (!stats) {
      return NextResponse.json(
        {
          pokemon: pokemonName,
          generation,
          format,
          error: "No detailed stats found",
          moves: [],
        },
        { status: 404 }
      );
    }
    
    return NextResponse.json(stats);
  } catch (error) {
    console.error("Error fetching detailed Smogon stats:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch detailed stats",
        pokemon: params.pokemon,
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

