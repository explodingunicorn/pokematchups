import type {
  Player,
  TournamentConfig,
  SimulationResults,
} from "../types/tournament";

export function tourneySim(
  config: TournamentConfig,
  options?: { useLocalStorage?: boolean; day1Records?: Player[] }
): SimulationResults {
  const {
    matchupMatrix,
    metaPercentages,
    matchupNames,
    n_players,
    skillPercents,
    isDay2,
  } = config;

  const useLocalStorage = options?.useLocalStorage ?? true;
  const day2 = isDay2;

  // Calculate total percentage
  const totalPercentage = metaPercentages.reduce((a, b) => a + b, 0);

  // Determine if we need an "Other" deck
  let adjustedMetaPercentages = [...metaPercentages];
  let adjustedMatchupNames = [...matchupNames];
  let adjustedSkillPercents = [...skillPercents];
  let adjustedMatchupMatrix = matchupMatrix.map((row) => [...row]);

  if (totalPercentage < 100) {
    // Add "Other" deck with remaining percentage
    const otherPercentage = 100 - totalPercentage;
    adjustedMetaPercentages.push(otherPercentage);
    adjustedMatchupNames.push("Other");
    adjustedSkillPercents.push(5); // 5% skilled players for Other deck

    // Add matchup data for "Other" deck (40% win rate against all decks)
    // Other decks have 60% win rate against "Other"
    adjustedMatchupMatrix.forEach((row) => row.push(0.6));
    const otherRow = new Array(adjustedMatchupNames.length - 1).fill(0.4);
    otherRow.push(0.5); // 50% against itself
    adjustedMatchupMatrix.push(otherRow);
  }

  const normalizedMetaPercentages = adjustedMetaPercentages.map(
    (p) => p / adjustedMetaPercentages.reduce((a, b) => a + b, 0)
  );
  const numDeckPlayers = normalizedMetaPercentages.map((p) =>
    Math.round(n_players * p)
  );

  // Adjust for rounding errors to ensure we have exactly n_players
  const totalPlayers = numDeckPlayers.reduce((a, b) => a + b, 0);
  if (totalPlayers !== n_players) {
    const diff = n_players - totalPlayers;
    // Add/subtract the difference to the largest deck
    const maxIndex = numDeckPlayers.indexOf(Math.max(...numDeckPlayers));
    numDeckPlayers[maxIndex] += diff;
  }

  let allRecords: Player[];
  let numRounds: number;

  if (day2) {
    numRounds = 6;
    // Load Day1 data from localStorage or provided data
    if (options?.day1Records) {
      allRecords = options.day1Records.filter(
        (player) => player.matchPoints >= 16
      );
      allRecords.forEach((player, index) => {
        player.Day2id = index + 1;
      });
    } else if (useLocalStorage && typeof localStorage !== "undefined") {
      const day1Data = localStorage.getItem("Day1Records");
      if (day1Data) {
        const day1Records: Player[] = JSON.parse(day1Data);
        allRecords = day1Records.filter((player) => player.matchPoints >= 16);
        allRecords.forEach((player, index) => {
          player.Day2id = index + 1;
        });
      } else {
        throw new Error("Day 1 data not found");
      }
    } else {
      throw new Error("Day 1 data not found");
    }
  } else {
    numRounds = 8;
    allRecords = createInitialPlayers(
      numDeckPlayers,
      adjustedMatchupNames,
      adjustedSkillPercents,
      config.tuffEnabled,
      config.tuffCounts
    );
  }

  // Run tournament rounds
  for (let r = 1; r <= numRounds; r++) {
    allRecords = runRound(
      allRecords,
      adjustedMatchupNames,
      adjustedMatchupMatrix,
      day2
    );
  }

  // Sort by match points
  allRecords.sort((a, b) => b.matchPoints - a.matchPoints);

  // Save results only if localStorage is available and enabled
  if (useLocalStorage && typeof localStorage !== "undefined") {
    if (day2) {
      localStorage.setItem("Day2Records", JSON.stringify(allRecords));
    } else {
      localStorage.setItem("Day1Records", JSON.stringify(allRecords));
    }
  }

  return { allRecords };
}

function createInitialPlayers(
  numDeckPlayers: number[],
  matchupNames: string[],
  skillPercents: number[],
  tuffEnabled?: { [deck: string]: boolean },
  tuffCounts?: { [deck: string]: number }
): Player[] {
  const allRecords: Player[] = [];
  let ids = 1;

  // Randomize deck orders
  const indices = Array.from({ length: matchupNames.length }, (_, i) => i);
  shuffleArray(indices);

  for (let i = 0; i < indices.length; i++) {
    const deckIndex = indices[i];
    const deckName = matchupNames[deckIndex];
    const skillPercent = skillPercents[deckIndex];
    const playerCount = numDeckPlayers[deckIndex];

    // Check if TUFF is enabled for this deck
    const isTuffEnabled = tuffEnabled?.[deckName] || false;
    const tuffCount = tuffCounts?.[deckName] || 0;

    // Convert percentage to "every Xth player"
    // e.g., 20% = every 5th player, 10% = every 10th player
    const everyX = skillPercent > 0 ? Math.round(100 / skillPercent) : Infinity;

    for (let j = 1; j <= playerCount; j++) {
      let skill = 0;

      // Assign TUFF players first (highest skill: 0.4)
      if (isTuffEnabled && j <= tuffCount) {
        skill = 0.4;
      }
      // Then assign skilled players (skill: 0.2)
      else if (everyX !== Infinity && j % everyX === 0) {
        skill = 0.2;
      }

      const player: Player = {
        deck: deckName,
        matchPoints: 0,
        id: ids,
        opponents: [],
        skill,
      };

      allRecords.push(player);
      ids++;
    }
  }

  return allRecords;
}

