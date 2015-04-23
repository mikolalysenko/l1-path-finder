'use strict'

module.exports = preprocess

var pathfinding = require('node-pathfinding')
var unpack = require('ndarray-unpack')

function preprocess(ndgrid) {
  var array = unpack(ndgrid)
  var shape = ndgrid.shape
  var bytes = pathfinding.bytesFrom2DArray(shape[0], shape[1], array)
  var grid = pathfinding.buildGrid(shape[0], shape[1], bytes)
  return function(sx, sy, tx, ty) {
    var len = pathfinding.findPath(sx, sy, tx, ty, grid, false, false).length
    if(len > 0) {
      return len - 1
    }
    return 0
  }
}
