import { NextRequest, NextResponse } from "next/server";

// Normalize Pokemon names for PokeAPI
// Handles special forms, hyphens, and variations
const normalizePokemonName = (name: string): string => {
  let normalized = name.toLowerCase().trim();
  
  // Handle special forms and variations
  // Examples: "ogerpon-wellspring" -> "ogerpon-wellspring" (keep as is)
  // "Nidoran-F" -> "nidoran-f" (keep gender suffix)
  // "Mr. Mime" -> "mr-mime" (replace spaces and dots with hyphens)
  normalized = normalized
    .replace(/\./g, "") // Remove dots
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/'/g, ""); // Remove apostrophes
  
  return normalized;
};

export async function GET(
  request: NextRequest,
  { params }: { params: { name: string } }
) {
  try {
    let pokemonName = normalizePokemonName(params.name);
    
    // Try fetching with normalized name
    let response = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonName}`);
    
    // If not found, try some common variations
    if (!response.ok) {
      // Try with original name (lowercase, no normalization)
      const originalName = params.name.toLowerCase().trim();
      if (originalName !== pokemonName) {
        response = await fetch(`https://pokeapi.co/api/v2/pokemon/${originalName}`);
      }
      
      // If still not found, try removing hyphens (for forms like "ogerpon-wellspring")
      if (!response.ok && pokemonName.includes("-")) {
        const nameWithoutHyphen = pokemonName.split("-")[0];
        response = await fetch(`https://pokeapi.co/api/v2/pokemon/${nameWithoutHyphen}`);
      }
    }
    
    if (!response.ok) {
      return NextResponse.json(
        { error: "Pokemon not found", name: params.name },
        { status: 404 }
      );
    }
    
    const data = await response.json();
    
    // Return sprite URL
    return NextResponse.json({
      name: data.name,
      sprite: data.sprites.front_default,
      id: data.id,
    });
  } catch (error) {
    console.error("Error fetching Pokemon:", error);
    return NextResponse.json(
      { error: "Failed to fetch Pokemon data", name: params.name },
      { status: 500 }
    );
  }
}

