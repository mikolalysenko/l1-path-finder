'use strict'

var createPlanner = require('../../lib/planner')

module.exports = function(grid) {
  var planner = createPlanner(grid)
  return function(sy, sx, ty, tx, out) {
    var d = planner.search(sx, sy, tx, ty, out)
    if(d >= Infinity) {
      return 0
    }
    return d
  }
}
