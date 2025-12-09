import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

interface SuggestTeamRequest {
  generation: string;
  format?: string;
  strategy?: string;
}

// Rate limiting configuration
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour in milliseconds
const MAX_REQUESTS_PER_WINDOW = 5; // 5 requests per hour

// In-memory store for rate limiting (use Redis for production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Clean up old entries every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitStore.entries()) {
    if (now > value.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 10 * 60 * 1000);

/**
 * Check if the request is within rate limits
 */
function checkRateLimit(identifier: string): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const record = rateLimitStore.get(identifier);

  if (!record || now > record.resetTime) {
    // Create new record or reset expired one
    const resetTime = now + RATE_LIMIT_WINDOW;
    rateLimitStore.set(identifier, { count: 1, resetTime });
    return { allowed: true, remaining: MAX_REQUESTS_PER_WINDOW - 1, resetTime };
  }

  if (record.count >= MAX_REQUESTS_PER_WINDOW) {
    // Rate limit exceeded
    return { allowed: false, remaining: 0, resetTime: record.resetTime };
  }

  // Increment count
  record.count += 1;
  rateLimitStore.set(identifier, record);
  return { allowed: true, remaining: MAX_REQUESTS_PER_WINDOW - record.count, resetTime: record.resetTime };
}

/**
 * Fetch legal moves for a Pokemon in a specific generation from PokeAPI
 */
