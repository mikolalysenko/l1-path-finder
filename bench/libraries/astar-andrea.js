'use strict'

var AStar = require('astar-andrea')
var unpack = require('ndarray-unpack')

module.exports = preprocess

function preprocess(grid) {
  var array = unpack(grid)
  return function(sy, sx, ty, tx, out) {
    var path = AStar(array, [sx,sy], [tx,ty])
    if(out) {
      for(var i=0; i<path.length; ++i) {
        out[2*i] = path[i][0]
        out[2*i+1] = path[i][1]
      }
    }
    if(path.length === 0) {
      return 0
    }
    return path.length - 1
  }
}
