import { NextRequest, NextResponse } from "next/server";

interface SmogonFormatUsage {
  format: string;
  usage: number;
  rank: number;
}

interface SmogonUsageData {
  pokemon: string;
  formats: SmogonFormatUsage[];
  latestMonth?: string;
}

// Cache for Smogon stats data
let statsCache: Map<string, SmogonUsageData> = new Map();
let cacheTimestamp: number = 0;
const CACHE_DURATION = 1000 * 60 * 60; // 1 hour

/**
 * Normalize Pokemon name for Smogon stats matching
 */
function normalizePokemonName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/-/g, "")
    .replace(/'/g, "")
    .replace(/\./g, "");
}

/**
 * Parse Smogon stats file (pipe-separated table format)
 * Format: | Rank | Pokemon | Usage % | Raw | % | Real | % |
 */
function parseSmogonStats(statsText: string, pokemonName: string): { usage: number; rank: number } | null {
  const normalizedSearch = normalizePokemonName(pokemonName);
  const lines = statsText.split("\n");
  
  for (const line of lines) {
    // Skip header lines, empty lines, and separator lines
    if (!line.trim() || 
        line.startsWith("Total battles") || 
        line.startsWith("Avg.") ||
        line.startsWith("+") ||
        line.startsWith("| Rank") ||
        !line.includes("|")) {
      continue;
    }
    
    // Parse pipe-separated format: | Rank | Pokemon | Usage % | Raw | % | Real | % |
    const parts = line.split("|").map((p) => p.trim()).filter((p) => p.length > 0);
    if (parts.length < 3) continue;
    
    const rankStr = parts[0];
    const pokemonInFile = normalizePokemonName(parts[1]);
    const usageStr = parts[2]; // Usage % column
    
    const rank = parseInt(rankStr);
    const usage = parseFloat(usageStr?.replace("%", "").trim() || "0");
    
    if (isNaN(rank) || isNaN(usage)) {
      console.log(`Skipping line - invalid rank or usage: rank=${rankStr}, usage=${usageStr}`);
      continue;
    }
    
    console.log(`Comparing: "${pokemonInFile}" === "${normalizedSearch}"`);
    
    if (pokemonInFile === normalizedSearch) {
      console.log(`Match found! ${pokemonName} in rank ${rank} with ${usage}% usage`);
      return { usage, rank };
    }
  }
  
  return null;
}

/**
 * Fetch and parse Smogon usage stats for a Pokemon
 */
