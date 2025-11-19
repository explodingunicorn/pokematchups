clear all;
delete Day1.mat;
delete Day2.mat;

% Next step: add a way to fix trainer hill file
% Figure out how to fix my own data again
% See if Bo3 makes a difference

%inputFile = 'RealDataMatchupChart.xlsx';
%[num, text, raw] = xlsread(inputFile);
% matchupNames = text(4:end, 1);
% matchupMatrix = num(3:end, :); % Extract matchup data starting from the fifth row
%metaPercentages = num(1, :);
%skillPercents = num(2,:);

[matchupNames, matchupMatrix]= parseTrainerHill("trainerhill-meta-matchups-2025-11-11.csv");

metaPercentages = [1.32 6.69 6.28 1.73 11.66 1.37 9.8 4.72 1.26 10.64 7.47 2.87 4.24 0.9 3.65 4.24 4.9];
skillPercents =   [0.5  0.5   1   0.5   10   10   10   10   0.5   3    5   0.5   8    0.5  5   0.5  5];

n_players = 2600;

numSimulations = 1000;

t16Map = configureDictionary("string", "double");
t32Map = configureDictionary("string", "double");
t64Map = configureDictionary("string", "double");
t128Map = configureDictionary("string", "double");
t256Map = configureDictionary("string", "double");
day2Map = configureDictionary("string", "double");

allRecords = [];
for simNum = 1:2*numSimulations
    if rem(simNum,2) == 1
        isDay2 = false;
    else
        isDay2 = true;
    end
    tourneySim(matchupMatrix, metaPercentages, matchupNames, n_players, skillPercents, isDay2);

    if isDay2
        load("Day2.mat", "allRecords");

        allDeckst16 = [allRecords(1:16).deck];
        allDeckst32 = [allRecords(1:32).deck];
        allDeckst64 = [allRecords(1:64).deck];
        allDeckst128 = [allRecords(1:128).deck];
        allDeckst256 = [allRecords(1:256).deck];
        allDecksDay2 = [allRecords(1:end).deck];

        for j = 1:length(matchupNames)
            currDeck = matchupNames{j};

            num16 = numel(strfind(allDeckst16, currDeck));
            num32 = numel(strfind(allDeckst32, currDeck));
            num64 = numel(strfind(allDeckst64, currDeck));
            num128 = numel(strfind(allDeckst128, currDeck));
            num256 = numel(strfind(allDeckst256, currDeck));
            numDay2 = numel(strfind(allDecksDay2, currDeck));

            if simNum ~= 2 % if it is not the first sim
                num16 = num16 + t16Map(currDeck);
                num32 = num32 + t32Map(currDeck);
                num64 = num64 + t64Map(currDeck);
                num128 = num128 + t128Map(currDeck);
                num256 = num256 + t256Map(currDeck);
                numDay2 = numDay2 + day2Map(currDeck);

            end

            t16Map = t16Map.insert(currDeck, num16);
            t32Map = t32Map.insert(currDeck, num32);
            t64Map = t64Map.insert(currDeck, num64);
            t128Map = t128Map.insert(currDeck, num128);
            t256Map = t256Map.insert(currDeck, num256);
            day2Map = day2Map.insert(currDeck, numDay2);

        end
    end
end

categories = t16Map.keys; % Get keys as cell array of strings
values16 = t16Map.values; % Get values as a numeric array
values32 = t32Map.values - values16; % Get values as a numeric array
values64 = t64Map.values - values32; % Get values as a numeric array
values128 = t128Map.values - values64; % Get values as a numeric array
values256 = t256Map.values - values128; % Get values as a numeric array
valuesDay2 = day2Map.values - values256;

allVals = [valuesDay2'; values256'; values128'; values64'; values32'; values16'];

subplot(2,2,1);
bar(categories, allVals, 'stacked');
title("Day 2 Threshold Numbers")
legend('Day2','256','128', '64', '32', '16');
axis('auto');
ylabel("Players");
xlabel("Decks");

metaPercentages = metaPercentages ./ sum(metaPercentages);

day1numbers = round(n_players * metaPercentages ) * 100; % all of each decks in day 1
day2numbers = sum(allVals,1); % all of each deck in day 2

conversionRate = day2numbers ./ day1numbers; % how many of each deck converted to day 2 based on percent

allDay2decks = sum(allVals, "all");

day2metaPercentages = day2numbers / allDay2decks;

subplot(2,2,2);
bar(categories', [metaPercentages' day2metaPercentages']);
title("Meta Percentages");
legend("Day1", "Day2");
axis('auto');
ylabel("Percent");
xlabel("Decks");

% how many of each day 2 deck converted into T16
top16Numbers = values16; % Number of decks that made it to T16
conversionToTop16 = top16Numbers' ./ day2numbers; % Calculate conversion rate to T16

subplot(2,2,3);
bar(categories', conversionToTop16 );
title("T16 conversion of day2 decks");
axis('auto');
ylabel("Percent");
xlabel("Decks");

t16deckAvg = top16Numbers / sum(top16Numbers);

subplot(2,2,4);
bar(categories', t16deckAvg * 16);
title("T16 Avg composition");
axis('auto');
ylabel("Percent");
xlabel("Decks");

function [matchupNames, matchupMatrix] = parseTrainerHill(filePath)

[num, text, ~] = xlsread(filePath);

decks1 = text(2:end, 1); % all deck names
decks2 = text(2:end, 2); % all deck names

numNames = sqrt(length(decks1));

matchupMatrix = zeros(numNames, numNames);

winRates = num(:,1) ./ (num(:,1) + num(:,2) + num(:,3));

outerMap = configureDictionary('string', 'dictionary');

for i = 1:length(decks1)

    if ~outerMap.isKey(decks1{i}) %if not a key, add it
        outerMap = outerMap.insert(decks1{i}, configureDictionary('string', 'double'));
    end

    % get inner map, add win rate
    innerMap = outerMap(decks1{i});
    innerMap = innerMap.insert(decks2{i}, winRates(i));
    outerMap(decks1{i}) = innerMap;

end

matchupNames = outerMap.keys;

for i = 1:length(matchupNames)
    innerMap = outerMap(matchupNames(i));
    values = innerMap.values';
    matchupMatrix(i,:) = values;

end

end