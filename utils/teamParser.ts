export interface ParsedPokemon {
  name: string;
  nickname?: string;
  item?: string;
  ability?: string;
  level?: number;
  teraType?: string;
  evs?: string;
  nature?: string;
  ivs?: string;
  moves: string[];
  shiny?: boolean;
  gender?: string;
}

export interface ParsedTeam {
  teamName?: string;
  pokemon: ParsedPokemon[];
  format?: string;
  generation?: string;
  strategy?: string;
}

const FORMAT_KEYWORDS: Record<string, string[]> = {
  "OU (Overused)": ["ou", "overused"],
  "Ubers": ["uber", "ubers"],
  "UU (Underused)": ["uu", "underused"],
  "RU (Rarelyused)": ["ru", "rarelyused"],
  "NU (Neverused)": ["nu", "neverused"],
  "PU": ["pu"],
  "LC (Little Cup)": ["lc", "little cup"],
  "Doubles OU": ["doubles", "doubles ou", "d ou"],
  "VGC": ["vgc"],
  "Monotype": ["monotype", "mono"],
  "Random Battle": ["random", "randbats"],
};

const GENERATION_KEYWORDS: Record<string, string[]> = {
  "Gen 1": ["gen 1", "gen i", "generation 1", "rby", "red", "blue", "yellow"],
  "Gen 2": ["gen 2", "gen ii", "generation 2", "gsc", "gold", "silver", "crystal"],
  "Gen 3": ["gen 3", "gen iii", "generation 3", "rse", "ruby", "sapphire", "emerald"],
  "Gen 4": ["gen 4", "gen iv", "generation 4", "dpp", "diamond", "pearl", "platinum"],
  "Gen 5": ["gen 5", "gen v", "generation 5", "bw", "bw2", "black", "white"],
  "Gen 6": ["gen 6", "gen vi", "generation 6", "xy", "oras"],
  "Gen 7": ["gen 7", "gen vii", "generation 7", "sm", "usum", "sun", "moon"],
  "Gen 8": ["gen 8", "gen viii", "generation 8", "swsh", "sword", "shield"],
  "Gen 9": ["gen 9", "gen ix", "generation 9", "sv", "scarlet", "violet"],
};

