var pathfinding = require('./libraries/pathfinding')
var nodePathFinding = require('./libraries/node-pathfinding')
var l1path = require('./libraries/l1path')
var easystar = require('./libraries/easystar')
var andrea = require('./libraries/astar-andrea')

module.exports = {
  'l1-path-finder': l1path,
  'astar-andrea': andrea,                               //BROKEN
  //'easystar': easystar,                               //BROKEN
  //'node-pathfinding': nodePathFinding,                //BROKEN
  'pathfinding-astar': pathfinding.astar,
  //'pathfinding-bestFirst': pathfinding.bestFirst,     //BROKEN
  'pathfinding-bfs': pathfinding.bfs,
  'pathfinding-dijktra': pathfinding.dijkstra,
  'pathfinding-jps': pathfinding.jps,
  //'pathfinding-biastar': pathfinding.biastar,         //BROKEN
  //'pathfinding-bibestFirst': pathfinding.bibestFirst, //BROKEN
  'pathfinding-bibfs': pathfinding.bibfs,
  'pathfinding-bidijkstra': pathfinding.bidijkstra
}
