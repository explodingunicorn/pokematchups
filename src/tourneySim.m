
function tourneySim(matchupMatrix, metaPercentages, matchupNames, n_players, skillPercents, isDay2)

day2 = isDay2;

metaPercentages = metaPercentages ./ sum(metaPercentages);
numDeckPlayers = round(n_players * metaPercentages);

% build a struct array of every player, match points, id, and played opps
if day2
    numRounds = 6;
    load("Day1.mat", "allRecords")
    fieldValues = [allRecords.matchPoints];
    threshold_ind = fieldValues >= 16;
    allRecords = allRecords(threshold_ind);

    ids = 1;
    for j = 1:length(allRecords)
        allRecords(j).Day2id = ids;
        ids = ids + 1;
    end

else
    numRounds = 8;
    ids = 1;
    playerTemplate = struct('deck', '', 'matchPoints', [], 'id', [], 'opponents', [], 'skill', []);
     
    %Replicate the empty structure to create a 1xplayers array
    allRecords = repmat(playerTemplate, 1, sum(numDeckPlayers));

    % randomize deck orders so not one deck always gets bye
    N = numel(metaPercentages);
    % Generate random permutation of players
    random_indices = randperm(N);
    randMatchupNames = matchupNames(random_indices);
    randSkillPercents = skillPercents(random_indices);
    randNumDeckPlayers = numDeckPlayers(random_indices);

    for i = 1:length(metaPercentages)
        % Create randNumDeckPlayers players of one deck

        skillPercent = randSkillPercents(i);
        everyX = round(randNumDeckPlayers(i) / skillPercent);
        for j = 1:randNumDeckPlayers(i)
            playerStruct.deck = randMatchupNames{i};
            playerStruct.matchPoints = 0;
            playerStruct.id = ids; %% initialize own id
            playerStruct.opponents = []; %% initialize faced players

            if mod(j, everyX) == 0
                playerStruct.skill = 0.2;
            else
                playerStruct.skill = 0;
            end

            allRecords(ids) = playerStruct;
            ids = ids + 1;
        end
    end
end

for r = 1:numRounds

    pairedPlayers = false(length(allRecords), 1); % keep track of all paired players

    allRecordsCopy = allRecords;
    fieldValues = [allRecordsCopy.matchPoints];
    [~, sortedIndices] = sort(fieldValues, 'descend');
    allRecordsCopy = allRecordsCopy(sortedIndices);

    d = dictionary(double.empty, {});

    for i = 1:length(allRecordsCopy)
        currPlayer = allRecordsCopy(i);
        currMP = currPlayer.matchPoints;
        if d.isKey(currMP)
            currPlayersMP = d(currMP);
            d(currMP) = {[currPlayersMP{1} currPlayer]};
        else
            d(currMP) = {currPlayer};
        end
    end

    % map created

    matchPointVals = d.keys;
    [~, sortedIndices] = sort(matchPointVals, 'descend');
    matchPointVals = matchPointVals(sortedIndices);


    for i = 1:length(allRecordsCopy)
        player = allRecordsCopy(i); % get first player

        if day2
            id = player.Day2id;
        else
            id = player.id;
        end

        if ~pairedPlayers(id) % if player is already marked as paired, do not repair

           if sum(~pairedPlayers) == 1 %only 1 player left
               % Bye!
               player.matchPoints = player.matchPoints + 3;
               player.opponents = [player.opponents 0];
               pairedPlayers(id) = true;
               allRecords(id) = player;
               opponentFound = true;
           else
               opponentFound = false;
            end

            ind = 1;
            while ~opponentFound && ind <= length(matchPointVals)
                matchPointKey = matchPointVals(ind); % get match Point value

                if matchPointKey <= player.matchPoints %higher can search for lower but not vice versa
                    [player1, player2, pairedPlayers, opponentFound] = checkForOpponent(player, d, matchPointKey, matchupNames, matchupMatrix, pairedPlayers, day2);
                end

                if ~opponentFound
                    ind = ind + 1;
                else

                    if day2
                        p1ID = player1.Day2id;
                        p2ID = player2.Day2id;
                    else
                        p1ID = player1.id;
                        p2ID = player2.id;
                    end

                    allRecords(p1ID) = player1;
                    allRecords(p2ID) = player2;
                end
                % if opponent isnt found, go to the next matchpoint value
            end

            % A Bye would go here, if opponentFound is false and
            % ind > matchPointVals, free win

        end

    end

    if all(pairedPlayers == true)
        endofRound = r;
    end