function runRound(
  allRecords: Player[],
  matchupNames: string[],
  matchupMatrix: number[][],
  day2: boolean
): Player[] {
  const pairedPlayers = new Set<number>();
  const playersCopy = [...allRecords].sort(
    (a, b) => b.matchPoints - a.matchPoints
  );

  // Group players by match points
  const matchPointGroups = new Map<number, Player[]>();
  playersCopy.forEach((player) => {
    const mp = player.matchPoints;
    if (!matchPointGroups.has(mp)) {
      matchPointGroups.set(mp, []);
    }
    matchPointGroups.get(mp)!.push(player);
  });

  const sortedMatchPoints = Array.from(matchPointGroups.keys()).sort(
    (a, b) => b - a
  );

  for (const player of playersCopy) {
    const playerId = day2 ? player.Day2id! : player.id;

    if (!pairedPlayers.has(playerId)) {
      // Check for bye
      if (allRecords.length - pairedPlayers.size === 1) {
        player.matchPoints += 3;
        player.opponents.push(0);
        pairedPlayers.add(playerId);
        continue;
      }

      let opponentFound = false;

      for (const matchPointKey of sortedMatchPoints) {
        if (matchPointKey <= player.matchPoints && !opponentFound) {
          const result = checkForOpponent(
            player,
            matchPointGroups.get(matchPointKey)!,
            matchupNames,
            matchupMatrix,
            pairedPlayers,
            day2
          );

          if (result.opponentFound) {
            const updatedPlayer = allRecords.find(
              (p) =>
                (day2 ? p.Day2id : p.id) ===
                (day2 ? result.player1.Day2id : result.player1.id)
            )!;
            const updatedOpponent = allRecords.find(
              (p) =>
                (day2 ? p.Day2id : p.id) ===
                (day2 ? result.player2.Day2id : result.player2.id)
            )!;

            Object.assign(updatedPlayer, result.player1);
            Object.assign(updatedOpponent, result.player2);

            opponentFound = true;
          }
        }
      }
    }
  }

  return allRecords;
}

function checkForOpponent(
  player: Player,
  mpPlayers: Player[],
  matchupNames: string[],
  matchupMatrix: number[][],
  pairedPlayers: Set<number>,
  day2: boolean
): { player1: Player; player2: Player; opponentFound: boolean } {
  const playerId = day2 ? player.Day2id! : player.id;

  if (pairedPlayers.has(playerId)) {
    return { player1: player, player2: player, opponentFound: true };
  }

  const shuffledPlayers = [...mpPlayers];
  shuffleArray(shuffledPlayers);

  for (const currOpp of shuffledPlayers) {
    const oppId = day2 ? currOpp.Day2id! : currOpp.id;

    if (
      currOpp.id !== player.id &&
      !player.opponents.includes(currOpp.id) &&
      !pairedPlayers.has(oppId)
    ) {
      const [updatedPlayer, updatedOpponent] = playGame(
        player,
        currOpp,
        matchupNames,
        matchupMatrix
      );

      pairedPlayers.add(day2 ? updatedPlayer.Day2id! : updatedPlayer.id);
      pairedPlayers.add(day2 ? updatedOpponent.Day2id! : updatedOpponent.id);

      return {
        player1: updatedPlayer,
        player2: updatedOpponent,
        opponentFound: true,
      };
    }
  }

  return { player1: player, player2: player, opponentFound: false };
}

function playGame(
  player1: Player,
  player2: Player,
  matchupNames: string[],
  matchupMatrix: number[][]
): [Player, Player] {
  const deck1Index = matchupNames.indexOf(player1.deck);
  const deck2Index = matchupNames.indexOf(player2.deck);

  const matchupPercent1 = matchupMatrix[deck1Index][deck2Index];
  const matchupPercent2 = matchupMatrix[deck2Index][deck1Index];

  const tieRate =
    matchupPercent1 + matchupPercent2 === 1
      ? 0.15
      : 1 - Math.abs(matchupPercent1 + matchupPercent2);

  const randomValue = Math.random();

  if (randomValue < tieRate) {
    // Tie
    player1.matchPoints += 1;
    player2.matchPoints += 1;
  } else {
    // Best of 3
    let player1Wins = 0;
    for (let i = 0; i < 3; i++) {
      const gameRandom = Math.random();
      if (gameRandom < matchupPercent1 + (player1.skill - player2.skill)) {
        player1Wins++;
      }
    }

    if (player1Wins > 1) {
      player1.matchPoints += 3;
    } else {
      player2.matchPoints += 3;
    }
  }

  // Update opponents
  player1.opponents.push(player2.id);
  player2.opponents.push(player1.id);

  return [player1, player2];
}

function shuffleArray<T>(array: T[]): void {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}
