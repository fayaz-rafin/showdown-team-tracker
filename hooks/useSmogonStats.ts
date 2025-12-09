import { useState, useEffect } from "react";

export interface SmogonFormatUsage {
  format: string;
  usage: number;
  rank?: number;
}

export interface SmogonStats {
  pokemon: string;
  formats: SmogonFormatUsage[];
  isLoading: boolean;
  error: string | null;
}

export const useSmogonStats = (pokemonName: string | null) => {
  const [stats, setStats] = useState<SmogonStats>({
    pokemon: pokemonName || "",
    formats: [],
    isLoading: false,
    error: null,
  });

  useEffect(() => {
    if (!pokemonName) {
      setStats({ pokemon: "", formats: [], isLoading: false, error: null });
      return;
    }

    setStats((prev) => ({ ...prev, isLoading: true, error: null }));

    console.log(`Fetching Smogon stats for: ${pokemonName}`);
    
    fetch(`/api/smogon/${encodeURIComponent(pokemonName.toLowerCase())}`)
      .then((res) => {
        console.log(`Response status: ${res.status}`);
        if (!res.ok) {
          return res.json().then((errData) => {
            console.error("API error:", errData);
            throw new Error(errData.error || "Failed to fetch Smogon stats");
          });
        }
        return res.json();
      })
      .then((data) => {
        console.log(`Received data for ${pokemonName}:`, data);
        console.log(`Formats array:`, data.formats);
        console.log(`Formats length:`, data.formats?.length || 0);
        setStats({
          pokemon: pokemonName,
          formats: data.formats || [],
          isLoading: false,
          error: null,
        });
      })
      .catch((err) => {
        console.error(`Error fetching stats for ${pokemonName}:`, err);
        setStats({
          pokemon: pokemonName,
          formats: [],
          isLoading: false,
          error: err.message,
        });
      });
  }, [pokemonName]);

  return stats;
};

