var pathfinding = require('./libraries/pathfinding')
var nodePathFinding = require('./libraries/node-pathfinding')
var l1path = require('./libraries/l1path')

module.exports = {
  'l1-path-finder': l1path
  /*
  'node-pathfinding': nodePathFinding,
  'pathfinding-astar': pathfinding.astar,
  //'pathfinding-bestFirst': pathfinding.bestFirst,     //BROKEN
  'pathfinding-bfs': pathfinding.bfs,
  'pathfinding-dijktra': pathfinding.dijkstra,
  'pathfinding-jps': pathfinding.jps,
  //'pathfinding-biastar': pathfinding.biastar,         //BROKEN
  //'pathfinding-bibestFirst': pathfinding.bibestFirst, //BROKEN
  'pathfinding-bibfs': pathfinding.bibfs,
  'pathfinding-bidijkstra': pathfinding.bidijkstra
  */
}
