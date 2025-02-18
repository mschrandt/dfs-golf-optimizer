import GLPK from "glpk.js";

function playerFilter(excludeList = []) {
  return (player) => player.FPPG !== "" && !excludeList.includes(player.ID);
}

function buildPlayerIds(playerData) {
  return playerData.map((player) => player.ID);
}

function buildPointVars(playerData) {
  return playerData.map((player) => {
    return {
      name: player.ID,
      coef: parseFloat(player.ExpectedFantasyPoints) + parseInt(player.PlayerBoost),
    };
  });
}

function buildCostVars(playerData) {
  return playerData.map((player) => {
    return {
      name: player.ID,
      coef: parseInt(player.Salary),
    };
  });
}

function buildTotalPlayers(playerData) {
  return playerData.map((player) => {
    return {
      name: player.ID,
      coef: 1,
    };
  });
}

function buildLockedPlayersSubjectTo(lockedPlayers, glpk) {
  return lockedPlayers
    .map((playerID) => {
      return {
        name: playerID + " Locked",
        vars: [{
            name: playerID,
            coef: 1
        }],
        bnds: { type: glpk.GLP_FX, lb: 1, ub: 1 },
      };
    }) ?? [];
}

function glpkLinearEquation(
  glpk,
  playerIds,
  pointVars,
  costVars,
  totalPlayersVars,
  lockedPlayers,
  unexpandedPlayerData
) {
  return {
    name: "LP",
    objective: {
      direction: glpk.GLP_MAX,
      name: "obj",
      /* x1: whether play 1 is included (0 if excluded)
        coef: expected score */
      vars: pointVars,
    },
    subjectTo: [
      {
        name: "cost",
        vars: costVars,
        bnds: { type: glpk.GLP_UP, ub: 50000 },
      },
      {
        name: "totalPlayers",
        vars: totalPlayersVars,
        bnds: { type: glpk.GLP_FX, lb: 6, ub: 6 },
      },
      ...buildLockedPlayersSubjectTo(lockedPlayers, glpk)
    ],
    binaries: playerIds,
  };
}

function solve(
  glpk,
  playerIds,
  pointVars,
  costVars,
  totalPlayersVars,
  lockedPlayers,
  unexpandedPlayerData
) {
  const options = {
    msglev: glpk.GLP_MSG_OFF,
    presol: true,
    cb: {
      call: (progress) => console.log(progress),
      each: 1,
    },
  };

  const equation = glpkLinearEquation(
    glpk,
    playerIds,
    pointVars,
    costVars,
    totalPlayersVars,
    lockedPlayers,
    unexpandedPlayerData
  );

  return glpk.solve(equation, options);
}

async function generateSolutions(numLineups, playerData, minUniqueness) {

  const glpk = await GLPK();
  const solutions = [];
  
  const removedPlayers = playerData.filter((player) => player.EliminatePlayer).map((player) => player.ID) ?? [];

  const lockedPlayers = playerData.filter((player) => player.LockPlayer).map((player) => player.ID) ?? [];

  var filteredPlayers = playerData.filter(playerFilter(removedPlayers));

  var res = await solve(
    glpk,
    buildPlayerIds(filteredPlayers),
    buildPointVars(filteredPlayers),
    buildCostVars(filteredPlayers),
    buildTotalPlayers(filteredPlayers),
    lockedPlayers,
    filteredPlayers
  );

  const bestLineup = Object.entries(res.result.vars)
    .filter((res) => res[1] === 1)
    .map((res) => res[0]);

  solutions.push({
    score: res.result.z,
    lineup: bestLineup
  });

  if (numLineups == 1) {
    return solutions;
  }

  // Generate lineups one at a time
  var lastLineup = bestLineup;
  for (var i = 0; i < numLineups * 2; i++) {
    const nextExcludeLists = combinations(lastLineup, minUniqueness).filter((excludeList) => {
      for (var lockedPlayer of lockedPlayers) {
        if (excludeList.includes(lockedPlayer)) return false;
      }
      return true;
    });
    const nextExcludeList = nextExcludeLists[Math.round(Math.random() * nextExcludeLists.length)];
    filteredPlayers = playerData.filter(playerFilter(removedPlayers.concat(nextExcludeList)));
    await solve(
      glpk,
      buildPlayerIds(filteredPlayers),
      buildPointVars(filteredPlayers),
      buildCostVars(filteredPlayers),
      buildTotalPlayers(filteredPlayers),
      lockedPlayers,
      filteredPlayers
    ).then((res) => {
      if (res.result.status === glpk.GLP_OPT) {
        solutions.push({
          score: res.result.z,
          lineup: Object.entries(res.result.vars)
            .filter((res) => res[1] === 1)
            .map((res) => res[0])
        });
      }
      lastLineup = Object.entries(res.result.vars)
        .filter((res) => res[1] === 1)
        .map((res) => res[0])
    });
  }
  var uniqueSolutions = unique(solutions).slice(0, numLineups);
  uniqueSolutions.sort((a, b) => b.score - a.score);
  return uniqueSolutions;
}

function combinations(lineup, minUniqueness = 1) {
  var combinationList = [];

  if (minUniqueness <= 1) {
    combinationList = combinationList.concat(lineup.map((v) => [v]));
  }

  if (minUniqueness <= 2) {
    combinationList = combinationList.concat(
      lineup.flatMap((v, i) => lineup.slice(i + 1).map((w) => [v, w]))
    );
  }

  if (minUniqueness <= 3) {
    combinationList = combinationList.concat(
      lineup.flatMap((v, i) =>
        lineup.slice(i + 1).flatMap((w, j) => lineup.slice(i + j + 2).map((x) => [v, w, x]))
      )
    );
  }

  if (minUniqueness <= 4) {
    combinationList = combinationList.concat(
      lineup.flatMap((v, i) =>
        lineup
          .slice(i + 1)
          .flatMap((w, j) =>
            lineup
              .slice(i + j + 2)
              .flatMap((x, k) => lineup.slice(i + j + k + 3).map((y) => [v, w, x, y]))
          )
      )
    );
  }

  if (minUniqueness <= 5) {
    combinationList = combinationList.concat(
      lineup.flatMap((v, i) =>
        lineup
          .slice(i + 1)
          .flatMap((w, j) =>
            lineup
              .slice(i + j + 2)
              .flatMap((x, k) =>
                lineup
                  .slice(i + j + k + 3)
                  .flatMap((y, l) => lineup.slice(i + j + k + l + 4).map((z) => [v, w, x, y, z]))
              )
          )
      )
    );
  }

  if (minUniqueness <= 6) {
    combinationList = combinationList.concat(
      lineup.flatMap((v, i) =>
        lineup
          .slice(i + 1)
          .flatMap((w, j) =>
            lineup
              .slice(i + j + 2)
              .flatMap((x, k) =>
                lineup
                  .slice(i + j + k + 3)
                  .flatMap((y, l) =>
                    lineup
                      .slice(i + j + k + l + 4)
                      .flatMap((z, m) =>
                        lineup.slice(i + j + k + l + m + 5).map((a) => [v, w, x, y, z, a])
                      )
                  )
              )
          )
      )
    );
  }

  return combinationList;
}

function unique(array) {
  const uniqueDict = {};
  const uniqueSolutions = [];
  for (var sln of array) {
    const hash = sln.lineup
      .sort((a, b) => a.localeCompare(b))
      .join(",");
    if (!uniqueDict[hash]) {
      uniqueDict[hash] = true;
      uniqueSolutions.push(sln);
    }
  }
  return uniqueSolutions;
}

export { generateSolutions };
