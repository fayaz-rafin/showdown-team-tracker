import { NextRequest, NextResponse } from "next/server";

// Normalize item names for PokeAPI
const normalizeItemName = (name: string): string => {
  let normalized = name.toLowerCase().trim();
  
  // Handle special cases first (before general normalization)
  const specialCases: Record<string, string> = {
    "heavy-duty boots": "heavy-duty-boots",
    "heavy duty boots": "heavy-duty-boots",
    "heavydutyboots": "heavy-duty-boots",
    "ogerpon's mask": "wellspring-mask", // Default to wellspring, but we'll try all
    "ogerpons mask": "wellspring-mask",
    "ogerpon mask": "wellspring-mask",
    "teal mask": "teal-mask",
    "wellspring mask": "wellspring-mask",
    "hearthflame mask": "hearthflame-mask",
    "cornerstone mask": "cornerstone-mask",
    "life orb": "life-orb",
    "choice scarf": "choice-scarf",
    "choice band": "choice-band",
    "choice specs": "choice-specs",
    "focus sash": "focus-sash",
    "air balloon": "air-balloon",
    "assault vest": "assault-vest",
    "rocky helmet": "rocky-helmet",
    "black sludge": "black-sludge",
    "toxic orb": "toxic-orb",
    "flame orb": "flame-orb",
    "leftovers": "leftovers",
    "eviolite": "eviolite",
  };
  
  // Check special cases first
  if (specialCases[normalized]) {
    return specialCases[normalized];
  }
  
  // General normalization
  normalized = normalized
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/'/g, "") // Remove apostrophes
    .replace(/\./g, "") // Remove dots
    .replace(/s$/g, ""); // Remove trailing 's' (for plurals)
  
  return normalized;
};

export async function GET(
  request: NextRequest,
  { params }: { params: { name: string } }
) {
  try {
    let itemName = normalizeItemName(params.name);
    const originalName = params.name.toLowerCase().trim();
    
    // List of variations to try
    const variations = [
      itemName, // Normalized name
      originalName, // Original name
      originalName.replace(/\s+/g, "-"), // With hyphens
      originalName.replace(/'/g, ""), // Without apostrophes
      originalName.replace(/\s+/g, "-").replace(/'/g, ""), // Both
    ];
    
    // Remove duplicates
    const uniqueVariations = [...new Set(variations)];
    
    let lastError: Error | null = null;
    
    // Try each variation
    for (const variation of uniqueVariations) {
      try {
        const response = await fetch(`https://pokeapi.co/api/v2/item/${variation}`, {
          headers: {
            "User-Agent": "Mozilla/5.0",
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          
          // Try to get sprite from different fields
          let sprite = data.sprites?.default;
          if (!sprite) {
            // Try other sprite fields
            sprite = data.sprites?.front_default || 
                     data.sprites?.other?.official_artwork?.front_default ||
                     null;
          }
          
          // If PokeAPI doesn't have a sprite, use PokeAPI sprites repo
          // The frontend will handle 404s with onError handler
          if (!sprite && data.id) {
            const spriteName = data.name;
            sprite = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/${spriteName}.png`;
          }
          
          // Return item sprite URL
          return NextResponse.json({
            name: data.name,
            sprite: sprite,
            id: data.id,
          });
        }
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        continue;
      }
    }
    
    // If all variations failed, return error
    console.error(`Item not found after trying variations: ${uniqueVariations.join(", ")}`);
    return NextResponse.json(
      { 
        error: "Item not found", 
        name: params.name,
        tried: uniqueVariations,
      },
      { status: 404 }
    );
  } catch (error) {
    console.error("Error fetching item:", error);
    return NextResponse.json(
      { error: "Failed to fetch item data", name: params.name },
      { status: 500 }
    );
  }
}

