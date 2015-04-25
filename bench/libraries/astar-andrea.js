'use strict'

var AStar = require('astar-andrea')
var unpack = require('ndarray-unpack')

module.exports = preprocess

function preprocess(grid) {
  var array = unpack(grid)
  return function(sx, sy, tx, ty) {
    var path = AStar(array, [sx,sy], [tx,ty])
    if(path.length === 0) {
      return 0
    }
    return path.length - 1
  }
}
