import { useState, useEffect } from "react";

export const usePokemonSprite = (pokemonName: string | null) => {
  const [sprite, setSprite] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!pokemonName) {
      setSprite(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    fetch(`/api/pokemon/${pokemonName.toLowerCase()}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error("Pokemon not found");
        }
        return res.json();
      })
      .then((data) => {
        setSprite(data.sprite);
        setIsLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setSprite(null);
        setIsLoading(false);
      });
  }, [pokemonName]);

  return { sprite, isLoading, error };
};

