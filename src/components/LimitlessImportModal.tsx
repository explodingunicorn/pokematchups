import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  fetchTournaments,
  getMetaFromTournament,
  validateApiKey,
  type LimitlessTournament,
  type MetaPercentages,
} from "@/services/limitlessApi";

interface LimitlessImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (metaPercentages: MetaPercentages) => void;
}

export function LimitlessImportModal({
  open,
  onOpenChange,
  onImport,
}: LimitlessImportModalProps) {
  const [apiKey, setApiKey] = useState(() => {
    return localStorage.getItem("limitless_api_key") || "";
  });
  const [isValidatingKey, setIsValidatingKey] = useState(false);
  const [keyValid, setKeyValid] = useState<boolean | null>(null);
  const [tournaments, setTournaments] = useState<LimitlessTournament[]>([]);
  const [selectedTournamentId, setSelectedTournamentId] = useState<string>("");
  const [isLoadingTournaments, setIsLoadingTournaments] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string>("");

  // Save API key to localStorage
  useEffect(() => {
    if (apiKey) {
      localStorage.setItem("limitless_api_key", apiKey);
    }
  }, [apiKey]);

  // Validate API key and fetch tournaments when key changes
  useEffect(() => {
    if (!apiKey || !open) return;

    const validateAndFetch = async () => {
      setIsValidatingKey(true);
      setError("");

      const isValid = await validateApiKey(apiKey);
      setKeyValid(isValid);
      setIsValidatingKey(false);

      if (isValid) {
        await loadTournaments();
      } else {
        setError("Invalid API key. Please check and try again.");
      }
    };

    validateAndFetch();
  }, [apiKey, open]);

  const loadTournaments = async () => {
    if (!apiKey) return;

    setIsLoadingTournaments(true);
    setError("");

    try {
      const tournamentList = await fetchTournaments(
        apiKey,
        "PTCG",
        undefined,
        30
      );
      setTournaments(tournamentList);
    } catch (err) {
      setError(
        `Failed to load tournaments: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
    } finally {
      setIsLoadingTournaments(false);
    }
  };

  const handleImport = async () => {
    if (!selectedTournamentId || !apiKey) return;

    setIsImporting(true);
    setError("");

    try {
      const metaPercentages = await getMetaFromTournament(
        apiKey,
        selectedTournamentId
      );
      onImport(metaPercentages);
      onOpenChange(false);
    } catch (err) {
      setError(
        `Failed to import meta: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
    } finally {
      setIsImporting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Import Meta from Limitless</DialogTitle>
          <DialogDescription>
            Import meta percentages from recent Pokémon TCG tournaments on
            Limitless. You need an API key from{" "}
            <a
              href="https://play.limitlesstcg.com/account/api"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              Limitless API Settings
            </a>
            .
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="api-key">Limitless API Key</Label>
            <Input
              id="api-key"
              type="password"
              placeholder="Enter your API key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
            {isValidatingKey && (
              <p className="text-sm text-gray-500">Validating API key...</p>
            )}
            {keyValid === true && (
              <p className="text-sm text-green-600">✓ API key is valid</p>
            )}
          </div>

          {keyValid && (
            <div className="grid gap-2">
              <Label htmlFor="tournament">Select Tournament</Label>
              <Select
                value={selectedTournamentId}
                onValueChange={setSelectedTournamentId}
                disabled={isLoadingTournaments}
              >
                <SelectTrigger id="tournament">
                  <SelectValue
                    placeholder={
                      isLoadingTournaments
                        ? "Loading tournaments..."
                        : "Select a tournament"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {tournaments.map((tournament) => (
                    <SelectItem key={tournament.id} value={tournament.id}>
                      {tournament.name} - {formatDate(tournament.date)} (
                      {tournament.players} players)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {error && (
            <div className="rounded-md bg-red-50 p-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={!selectedTournamentId || isImporting || !keyValid}
          >
            {isImporting ? "Importing..." : "Import Meta"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
