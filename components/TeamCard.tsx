"use client";

import { useState } from "react";
import { type Team } from "@/types/team";
import { parseTeamPaste, type ParsedPokemon } from "@/utils/teamParser";
import { usePokemonSprite } from "@/hooks/usePokemonSprite";
import { useSmogonStats } from "@/hooks/useSmogonStats";
import { useItemSprite } from "@/hooks/useItemSprite";

interface TeamCardProps {
  team: Team;
  onEdit?: (team: Team) => void;
  onDelete?: (teamId: string) => void;
}

const PokemonSprite = ({ pokemonName }: { pokemonName: string }) => {
  const { sprite, isLoading } = usePokemonSprite(pokemonName);

  if (isLoading) {
    return (
      <div className="w-16 h-16 bg-[var(--notion-gray)] rounded flex items-center justify-center">
        <div className="w-4 h-4 border-2 border-[var(--notion-border)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!sprite) {
    return (
      <div className="w-16 h-16 bg-[var(--notion-gray)] rounded flex items-center justify-center text-xs text-[var(--foreground)] opacity-50">
        ?
      </div>
    );
  }

  return (
    <img
      src={sprite}
      alt={pokemonName}
      className="w-16 h-16 object-contain"
      onError={(e) => {
        (e.target as HTMLImageElement).style.display = "none";
      }}
    />
  );
};

const ItemSprite = ({ itemName }: { itemName: string }) => {
  const { sprite, isLoading } = useItemSprite(itemName);

  if (isLoading) {
    return (
      <div className="w-6 h-6 bg-[var(--notion-gray)] rounded flex items-center justify-center border border-[var(--notion-border)]">
        <div className="w-2 h-2 border border-[var(--notion-border)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!sprite && !isLoading) {
    // Show a placeholder icon for items without sprites
    return (
      <div className="w-6 h-6 bg-[var(--notion-gray)] rounded flex items-center justify-center border border-[var(--notion-border)]" title={itemName}>
        <svg className="w-4 h-4 text-[var(--foreground)] opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      </div>
    );
  }

  if (!sprite) {
    return null;
  }

  return (
    <img
      src={sprite}
      alt={itemName}
      className="w-6 h-6 object-contain border border-[var(--notion-border)] rounded bg-white dark:bg-[#191919]"
      title={itemName}
      onError={(e) => {
        // If sprite fails to load, show placeholder instead of hiding
        const img = e.target as HTMLImageElement;
        img.style.display = "none";
        // Create placeholder div if it doesn't exist
        if (!img.nextElementSibling || !img.nextElementSibling.classList.contains("item-placeholder")) {
          const placeholder = document.createElement("div");
          placeholder.className = "item-placeholder w-6 h-6 bg-[var(--notion-gray)] rounded flex items-center justify-center border border-[var(--notion-border)]";
          placeholder.title = itemName;
          placeholder.innerHTML = `<svg class="w-4 h-4 text-[var(--foreground)] opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>`;
          img.parentNode?.appendChild(placeholder);
        }
      }}
    />
  );
};

const PokemonCard = ({ pokemon }: { pokemon: ParsedPokemon }) => {
  const [showFormats, setShowFormats] = useState(false);
  const [shouldFetch, setShouldFetch] = useState(false);
  const smogonStats = useSmogonStats(shouldFetch ? pokemon.name : null);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!shouldFetch) {
      setShouldFetch(true);
    }
    setShowFormats(!showFormats);
  };

  return (
    <div className="flex flex-col items-center gap-1 p-2 rounded hover:bg-[var(--notion-hover)] transition-colors relative group cursor-pointer">
      <div onClick={handleClick} className="flex flex-col items-center gap-1 w-full">
        <div className="relative inline-block">
          <PokemonSprite pokemonName={pokemon.name} />
          {pokemon.item && (
            <div className="absolute bottom-0 right-0">
              <ItemSprite itemName={pokemon.item} />
            </div>
          )}
        </div>
        <span className="text-[11px] text-[var(--foreground)] opacity-70 text-center leading-tight">
          {pokemon.nickname || pokemon.name}
        </span>
      </div>
      
      <button
        onClick={handleClick}
        className="text-[10px] text-[var(--notion-blue)] opacity-60 hover:opacity-100 mt-1 cursor-pointer"
        title="Click to view Smogon format usage"
      >
        {smogonStats.isLoading ? (
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 border border-[var(--notion-blue)] border-t-transparent rounded-full animate-spin" />
            Loading...
          </span>
        ) : smogonStats.error ? (
          <span className="opacity-50">Error</span>
        ) : smogonStats.formats.length > 0 ? (
          <span>{smogonStats.formats.length} format{smogonStats.formats.length !== 1 ? "s" : ""}</span>
        ) : shouldFetch ? (
          <span className="opacity-50">No data</span>
        ) : (
          <span>View stats</span>
        )}
      </button>

      {showFormats && (
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 bg-white dark:bg-[#191919] border border-[var(--notion-border)] rounded-[3px] p-2 z-50 shadow-lg max-h-48 overflow-y-auto min-w-[200px]">
          {!shouldFetch ? (
            <div className="text-[11px] text-[var(--foreground)] opacity-70 text-center py-2">
              Click "View stats" to load data
            </div>
          ) : smogonStats.isLoading ? (
            <div className="text-[11px] text-[var(--foreground)] opacity-70 text-center py-2">
              Loading format data...
            </div>
          ) : smogonStats.error ? (
            <div className="text-[11px] text-[var(--foreground)] opacity-70 text-center py-2">
              Failed to load stats: {smogonStats.error}
            </div>
          ) : smogonStats.formats.length > 0 ? (
            <>
              <div className="text-[11px] font-medium text-[var(--foreground)] mb-1.5">
                Used in:
              </div>
              <div className="space-y-1">
                {smogonStats.formats.map((format, idx) => (
                  <div key={idx} className="text-[10px] text-[var(--foreground)] opacity-80">
                    <span className="font-medium">{format.format}</span>
                    {format.usage && (
                      <span className="ml-1 opacity-60">
                        ({format.usage.toFixed(2)}%)
                      </span>
                    )}
                    {format.rank && (
                      <span className="ml-1 opacity-50">
                        #{format.rank}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-[11px] text-[var(--foreground)] opacity-70 text-center py-2">
              No usage data found for {pokemon.name}
              <div className="text-[10px] opacity-50 mt-1">
                (Not used in tracked formats)
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export const TeamCard = ({ team, onEdit, onDelete }: TeamCardProps) => {
  const parsedTeam = parseTeamPaste(team.teamPaste);
  const [copied, setCopied] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  
  const MAX_DESCRIPTION_LENGTH = 150;
  const shouldTruncate = team.strategy && team.strategy.length > MAX_DESCRIPTION_LENGTH;
  const displayDescription = shouldTruncate && !isDescriptionExpanded
    ? team.strategy.substring(0, MAX_DESCRIPTION_LENGTH) + "..."
    : team.strategy;

  const handleEdit = () => {
    if (onEdit) {
      onEdit(team);
    }
  };

  const handleDelete = () => {
    if (onDelete && team.id) {
      if (confirm("Are you sure you want to delete this team?")) {
        onDelete(team.id);
      }
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(team.teamPaste);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = team.teamPaste;
      textArea.style.position = "fixed";
      textArea.style.opacity = "0";
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand("copy");
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (fallbackErr) {
        console.error("Fallback copy failed:", fallbackErr);
      }
      document.body.removeChild(textArea);
    }
  };

  return (
    <div className="bg-white dark:bg-[#191919] border border-[var(--notion-border)] rounded-[3px] p-4 hover:bg-[var(--notion-hover)] transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-[16px] font-semibold text-[var(--foreground)] mb-2 leading-[1.5] break-words">
            {team.teamName}
          </h3>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {team.format && (
              <span className="px-2 py-0.5 bg-[var(--notion-gray)] text-[var(--foreground)] rounded text-[12px] font-medium opacity-80">
                {team.format}
              </span>
            )}
            {team.generation && (
              <span className="px-2 py-0.5 bg-[var(--notion-gray)] text-[var(--foreground)] rounded text-[12px] font-medium opacity-80">
                {team.generation}
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-1 ml-2">
          <button
            onClick={handleCopy}
            className="p-1.5 text-[var(--foreground)] rounded hover:bg-[var(--notion-hover)] transition-colors opacity-70 hover:opacity-100 flex items-center justify-center"
            aria-label="Copy team paste"
            title="Copy team to clipboard"
          >
            {copied ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            )}
          </button>
          {onEdit && (
            <button
              onClick={handleEdit}
              className="p-1.5 text-[var(--foreground)] rounded hover:bg-[var(--notion-hover)] transition-colors opacity-70 hover:opacity-100"
              aria-label="Edit team"
              title="Edit team"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
          )}
          {onDelete && team.id && (
            <button
              onClick={handleDelete}
              className="p-1.5 text-[var(--foreground)] rounded hover:bg-[var(--notion-hover)] transition-colors opacity-70 hover:opacity-100"
              aria-label="Delete team"
              title="Delete team"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {team.strategy && (
        <div className="mb-3">
          <p className="text-[14px] text-[var(--foreground)] opacity-70 leading-[1.5]">
            {displayDescription}
          </p>
          {shouldTruncate && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsDescriptionExpanded(!isDescriptionExpanded);
              }}
              className="text-[12px] text-[var(--notion-blue)] hover:underline opacity-80 hover:opacity-100 mt-1"
            >
              {isDescriptionExpanded ? "Read less" : "Read more"}
            </button>
          )}
        </div>
      )}

      <div className="mb-3">
        <h4 className="text-[14px] font-medium text-[var(--foreground)] mb-2 opacity-80">
          Pokemon ({parsedTeam.pokemon.length})
        </h4>
            {parsedTeam.pokemon.length === 0 ? (
              <p className="text-[12px] text-[var(--foreground)] opacity-50 italic">
                No Pokemon found in team paste
              </p>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {parsedTeam.pokemon.map((pokemon, index) => (
                  <PokemonCard key={`${pokemon.name}-${index}`} pokemon={pokemon} />
                ))}
              </div>
            )}
      </div>

      <details className="mt-3">
        <summary className="cursor-pointer text-[14px] text-[var(--notion-blue)] hover:underline opacity-80 hover:opacity-100">
          View Full Team Paste
        </summary>
        <pre className="mt-2 p-3 bg-[var(--notion-gray)] rounded text-[12px] overflow-x-auto text-[var(--foreground)] font-mono leading-relaxed">
          {team.teamPaste}
        </pre>
      </details>

      {team.lastUpdated && (
        <p className="text-[12px] text-[var(--foreground)] mt-3 opacity-50">
          Last updated: {new Date(team.lastUpdated).toLocaleDateString()}
        </p>
      )}
    </div>
  );
};

