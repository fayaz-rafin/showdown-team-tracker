"use client";

import { useState, useEffect } from "react";
import { TeamPasteForm } from "@/components/TeamPasteForm";
import { TeamCard } from "@/components/TeamCard";
import { TeamFilters } from "@/components/TeamFilters";
import { type Team, type TeamFilters as TeamFiltersType } from "@/types/team";

export default function Home() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [filters, setFilters] = useState<TeamFiltersType>({});
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | undefined>();

  useEffect(() => {
    fetchTeams();
  }, [filters]);

  const [error, setError] = useState<string | null>(null);

  const fetchTeams = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filters.format) params.append("format", filters.format);
      if (filters.generation) params.append("generation", filters.generation);
      if (filters.strategy) params.append("strategy", filters.strategy);

      const response = await fetch(`/api/teams?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch teams");
      }

      if (data.teams) {
        setTeams(data.teams);
      } else {
        setTeams([]);
      }
    } catch (error) {
      console.error("Error fetching teams:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to fetch teams";
      setError(errorMessage);
      setTeams([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveTeam = async (team: Team) => {
    try {
      const method = editingTeam ? "PUT" : "POST";
      const url = editingTeam ? `/api/teams/${editingTeam.id}` : "/api/teams";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(team),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.details || "Failed to save team");
      }

      await fetchTeams();
      setShowForm(false);
      setEditingTeam(undefined);
    } catch (error) {
      console.error("Error saving team:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to save team";
      throw new Error(errorMessage);
    }
  };

  const handleEditTeam = (team: Team) => {
    setEditingTeam(team);
    setShowForm(true);
  };

  const handleDeleteTeam = async (teamId: string) => {
    try {
      const response = await fetch(`/api/teams/${teamId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete team");
      }

      await fetchTeams();
    } catch (error) {
      console.error("Error deleting team:", error);
    }
  };

  const filteredTeams = teams.filter((team) => {
    if (filters.format && team.format !== filters.format) return false;
    if (filters.generation && team.generation !== filters.generation) return false;
    if (filters.strategy && !team.strategy?.toLowerCase().includes(filters.strategy.toLowerCase())) {
      return false;
    }
    return true;
  });

  return (
    <main className="min-h-screen bg-[var(--notion-gray)] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-[40px] font-bold text-[var(--foreground)] mb-2 leading-tight flex items-center gap-3">
            <img
              src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/113.gif"
              alt="Chansey"
              className="chansey-sprite"
              onError={(e) => {
                // Fallback to static sprite if animated doesn't load
                (e.target as HTMLImageElement).src = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/113.png";
                (e.target as HTMLImageElement).classList.remove("chansey-sprite");
              }}
            />
            <span>Pokemon Showdown Team Manager</span>
          </h1>
          <p className="text-[16px] text-[var(--foreground)] opacity-70">
            Organize and manage your Pokemon Showdown teams with Notion
          </p>
        </div>

        <div className="mb-6">
          {!showForm ? (
            <button
              onClick={() => setShowForm(true)}
              className="px-4 py-2 bg-[var(--notion-blue)] text-white rounded-[3px] hover:opacity-90 transition-opacity text-[14px] font-medium"
            >
              + Add New Team
            </button>
          ) : (
            <div className="mb-6">
              <TeamPasteForm
                onSave={handleSaveTeam}
                onCancel={() => {
                  setShowForm(false);
                  setEditingTeam(undefined);
                }}
                initialTeam={editingTeam}
              />
            </div>
          )}
        </div>

        {!showForm && (
          <>
            <div className="mb-6">
              <TeamFilters filters={filters} onFilterChange={setFilters} />
            </div>

            {error && (
              <div className="mb-6 bg-white dark:bg-[#191919] border border-[var(--notion-border)] rounded-[3px] p-4">
                <p className="text-[14px] text-[var(--foreground)] opacity-80">
                  <strong>Note:</strong> {error}
                  {error.includes("MCP") && (
                    <span className="block mt-2">
                      Please set up your Notion MCP server. See README.md for instructions.
                    </span>
                  )}
                </p>
              </div>
            )}

            {isLoading ? (
              <div className="text-center py-12">
                <p className="text-[14px] text-[var(--foreground)] opacity-70">Loading teams...</p>
              </div>
            ) : filteredTeams.length === 0 ? (
              <div className="text-center py-12 bg-white dark:bg-[#191919] border border-[var(--notion-border)] rounded-[3px]">
                <p className="text-[14px] text-[var(--foreground)] opacity-70 mb-4">
                  {teams.length === 0
                    ? "No teams yet. Add your first team to get started!"
                    : "No teams match your filters."}
                </p>
                {teams.length === 0 && (
                  <button
                    onClick={() => setShowForm(true)}
                    className="px-4 py-2 bg-[var(--notion-blue)] text-white rounded-[3px] hover:opacity-90 transition-opacity text-[14px] font-medium"
                  >
                    Add Your First Team
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredTeams.map((team) => (
                  <TeamCard
                    key={team.id || team.teamName}
                    team={team}
                    onEdit={handleEditTeam}
                    onDelete={handleDeleteTeam}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}