async function getLegalMovesForPokemon(pokemonName: string, generation: string): Promise<string[]> {
  try {
    // Normalize Pokemon name for PokeAPI
    const normalizedName = pokemonName.toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/'/g, "")
      .replace(/\./g, "")
      .replace(/♀/g, "-f")
      .replace(/♂/g, "-m");
    
    const genNum = parseInt(generation.replace("Gen ", "").replace("Generation ", "").trim());
    
    // Map generation to version groups
    const versionGroupMap: Record<number, string[]> = {
      1: ["red-blue", "yellow"],
      2: ["gold-silver", "crystal"],
      3: ["ruby-sapphire", "emerald", "firered-leafgreen", "colosseum", "xd"],
      4: ["diamond-pearl", "platinum", "heartgold-soulsilver"],
      5: ["black-white", "black-2-white-2"],
      6: ["x-y", "omega-ruby-alpha-sapphire"],
      7: ["sun-moon", "ultra-sun-ultra-moon"],
      8: ["sword-shield", "brilliant-diamond-and-shining-pearl", "legends-arceus"],
      9: ["scarlet-violet"],
    };
    
    const versionGroups = versionGroupMap[genNum] || [];
    if (versionGroups.length === 0) {
      console.warn(`No version groups mapped for ${generation}`);
      return [];
    }
    
    // Fetch Pokemon data from PokeAPI
    const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${normalizedName}`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; PokemonTeamManager/1.0)",
      },
    });
    
    if (!response.ok) {
      console.warn(`PokeAPI: Pokemon ${pokemonName} (${normalizedName}) not found: ${response.status}`);
      return [];
    }
    
    const data = await response.json();
    const moves: Set<string> = new Set();
    
    // Filter moves by generation
    for (const moveEntry of data.moves || []) {
      for (const versionGroup of moveEntry.version_group_details || []) {
        const vgName = versionGroup.version_group.name;
        
        // Check if this version group belongs to our generation
        const isInGeneration = versionGroups.some(vg => vgName.includes(vg.split("-")[0]));
        
        if (isInGeneration) {
          // Check if move can be learned (level-up, TM, tutor, egg)
          if (versionGroup.move_learn_method.name === "level-up" ||
              versionGroup.move_learn_method.name === "machine" ||
              versionGroup.move_learn_method.name === "tutor" ||
              versionGroup.move_learn_method.name === "egg") {
            // Format move name properly (capitalize each word)
            const moveName = moveEntry.move.name
              .split("-")
              .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
              .join(" ");
            moves.add(moveName);
          }
        }
      }
    }
    
    return Array.from(moves).sort();
  } catch (error) {
    console.error(`Error fetching moves for ${pokemonName}:`, error);
    return [];
  }
}

/**
 * Fetch top Pokemon usage stats for a generation/format
 */
async function getTopPokemonForFormat(generation: string, format: string = "OU"): Promise<Array<{ name: string; usage: number; rank: number }>> {
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
  const formatFile = `gen${genNum}${formatLower}-0.txt`;
  const url = `https://www.smogon.com/stats/${statsMonth}/${formatFile}`;
  
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; PokemonTeamManager/1.0)",
      },
    });
    
    if (!response.ok) {
      return [];
    }
    
    const statsText = await response.text();
    const lines = statsText.split("\n");
    const topPokemon: Array<{ name: string; usage: number; rank: number }> = [];
    
    for (const line of lines) {
      if (!line.trim() || 
          line.startsWith("Total battles") || 
          line.startsWith("Avg.") ||
          line.startsWith("+") ||
          line.startsWith("| Rank") ||
          !line.includes("|")) {
        continue;
      }
      
      const parts = line.split("|").map((p) => p.trim()).filter((p) => p.length > 0);
      if (parts.length < 3) continue;
      
      const rank = parseInt(parts[0]);
      const pokemonName = parts[1].trim();
      const usage = parseFloat(parts[2]?.replace("%", "").trim() || "0");
      
      if (isNaN(rank) || isNaN(usage) || rank > 50) break; // Top 50 only
      
      topPokemon.push({ name: pokemonName, usage, rank });
    }
    
    return topPokemon;
  } catch (error) {
    console.error(`Error fetching stats for ${generation} ${format}:`, error);
    return [];
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get client IP for rate limiting
    const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0] || 
                     request.headers.get("x-real-ip") || 
                     "unknown";
    
    // Check rate limit
    const rateLimitResult = checkRateLimit(clientIp);
    
    if (!rateLimitResult.allowed) {
      const resetDate = new Date(rateLimitResult.resetTime);
      const minutesRemaining = Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000 / 60);
      
      return NextResponse.json(
        { 
          error: "Rate limit exceeded. Please try again later.",
          details: `You have exceeded the maximum of ${MAX_REQUESTS_PER_WINDOW} requests per hour. Please try again in ${minutesRemaining} minute${minutesRemaining !== 1 ? 's' : ''}.`,
          resetTime: resetDate.toISOString(),
        },
        { 
          status: 429,
          headers: {
            "X-RateLimit-Limit": MAX_REQUESTS_PER_WINDOW.toString(),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": rateLimitResult.resetTime.toString(),
            "Retry-After": Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000).toString(),
          },
        }
      );
    }
    
    // Support both GOOGLE_GEMINI_API_KEY and GEMINI_API_KEY
    const apiKey = process.env.GOOGLE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        { error: "GOOGLE_GEMINI_API_KEY or GEMINI_API_KEY environment variable is not set" },
        { status: 500 }
      );
    }

    const body: SuggestTeamRequest = await request.json();
    const { generation, format = "OU", strategy } = body;

    if (!generation) {
      return NextResponse.json(
        { error: "Generation is required" },
        { status: 400 }
      );
    }

    // Fetch top Pokemon usage stats
    const topPokemon = await getTopPokemonForFormat(generation, format);
    
    // Fetch legal moves for top Pokemon (limit to top 20 to avoid too many API calls)
    const pokemonWithMoves = await Promise.all(
      topPokemon.slice(0, 20).map(async (pokemon) => {
        const moves = await getLegalMovesForPokemon(pokemon.name, generation);
        return {
          ...pokemon,
          commonMoves: moves.slice(0, 20), // Top 20 moves to keep prompt manageable
        };
      })
    );
    
    const pokemonStatsText = pokemonWithMoves
      .map((p) => {
        const movesText = p.commonMoves && p.commonMoves.length > 0 
          ? ` (Legal moves: ${p.commonMoves.slice(0, 10).join(", ")}${p.commonMoves.length > 10 ? "..." : ""})`
          : "";
        return `#${p.rank} ${p.name}: ${p.usage.toFixed(2)}% usage${movesText}`;
      })
      .join("\n");
    
    // Create a list of legal Pokemon names for reference
    const legalPokemonList = topPokemon
      .slice(0, 50)
      .map((p) => p.name)
      .join(", ");

    // Initialize Gemini
    const genAI = new GoogleGenerativeAI(apiKey);
    // Use gemini-2.5-flash model
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // Build prompt with strict legality requirements
    const genNum = generation.replace("Gen ", "").replace("Generation ", "").trim();
    const isOldGen = parseInt(genNum) <= 3;
    
    const prompt = `You are an expert Pokemon competitive team builder. Generate an optimal Pokemon Showdown team for ${generation} ${format} format.

${strategy ? `Team Strategy: ${strategy}\n` : ""}

Current top Pokemon usage stats (these are guaranteed legal in ${generation} ${format}):
${pokemonStatsText || "No usage stats available"}

Legal Pokemon in ${generation} ${format} (use these as reference):
${legalPokemonList || "See usage stats above"}

CRITICAL LEGALITY REQUIREMENTS:
1. ONLY use Pokemon that are legal in ${generation} ${format} format (check Smogon tier lists)
2. ALL moves must be legally obtainable together for each Pokemon in ${generation}
3. ${isOldGen ? `For ${generation}, pay EXTREME attention to egg move combinations - moves from different breeding chains CANNOT be combined (e.g., Skarmory cannot have both Whirlwind and Drill Peck in Gen 3)` : `Ensure all moves are available in ${generation} and can be learned together`}
4. Abilities must be available in ${generation} (no hidden abilities if not available)
5. Items must be available in ${generation}
6. The team MUST pass Pokemon Showdown's validation - if it doesn't, it's unusable

${isOldGen ? `SPECIAL ${generation} RULES:
- Only use moves that can be obtained together through level-up, TM, HM, tutor, or compatible egg moves
- Research each Pokemon's legal move combinations - do NOT guess
- If unsure about a move combination, use a different, verified legal set
- Common illegal combinations to avoid:
  * Skarmory: Cannot have Whirlwind + Drill Peck together in Gen 3
  * Many Pokemon have restricted egg move combinations
