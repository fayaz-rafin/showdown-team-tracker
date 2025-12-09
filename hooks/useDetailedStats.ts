import { useState, useEffect } from "react";

export interface MoveUsage {
  move: string;
  usage: number;
}

export interface DetailedStats {
  pokemon: string;
  generation: string;
  format: string;
  usage: number;
  rank: number;
  moves: MoveUsage[];
  abilities?: Array<{ ability: string; usage: number }>;
  items?: Array<{ item: string; usage: number }>;
  spreads?: Array<{ spread: string; usage: number }>;
  isLoading: boolean;
  error: string | null;
}

export const useDetailedStats = (
  pokemonName: string | null,
  generation: string | null,
  format: string | null
) => {
  const [stats, setStats] = useState<DetailedStats>({
    pokemon: pokemonName || "",
    generation: generation || "",
    format: format || "",
    usage: 0,
    rank: 0,
    moves: [],
    isLoading: false,
    error: null,
  });

  useEffect(() => {
    if (!pokemonName || !generation || !format) {
      setStats({
        pokemon: pokemonName || "",
        generation: generation || "",
        format: format || "",
        usage: 0,
        rank: 0,
        moves: [],
        isLoading: false,
        error: null,
      });
      return;
    }

    setStats((prev) => ({ ...prev, isLoading: true, error: null }));

    const params = new URLSearchParams({
      generation,
      format,
    });

    fetch(`/api/smogon/${encodeURIComponent(pokemonName.toLowerCase())}/detailed?${params}`)
      .then((res) => {
        if (!res.ok) {
          return res.json().then((errData) => {
            throw new Error(errData.error || "Failed to fetch detailed stats");
          });
        }
        return res.json();
      })
      .then((data) => {
        setStats({
          ...data,
          isLoading: false,
          error: null,
        });
      })
      .catch((err) => {
        console.error(`Error fetching detailed stats for ${pokemonName}:`, err);
        setStats({
          pokemon: pokemonName,
          generation,
          format,
          usage: 0,
          rank: 0,
          moves: [],
          isLoading: false,
          error: err.message,
        });
      });
  }, [pokemonName, generation, format]);

  return stats;
};