async function fetchSmogonStats(pokemonName: string): Promise<SmogonUsageData> {
  const normalizedName = pokemonName.toLowerCase();
  const currentTime = Date.now();

  // Check cache first
  if (statsCache.has(normalizedName) && currentTime - cacheTimestamp < CACHE_DURATION) {
    return statsCache.get(normalizedName)!;
  }

  const formats: SmogonFormatUsage[] = [];
  const currentDate = new Date();
  // Use previous month (Smogon stats are typically for the previous month)
  let year = currentDate.getFullYear();
  let month = currentDate.getMonth(); // 0-indexed
  
  // If we're in January, go to previous year's December
  if (month === 0) {
    month = 11;
    year -= 1;
  } else {
    month -= 1;
  }
  
  const latestMonth = `${year}-${String(month + 1).padStart(2, "0")}`;
  
  console.log(`Fetching Smogon stats for ${pokemonName}, using month: ${latestMonth}`);

  // Common Smogon formats to check (all generations)
  const formatList = [
    // Gen 9
    { name: "OU", file: "gen9ou-0.txt", display: "Gen 9 OU" },
    { name: "UU", file: "gen9uu-0.txt", display: "Gen 9 UU" },
    { name: "RU", file: "gen9ru-0.txt", display: "Gen 9 RU" },
    { name: "NU", file: "gen9nu-0.txt", display: "Gen 9 NU" },
    { name: "PU", file: "gen9pu-0.txt", display: "Gen 9 PU" },
    { name: "Ubers", file: "gen9ubers-0.txt", display: "Gen 9 Ubers" },
    { name: "Doubles OU", file: "gen9doublesou-0.txt", display: "Gen 9 Doubles OU" },
    // Gen 8
    { name: "OU", file: "gen8ou-0.txt", display: "Gen 8 OU" },
    { name: "UU", file: "gen8uu-0.txt", display: "Gen 8 UU" },
    { name: "RU", file: "gen8ru-0.txt", display: "Gen 8 RU" },
    { name: "NU", file: "gen8nu-0.txt", display: "Gen 8 NU" },
    { name: "PU", file: "gen8pu-0.txt", display: "Gen 8 PU" },
    { name: "Ubers", file: "gen8ubers-0.txt", display: "Gen 8 Ubers" },
    // Gen 7
    { name: "OU", file: "gen7ou-0.txt", display: "Gen 7 OU" },
    { name: "UU", file: "gen7uu-0.txt", display: "Gen 7 UU" },
    { name: "RU", file: "gen7ru-0.txt", display: "Gen 7 RU" },
    { name: "NU", file: "gen7nu-0.txt", display: "Gen 7 NU" },
    { name: "PU", file: "gen7pu-0.txt", display: "Gen 7 PU" },
    { name: "Ubers", file: "gen7ubers-0.txt", display: "Gen 7 Ubers" },
    // Gen 6
    { name: "OU", file: "gen6ou-0.txt", display: "Gen 6 OU" },
    { name: "UU", file: "gen6uu-0.txt", display: "Gen 6 UU" },
    { name: "RU", file: "gen6ru-0.txt", display: "Gen 6 RU" },
    { name: "NU", file: "gen6nu-0.txt", display: "Gen 6 NU" },
    { name: "PU", file: "gen6pu-0.txt", display: "Gen 6 PU" },
    { name: "Ubers", file: "gen6ubers-0.txt", display: "Gen 6 Ubers" },
    // Gen 5
    { name: "OU", file: "gen5ou-0.txt", display: "Gen 5 OU" },
    { name: "UU", file: "gen5uu-0.txt", display: "Gen 5 UU" },
    { name: "RU", file: "gen5ru-0.txt", display: "Gen 5 RU" },
    { name: "NU", file: "gen5nu-0.txt", display: "Gen 5 NU" },
    { name: "Ubers", file: "gen5ubers-0.txt", display: "Gen 5 Ubers" },
    // Gen 4
    { name: "OU", file: "gen4ou-0.txt", display: "Gen 4 OU" },
    { name: "UU", file: "gen4uu-0.txt", display: "Gen 4 UU" },
    { name: "Ubers", file: "gen4ubers-0.txt", display: "Gen 4 Ubers" },
    // Gen 3
    { name: "OU", file: "gen3ou-0.txt", display: "Gen 3 OU" },
    { name: "Ubers", file: "gen3ubers-0.txt", display: "Gen 3 Ubers" },
    // Gen 2
    { name: "OU", file: "gen2ou-0.txt", display: "Gen 2 OU" },
    { name: "Ubers", file: "gen2ubers-0.txt", display: "Gen 2 Ubers" },
    // Gen 1
    { name: "OU", file: "gen1ou-0.txt", display: "Gen 1 OU" },
    { name: "Ubers", file: "gen1ubers-0.txt", display: "Gen 1 Ubers" },
  ];

  // Try to fetch from the latest month's stats
  try {
    const baseUrl = `https://www.smogon.com/stats/${latestMonth}/`;
    
    // Fetch stats for each format
    const fetchPromises = formatList.map(async (format) => {
      try {
        const url = `${baseUrl}${format.file}`;
        const response = await fetch(url, {
          headers: {
            "User-Agent": "Mozilla/5.0",
          },
        });
        
        if (!response.ok) {
          console.log(`Failed to fetch ${format.file}: ${response.status}`);
          return null;
        }
        
        const statsText = await response.text();
        const stats = parseSmogonStats(statsText, pokemonName);
        
        if (stats && stats.usage > 0) {
          console.log(`Found ${pokemonName} in ${format.display}: ${stats.usage}% (rank ${stats.rank})`);
          return {
            format: format.display,
            usage: stats.usage,
            rank: stats.rank,
          };
        } else {
          console.log(`No stats found for ${pokemonName} in ${format.display}`);
        }
      } catch (error) {
        console.error(`Error fetching ${format.file}:`, error);
        return null;
      }
      return null;
    });

    const results = await Promise.all(fetchPromises);
    const validFormats = results.filter((f): f is SmogonFormatUsage => f !== null);

    const result: SmogonUsageData = {
      pokemon: pokemonName,
      formats: validFormats.sort((a, b) => b.usage - a.usage),
      latestMonth,
    };

    // Cache the result
    statsCache.set(normalizedName, result);
    cacheTimestamp = currentTime;

    return result;
  } catch (error) {
    console.error(`Error fetching Smogon stats for ${pokemonName}:`, error);
    return {
      pokemon: pokemonName,
      formats: [],
    };
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { pokemon: string } }
) {
  try {
    const pokemonName = decodeURIComponent(params.pokemon);
    const data = await fetchSmogonStats(pokemonName);
    
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching Smogon stats:", error);
    return NextResponse.json(
      { 
        error: "Failed to fetch Smogon stats", 
        pokemon: params.pokemon, 
        formats: [],
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