` : ""}

Team Requirements:
1. Create a balanced team of exactly 6 Pokemon
2. PREFER using Pokemon from the usage stats list above (they are confirmed legal in ${generation} ${format})
3. Include proper team composition (sweepers, walls, support, etc.)
3. Each Pokemon must have:
   - Full name (e.g., "Garchomp" not "Garchomp-Mega")
   - Item (if applicable, must be legal in ${generation})
   - Ability (must be available in ${generation})
   - EVs (e.g., "252 Atk / 4 Def / 252 Spe")
   - Nature
   - 4 moves (ONLY use moves listed in the "Legal moves" section for each Pokemon above - these are confirmed learnable in ${generation})
4. Format the output as a valid Pokemon Showdown team paste
5. Include a brief team description explaining the strategy

IMPORTANT: 
- ONLY use moves that are listed in the "Legal moves" section for each Pokemon above
- These moves are confirmed to be learnable in ${generation} via level-up, TM, HM, tutor, or egg moves
- DO NOT use moves that are NOT in the legal moves list - they will cause validation errors
- For Pokemon not in the top 20 list, you must verify moves are legal in ${generation} before using them
- Use common, verified sets from Smogon analyses when possible
- The team MUST be importable into Pokemon Showdown without validation errors
- Double-check egg move combinations for ${isOldGen ? generation : "older generations"} - they are the most common source of validation errors
- If a Pokemon's legal moves list is empty or incomplete, choose a different Pokemon from the list

Output ONLY the team paste in Pokemon Showdown format, followed by a blank line, then "Team Description:" and the description. Do not include any other text or markdown formatting.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const teamText = response.text();

    // Parse the team paste and description
    const parts = teamText.split("\n\nTeam Description:");
    const teamPaste = parts[0]?.trim() || teamText.trim();
    const description = parts[1]?.trim() || "";

    return NextResponse.json(
      {
        teamPaste,
        description,
        generation,
        format,
        strategy: description,
      },
      {
        headers: {
          "X-RateLimit-Limit": MAX_REQUESTS_PER_WINDOW.toString(),
          "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
          "X-RateLimit-Reset": rateLimitResult.resetTime.toString(),
        },
      }
    );
  } catch (error) {
    console.error("Error generating team suggestion:", error);
    return NextResponse.json(
      {
        error: "Failed to generate team suggestion",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

