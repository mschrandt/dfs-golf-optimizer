import GLPK from "glpk.js";
import seedrandom from "seedrandom";
seedrandom("hello." , { global: true });

const MAX_ITER = 10000;



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

async function generateSolutions(numLineups, playerData, minUniqueness, maxExposure) {

  const glpk = await GLPK();
  var solutions = [];
  
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

  if(salaryCheck(bestLineup, playerData))
  {
    solutions.push({
      score: res.result.z,
      lineup: bestLineup
    });
  }

  // Generate lineups one at a time
  var lastLineup = bestLineup;
  var iter = 0;

  while (solutions.length < numLineups && iter < MAX_ITER) {
    iter++;

    const overexposedPlayers = calcOverexposure(solutions, numLineups, maxExposure, playerData);
    const underexposedPlayers = calcUnderexposure(solutions, numLineups, playerData);
    var nextLockedPlayers = [...lockedPlayers]
    if(underexposedPlayers.length > 0)
    {
      var minPlayersToForce = Math.ceil(underexposedPlayers.length/(numLineups - solutions.length));
      var maxPlayersToForce = Math.max(5, underexposedPlayers.length);
      var numPlayersToForce = Math.random() * (maxPlayersToForce - minPlayersToForce) + minPlayersToForce;
      nextLockedPlayers = nextLockedPlayers.concat(underexposedPlayers.slice(0, numPlayersToForce));
    }

    const nextExcludeLists = combinations(lastLineup, minUniqueness).filter((excludeList) => {
      for (var lockedPlayer of nextLockedPlayers) {
        if (excludeList.includes(lockedPlayer)) return false;
      }
      return true;
    });
    const nextExcludeList = nextExcludeLists[Math.round(Math.random() * nextExcludeLists.length)];
    filteredPlayers = playerData.filter(playerFilter(removedPlayers.concat(nextExcludeList).concat(overexposedPlayers)));

    await solve(
      glpk,
      buildPlayerIds(filteredPlayers),
      buildPointVars(filteredPlayers),
      buildCostVars(filteredPlayers),
      buildTotalPlayers(filteredPlayers),
      nextLockedPlayers,
      filteredPlayers
    ).then((res) => {
      if (res.result.status === glpk.GLP_OPT) {
        var lineup = Object.entries(res.result.vars)
                .filter((res) => res[1] === 1)
                .map((res) => res[0]);
        if(salaryCheck(lineup, playerData))
        {
          solutions.push({
            score: res.result.z,
            lineup: lineup
          });
        }
        lastLineup = lineup;
      }
      
    });

    solutions = unique(solutions);
  }

  var uniqueSolutions = unique(solutions).slice(0, numLineups);
  uniqueSolutions.sort((a, b) => b.score - a.score);
  return uniqueSolutions;
}

const calcOverexposure = (solutions, numLineups, maxExposure, playerData) => {
  return Object.entries(calcExposure(solutions, numLineups))
    .filter(([player, exposure]) => exposure > maxExposure || exposure > parseFloat(playerData.find((p) => p.ID === player).MaxExposure))
    .map(([player, count]) => player);
}

const calcUnderexposure = (solutions, numLineups, playerData) => {
  var exposureDict = calcExposure(solutions, numLineups);
  var exposureMap = playerData.map((player) => 
    [player, 
    {
      exposure: exposureDict[player.ID] || 0, 
      minExposure: player.MinExposure,
      exposureDelta: player.MinExposure - (exposureDict[player.ID] || 0)
    }]);
  
  var underExposedPlayers = exposureMap.filter(([player, exposureDict]) => exposureDict.exposure < exposureDict.minExposure);
  return underExposedPlayers
    .sort((a, b) => a[1].exposureDelta - b[1].exposureDelta)
    .map(([player, count]) => player.ID);
}

const calcExposure = (solutions, numLineups) => {
  const exposureDict = {};
  solutions.map((sln) => {
    sln.lineup.map((player) => {
      if (exposureDict[player]) {
        exposureDict[player] += 1;
      } else {
        exposureDict[player] = 1;
      }
    })
  });

  Object.keys(exposureDict).forEach((player) => {
    exposureDict[player] = exposureDict[player] / numLineups;
  });

  return exposureDict;
}

const salaryCheck = (lineup, playerData) => {

  var salaryUse = lineup.map((player) => {
    return parseInt(playerData.find((p) => p.ID === player).Salary);
  });
  var totalSalaryUse = salaryUse.reduce((p,c) => p+c, 0);
  return totalSalaryUse <= 50000;
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

export { generateSolutions, calcExposure };
