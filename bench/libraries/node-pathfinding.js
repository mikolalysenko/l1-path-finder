'use strict'

module.exports = preprocess

var pathfinding = require('node-pathfinding')
var unpack = require('ndarray-unpack')

function preprocess(ndgrid) {
  var array = unpack(ndgrid)
  var shape = ndgrid.shape
  var bytes = pathfinding.bytesFrom2DArray(shape[0], shape[1], array)
  var grid = pathfinding.buildGrid(shape[0], shape[1], bytes)
  return function(sy, sx, ty, tx) {
    var p = pathfinding.findPath(sx, sy, tx, ty, grid, false, false)
    if(p) {
      return p.length-1
    }
    return 0
  }
}