export const parseTeamPaste = (paste: string): ParsedTeam => {
  const lines = paste.split("\n").map((line) => line.trim()).filter((line) => line.length > 0);
  
  const team: ParsedTeam = {
    pokemon: [],
  };

  let currentPokemon: Partial<ParsedPokemon> | null = null;
  let teamName: string | undefined;

  // Check for team name in first line (common format: "Team Name" or "username's team:")
  const firstLine = lines[0].toLowerCase();
  if (firstLine.includes("'s team") || firstLine.includes("team:")) {
    teamName = lines[0].replace(/['']s team:?/i, "").trim();
    lines.shift();
  }

  // Helper function to check if a line is a Pokemon name line
  const isPokemonLine = (line: string): boolean => {
    // Not a Pokemon line if it starts with common stat keywords
    if (
      line.startsWith("Ability:") ||
      line.startsWith("Level:") ||
      line.startsWith("EVs:") ||
      line.startsWith("IVs:") ||
      line.startsWith("Tera Type:") ||
      line.startsWith("-") ||
      line.match(/^\([MF]\)$/) || // Line that is ONLY "(M)" or "(F)" - this is a gender line, not a Pokemon
      line.match(/\w+ Nature$/) || // Lines ending with "Nature" (e.g., "Adamant Nature")
      line.match(/^Nature:/) // Lines starting with "Nature:"
    ) {
      return false;
    }
    
    // Must start with a capital letter (Pokemon names are capitalized)
    if (!/^[A-Z]/.test(line)) {
      return false;
    }
    
    // Exclude lines that contain "Nature" as a standalone word (not part of a Pokemon name)
    // But allow it if it's part of a longer name
    if (line.match(/\bNature\b/) && !line.includes("@")) {
      return false;
    }
    
    // Check if it looks like a Pokemon name line
    // Format: "Pokemon (Nickname) @ Item" or "Pokemon (M) @ Item" or "Pokemon @ Item" or just "Pokemon"
    // Pokemon names typically start with a capital letter and contain letters, numbers, hyphens, spaces, apostrophes
    const commonNatures = [
      "Adamant", "Bashful", "Bold", "Brave", "Calm", "Careful", "Docile", "Gentle",
      "Hardy", "Hasty", "Impish", "Jolly", "Lax", "Lonely", "Mild", "Modest",
      "Naive", "Naughty", "Quiet", "Quirky", "Rash", "Relaxed", "Sassy", "Serious",
      "Timid"
    ];
    
    // Extract the first word (Pokemon name) before any parentheses or @
    const firstPart = line.split(/[@(]/)[0].trim();
    if (commonNatures.includes(firstPart)) {
      return false;
    }
    
    // More flexible pattern that handles:
    // - "Pokemon" (no parentheses, no item)
    // - "Pokemon @ Item" (no parentheses, with item)
    // - "Pokemon (Nickname) @ Item" (with nickname and item)
    // - "Pokemon (M) @ Item" (with gender and item)
    // - "Pokemon (F)" (with gender, no item)
    // Item names can have spaces, so we match everything after @
    const pokemonNamePattern = /^[A-Z][A-Za-z0-9\-' ]+(\s*\([^)]+\))?(\s*@\s*.+)?$/;
    return pokemonNamePattern.test(line);
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check if this is a new Pokemon line
    if (isPokemonLine(line)) {
      // Save previous Pokemon if exists
      if (currentPokemon && currentPokemon.name) {
        team.pokemon.push(currentPokemon as ParsedPokemon);
      }

      // Parse Pokemon name, nickname, and gender
      // Format: "Pokemon (Nickname) @ Item" or "Pokemon (M) @ Item" or "Pokemon @ Item" or "Pokemon"
      const nameWithParenthesesMatch = line.match(/^([A-Za-z0-9\-' ]+) \(([^)]+)\)/);
      if (nameWithParenthesesMatch) {
        const pokemonName = nameWithParenthesesMatch[1].trim();
        const contentInParens = nameWithParenthesesMatch[2].trim();
        const restOfLine = line.substring(nameWithParenthesesMatch[0].length);
        
        // Check if it's a gender (single letter M or F) or a nickname
        if (contentInParens.match(/^[MF]$/)) {
          // It's a gender: "Pokemon (M)" or "Pokemon (F)"
          currentPokemon = {
            name: pokemonName,
            gender: contentInParens,
            moves: [],
          };
        } else {
          // It's a nickname: "Pokemon (Nickname)"
          currentPokemon = {
            name: pokemonName,
            nickname: contentInParens,
            moves: [],
          };
        }

        // Parse item if present (item names can have spaces)
        const itemMatch = restOfLine.match(/@\s*(.+)/);
        if (itemMatch) {
          currentPokemon.item = itemMatch[1].trim();
        }
      } else {
        // No parentheses: "Pokemon @ Item" or just "Pokemon"
        const parts = line.split(" @ ");
        const pokemonName = parts[0].trim();
        
        currentPokemon = {
          name: pokemonName,
          moves: [],
        };

        // Parse item if present (item names can have spaces)
        if (parts.length > 1) {
          currentPokemon.item = parts.slice(1).join(" @ ").trim();
        }
      }
    } else if (currentPokemon) {
      // Parse ability
      if (line.startsWith("Ability:")) {
        currentPokemon.ability = line.replace("Ability:", "").trim();
      }
      // Parse Level
      else if (line.startsWith("Level:")) {
        const levelMatch = line.match(/Level: (\d+)/);
        if (levelMatch) {
          currentPokemon.level = parseInt(levelMatch[1], 10);
        }
      }
      // Parse Tera Type
      else if (line.startsWith("Tera Type:")) {
        currentPokemon.teraType = line.replace("Tera Type:", "").trim();
      }
      // Parse EVs
      else if (line.startsWith("EVs:")) {
        currentPokemon.evs = line.replace("EVs:", "").trim();
      }
      // Parse Nature (must be exactly "Nature" at the end, not in the middle)
      else if (line.match(/\w+ Nature$/) && !line.startsWith("-")) {
        const natureMatch = line.match(/(\w+) Nature$/);
        if (natureMatch) {
          currentPokemon.nature = natureMatch[1];
        }
      }
      // Parse IVs
      else if (line.startsWith("IVs:")) {
        currentPokemon.ivs = line.replace("IVs:", "").trim();
      }
      // Parse Shiny
      else if (line.includes("Shiny: Yes")) {
        currentPokemon.shiny = true;
      }
      // Parse Gender
      else if (line.match(/^\([MF]\)/)) {
        currentPokemon.gender = line.match(/^\(([MF])\)/)?.[1];
      }
      // Parse moves (lines starting with "-")
      else if (line.startsWith("-")) {
        const move = line.replace("-", "").trim();
        if (move && currentPokemon.moves) {
          currentPokemon.moves.push(move);
        }
      }
    }
  }

  // Add last Pokemon
  if (currentPokemon && currentPokemon.name) {
    team.pokemon.push(currentPokemon as ParsedPokemon);
  }

  // Filter out any incorrectly parsed Pokemon (e.g., nature names)
  const commonNatures = [
    "Adamant", "Bashful", "Bold", "Brave", "Calm", "Careful", "Docile", "Gentle",
    "Hardy", "Hasty", "Impish", "Jolly", "Lax", "Lonely", "Mild", "Modest",
    "Naive", "Naughty", "Quiet", "Quirky", "Rash", "Relaxed", "Sassy", "Serious",
    "Timid"
  ];
  
  team.pokemon = team.pokemon.filter((pokemon) => {
    // Remove entries where the name is a nature
    if (commonNatures.includes(pokemon.name)) {
      return false;
    }
    // Remove entries where the name contains "Nature"
    if (pokemon.name.includes("Nature")) {
      return false;
    }
    // Remove entries with empty or very short names (likely parsing errors)
    if (!pokemon.name || pokemon.name.length < 2) {
      return false;
    }
    return true;
  });

  // Try to detect format and generation from paste content
  const pasteLower = paste.toLowerCase();
  
  // Detect format
  for (const [format, keywords] of Object.entries(FORMAT_KEYWORDS)) {
    if (keywords.some((keyword) => pasteLower.includes(keyword))) {
      team.format = format;
      break;
    }
  }

  // Detect generation
  for (const [gen, keywords] of Object.entries(GENERATION_KEYWORDS)) {
    if (keywords.some((keyword) => pasteLower.includes(keyword))) {
      team.generation = gen;
      break;
    }
  }

  if (teamName) {
    team.teamName = teamName;
  }

  return team;
};

export const formatTeamForDisplay = (team: ParsedTeam): string => {
  let output = "";
  
  if (team.teamName) {
    output += `${team.teamName}\n\n`;
  }

  team.pokemon.forEach((pokemon) => {
    if (pokemon.nickname) {
      output += `${pokemon.name} (${pokemon.nickname})`;
    } else {
      output += pokemon.name;
    }

    if (pokemon.item) {
      output += ` @ ${pokemon.item}`;
    }
    output += "\n";

    if (pokemon.ability) {
      output += `Ability: ${pokemon.ability}\n`;
    }
    if (pokemon.level) {
      output += `Level: ${pokemon.level}\n`;
    }
    if (pokemon.teraType) {
      output += `Tera Type: ${pokemon.teraType}\n`;
    }
    if (pokemon.evs) {
      output += `EVs: ${pokemon.evs}\n`;
    }
    if (pokemon.nature) {
      output += `${pokemon.nature} Nature\n`;
    }
    if (pokemon.ivs) {
      output += `IVs: ${pokemon.ivs}\n`;
    }
    if (pokemon.shiny) {
      output += "Shiny: Yes\n";
    }
    if (pokemon.gender) {
      output += `(${pokemon.gender})\n`;
    }

    pokemon.moves.forEach((move) => {
      output += `- ${move}\n`;
    });

    output += "\n";
  });

  return output.trim();
};

