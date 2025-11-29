"use client";

import { useState } from "react";
import { parseTeamPaste, type ParsedTeam } from "@/utils/teamParser";
import { FORMAT_OPTIONS, GENERATION_OPTIONS, type Team } from "@/types/team";

interface TeamPasteFormProps {
  onSave: (team: Team) => Promise<void>;
  onCancel?: () => void;
  initialTeam?: Team;
}

export const TeamPasteForm = ({ onSave, onCancel, initialTeam }: TeamPasteFormProps) => {
  const [teamPaste, setTeamPaste] = useState(initialTeam?.teamPaste || "");
  const [teamName, setTeamName] = useState(initialTeam?.teamName || "");
  const [format, setFormat] = useState(initialTeam?.format || "");
  const [generation, setGeneration] = useState(initialTeam?.generation || "");
  const [strategy, setStrategy] = useState(initialTeam?.strategy || "");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parsedTeam, setParsedTeam] = useState<ParsedTeam | null>(null);

  const handleParse = () => {
    try {
      if (!teamPaste.trim()) {
        setError("Please paste a team");
        return;
      }

      const parsed = parseTeamPaste(teamPaste);
      setParsedTeam(parsed);

      // Auto-fill form fields from parsed data
      if (parsed.teamName && !teamName) {
        setTeamName(parsed.teamName);
      }
      if (parsed.format && !format) {
        setFormat(parsed.format);
      }
      if (parsed.generation && !generation) {
        setGeneration(parsed.generation);
      }

      setError(null);
    } catch (err) {
      setError("Failed to parse team. Please check the format.");
      console.error(err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (!teamPaste.trim()) {
        setError("Team paste is required");
        setIsLoading(false);
        return;
      }

      // Parse the team to extract Pokemon names for Key Pokemon field
      const parsed = parseTeamPaste(teamPaste);
      const keyPokemon = parsed.pokemon.map((p) => p.name);

      const team: Team = {
        teamName: teamName || "Untitled Team",
        teamPaste,
        format: format || undefined,
        generation: generation || undefined,
        strategy: strategy || undefined,
        keyPokemon: keyPokemon.length > 0 ? keyPokemon : undefined,
      };

      await onSave(team);
      
      // Reset form
      setTeamPaste("");
      setTeamName("");
      setFormat("");
      setGeneration("");
      setStrategy("");
      setParsedTeam(null);
    } catch (err) {
      setError("Failed to save team. Please try again.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-white dark:bg-[#191919] border border-[var(--notion-border)] rounded-[3px] p-6">
      <div>
        <label htmlFor="teamPaste" className="block text-[12px] font-medium mb-1.5 text-[var(--foreground)] opacity-70">
          Pokemon Showdown Team Paste
        </label>
        <textarea
          id="teamPaste"
          value={teamPaste}
          onChange={(e) => setTeamPaste(e.target.value)}
          placeholder="Paste your Pokemon Showdown team here..."
          className="w-full h-64 px-3 py-2 border border-[var(--notion-border)] rounded-[3px] bg-white dark:bg-[#191919] text-[var(--foreground)] font-mono text-[14px] leading-relaxed focus:outline-none focus:ring-1 focus:ring-[var(--notion-blue)]"
          required
        />
        <button
          type="button"
          onClick={handleParse}
          className="mt-2 px-3 py-1.5 bg-[var(--notion-blue)] text-white rounded-[3px] hover:opacity-90 transition-opacity text-[14px] font-medium"
        >
          Parse Team
        </button>
      </div>

      {parsedTeam && (
        <div className="bg-[var(--notion-gray)] border border-[var(--notion-border)] rounded-[3px] p-3">
          <p className="text-[14px] text-[var(--foreground)]">
            ✓ Parsed {parsedTeam.pokemon.length} Pokemon
          </p>
        </div>
      )}

      <div>
        <label htmlFor="teamName" className="block text-[12px] font-medium mb-1.5 text-[var(--foreground)] opacity-70">
          Team Name
        </label>
        <input
          id="teamName"
          type="text"
          value={teamName}
          onChange={(e) => setTeamName(e.target.value)}
          placeholder="Enter team name"
          className="w-full px-3 py-2 border border-[var(--notion-border)] rounded-[3px] bg-white dark:bg-[#191919] text-[var(--foreground)] text-[14px] focus:outline-none focus:ring-1 focus:ring-[var(--notion-blue)]"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label htmlFor="format" className="block text-[12px] font-medium mb-1.5 text-[var(--foreground)] opacity-70">
            Format
          </label>
          <select
            id="format"
            value={format}
            onChange={(e) => setFormat(e.target.value)}
            className="w-full px-3 py-2 border border-[var(--notion-border)] rounded-[3px] bg-white dark:bg-[#191919] text-[var(--foreground)] text-[14px] focus:outline-none focus:ring-1 focus:ring-[var(--notion-blue)]"
          >
            <option value="">Select format</option>
            {FORMAT_OPTIONS.map((fmt) => (
              <option key={fmt} value={fmt}>
                {fmt}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="generation" className="block text-[12px] font-medium mb-1.5 text-[var(--foreground)] opacity-70">
            Generation
          </label>
          <select
            id="generation"
            value={generation}
            onChange={(e) => setGeneration(e.target.value)}
            className="w-full px-3 py-2 border border-[var(--notion-border)] rounded-[3px] bg-white dark:bg-[#191919] text-[var(--foreground)] text-[14px] focus:outline-none focus:ring-1 focus:ring-[var(--notion-blue)]"
          >
            <option value="">Select generation</option>
            {GENERATION_OPTIONS.map((gen) => (
              <option key={gen} value={gen}>
                {gen}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="strategy" className="block text-[12px] font-medium mb-1.5 text-[var(--foreground)] opacity-70">
          Strategy Notes
        </label>
        <textarea
          id="strategy"
          value={strategy}
          onChange={(e) => setStrategy(e.target.value)}
          placeholder="Enter team strategy, win conditions, or notes..."
          className="w-full h-32 px-3 py-2 border border-[var(--notion-border)] rounded-[3px] bg-white dark:bg-[#191919] text-[var(--foreground)] text-[14px] leading-relaxed placeholder:opacity-40 focus:outline-none focus:ring-1 focus:ring-[var(--notion-blue)]"
        />
      </div>

      {error && (
        <div className="bg-[var(--notion-gray)] border border-[var(--notion-border)] rounded-[3px] p-3">
          <p className="text-[14px] text-[var(--foreground)] opacity-80">{error}</p>
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 px-4 py-2 bg-[var(--notion-blue)] text-white rounded-[3px] hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity text-[14px] font-medium"
        >
          {isLoading ? "Saving..." : initialTeam ? "Update Team" : "Save Team"}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-[var(--notion-gray)] text-[var(--foreground)] rounded-[3px] hover:bg-[var(--notion-hover)] transition-colors text-[14px] font-medium"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
};

