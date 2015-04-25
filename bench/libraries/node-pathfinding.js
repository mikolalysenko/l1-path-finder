'use strict'

module.exports = preprocess

var pathfinding = require('node-pathfinding')
var unpack = require('ndarray-unpack')

function preprocess(ndgrid) {
  var array = unpack(ndgrid)
  var shape = ndgrid.shape
  var bytes = pathfinding.bytesFrom2DArray(shape[0], shape[1], array)
  var grid = pathfinding.buildGrid(shape[0], shape[1], bytes)
  return function(sy, sx, ty, tx, out) {
    var p = pathfinding.findPath(sx, sy, tx, ty, grid, false, false)
    if(p) {
      if(out) {
        for(var i=0; i<p.length; ++i) {
          out[2*i] = p[i]>>>16
          out[2*i+1] = p[i]&65535
        }
      }
      return p.length-1
    }
    return 0
  }
}
