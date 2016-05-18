'use strict'
var EasyStar = require('easystarjs')
var unpack = require('ndarray-unpack')
module.exports = function(grid) {
  var array = unpack(grid)
  var easystar = new EasyStar.js()
  easystar.setGrid(array)
  easystar.setAcceptableTiles([0])
  easystar.enableSync()

  return function(sy, sx, ty, tx, out) {
    var result
    easystar.findPath(sy, sx, ty, tx, function(path) {
      if (path) {
        var len = 0
        if(out) {
          for(var i=0; i<path.length; ++i) {
            out[2*i] = path[i].x
            out[2*i+1] = path[i].y
          }
        }
        for(var i=1; i<path.length; ++i) {
          var p0 = path[i]
          var p1 = path[i-1]
          len += Math.abs(p0.x-p1.x) + Math.abs(p0.y-p1.y)
        }
        result = len
      } else {
        result = 0
      }
    })
    easystar.calculate()
    return result
  }
}
