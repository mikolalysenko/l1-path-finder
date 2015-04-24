var pathfinding = require('./libraries/pathfinding')
var nodePathFinding = require('./libraries/node-pathfinding')
var l1path = require('./libraries/l1path')

module.exports = {
  'l1-path-finder': l1path,
  'pathfinding-astar': pathfinding.astar,
  /*
  'node-pathfinding': nodePathFinding,
  //'pathfinding-bestFirst': pathfinding.bestFirst,     //BROKEN
  'pathfinding-bfs': pathfinding.bfs,
  'pathfinding-dijktra': pathfinding.dijkstra,
  'pathfinding-jps': pathfinding.jps,
  //'pathfinding-biastar': pathfinding.biastar,         //BROKEN
  //'pathfinding-bibestFirst': pathfinding.bibestFirst, //BROKEN
  'pathfinding-bibfs': pathfinding.bibfs,
  'pathfinding-bidijkstra': pathfinding.bidijkstra*/
}