end

if day2
    fieldValues = [allRecords.matchPoints];
    [~, sortedIndices] = sort(fieldValues, 'descend');
    allRecords = allRecords(sortedIndices);

    save("Day2", "allRecords");
else
    fieldValues = [allRecords.matchPoints];
    [~, sortedIndices] = sort(fieldValues, 'descend');
    allRecords = allRecords(sortedIndices);

    save("Day1", "allRecords");
end
end

function [p1Update, p2Update, pairedPlayers, opponentFound] = checkForOpponent(player, d, matchPointKey, matchupNames, matchupMatrix, pairedPlayers, day2)
MPPlayers = d(matchPointKey); % get all players for a match point value
MPPlayers = MPPlayers{1};

N = numel(MPPlayers);
% Generate random permutation of players
random_indices = randperm(N);
MPPlayers = MPPlayers(random_indices);

opponentFound = false;
p1Update = false;
p2Update = false;

if day2
    id = player.Day2id;
else
    id = player.id;
end

if pairedPlayers(id) % if player has been paired already, skip all this
    opponentFound = true;
end

i = 1;
while ~opponentFound && i <= N % stop when opponent found or ran out of values to look at
    currOpp = MPPlayers(i); % try current opponent

    % If not the current id, not a previous opponent, and not already
    % paired then play and update

    if day2
        id = currOpp.Day2id;
    else
        id = currOpp.id;
    end

    if currOpp.id ~= player.id &&...
            ~ismember(currOpp.id, player.opponents) &&...
            ~pairedPlayers(id)

        [p1Update, p2Update] = playGame(player, currOpp, matchupNames, matchupMatrix );

        % after game is played, update players as paired and opponent found

        if day2
            p1ID = p1Update.Day2id;
            p2ID = p2Update.Day2id;
        else
            p1ID = p1Update.id;
            p2ID = p2Update.id;
        end

        pairedPlayers(p1ID) = true;
        pairedPlayers(p2ID) = true;

        opponentFound = true;
    end
    i = i + 1;
end


end

function [player1, player2] = playGame(player1, player2,  matchupNames, matchupMatrix)

% get decks
deck1 = player1.deck;
deck2 = player2.deck;

% get deck indices for matchup chart
deckNameInd1 = strcmp(matchupNames, deck1);
deckNameInd2 = strcmp(matchupNames, deck2);

%get matchup percentage
matchupPercent1 = matchupMatrix(deckNameInd1, deckNameInd2);
matchupPercent2 = matchupMatrix(deckNameInd2, deckNameInd1);

if (matchupPercent1 + matchupPercent2) == 1
    tieRate = 0.15;
else
    tieRate = 1 - abs(matchupPercent1 + matchupPercent2);
end

random_value = rand();

% Determine outcome and update match points
if random_value < tieRate %if tie rate
    player1.matchPoints = player1.matchPoints + 1;
    player2.matchPoints = player2.matchPoints + 1;

else
    winArr = [0 0 0];
    for i = 1:3
        random_value = rand();

        if random_value < matchupPercent1 + (player1.skill - player2.skill)
            winArr(i) = 1;
        end
    end

    if sum(winArr) > 1
        player1.matchPoints = player1.matchPoints + 3;
    else
        player2.matchPoints = player2.matchPoints + 3;
    end

end

% update opponents
player1.opponents = [player1.opponents player2.id]; % add each opponent to played opponents so cant play again
player2.opponents = [player2.opponents player1.id];

end