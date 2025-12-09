import { useState, useEffect } from "react";

export const useItemSprite = (itemName: string | null | undefined) => {
  const [sprite, setSprite] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!itemName) {
      setSprite(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    fetch(`/api/item/${itemName.toLowerCase()}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error("Item not found");
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
  }, [itemName]);

  return { sprite, isLoading, error };
};

