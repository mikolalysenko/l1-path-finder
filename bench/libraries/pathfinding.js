'use strict'

//This seems problematic, some of the tests are timing out?

var PF = require('pathfinding')

function convertNDarray(grid) {
  var result = new PF.Grid(grid.shape[0], grid.shape[1])
  for(var i=0; i<grid.shape[0]; ++i) {
    for(var j=0; j<grid.shape[1]; ++j) {
      result.setWalkableAt(i, j, !grid.get(i,j))
    }
  }
  return result
}

function wrap(FinderType) {
  var finder = new FinderType({
    allowDiagonal: true,
    diagonalMovement: 2
  })
  return function(grid) {
    var converted = convertNDarray(grid)
    return function(sx, sy, tx, ty) {
      var path = finder.findPath(sy, sx, ty, tx, converted.clone())
      var len = 0
      for(var i=1; i<path.length; ++i) {
        var p0 = path[i]
        var p1 = path[i-1]
        len += Math.abs(p0[0]-p1[0]) + Math.abs(p0[1]-p1[1])
      }
      return len
    }
  }
}

exports.astar = wrap(PF.AStarFinder)
exports.bestFirst = wrap(PF.BestFirstFinder)
exports.bfs = wrap(PF.BreadthFirstFinder)
exports.dijkstra = wrap(PF.DijkstraFinder)
exports.jps = wrap(PF.JumpPointFinder)
exports.biastar = wrap(PF.BiAStarFinder)
exports.bibestFirst = wrap(PF.BiBestFirstFinder)
exports.bibfs = wrap(PF.BiBreadthFirstFinder)
exports.bidijkstra = wrap(PF.BiDijkstraFinder)
