var pathfinding = require('./libraries/pathfinding')
var nodePathFinding = require('./libraries/node-pathfinding')
var l1path = require('./libraries/l1path')
var easystar = require('./libraries/easystar')
var andrea = require('./libraries/astar-andrea')

module.exports = {
  'l1-path-finder': l1path,
  //'easystar (BROKEN)': easystar,  //Library is too messed up
  'astar-andrea (BROKEN)': andrea,
  'node-pathfinding': nodePathFinding,
  'pathfinding.js: astar': pathfinding.astar,
  'pathfinding.js: bestFirst (BROKEN)': pathfinding.bestFirst,
  'pathfinding.js: bfs': pathfinding.bfs,
  'pathfinding.js: dijktra': pathfinding.dijkstra,
  'pathfinding.js: jps': pathfinding.jps,
  'pathfinding.js: biastar (BROKEN)': pathfinding.biastar,
  'pathfinding.js: bibestFirst (BROKEN)': pathfinding.bibestFirst,
  'pathfinding.js: bibfs': pathfinding.bibfs,
  'pathfinding.js: bidijkstra': pathfinding.bidijkstra
}
