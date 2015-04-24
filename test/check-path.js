'use strict'

var pathfinding = require('node-pathfinding')
var unpack = require('ndarray-unpack')
var createPlanner = require('../lib/planner')
var checkPlannerInvariant = require('./planner-invariant')

module.exports = verifyCases

function checkPath(t, grid, path, dist, start, end) {
  if(path.length === 0) {
    t.equals(dist, Infinity, 'empty path ok')
    return
  }
  
  t.equals(path.length % 2, 0, 'path even length')
  t.equals(path[0], start[0], 'start x ok')
  t.equals(path[1], start[1], 'start y ok')
  t.equals(path[path.length-2], end[0], 'end x ok')
  t.equals(path[path.length-1], end[1], 'end y ok')

  for(var i=2; i<path.length; i+=2) {
    //Compare x/y components
    var px = path[i-2]
    var py = path[i-1]
    var x = path[i]
    var y = path[i+1]

    t.ok(x === px || y === py, 'at least one component =')
    t.ok(x !== px || y !== py, 'at most one component =')

    while(px !== x) {
      t.equals(grid.get(px, py), 0, 'path clear')
      if(px < x) {
        px += 1
      } else {
        px -= 1
      }
    }
    while(py !== y) {
      t.equals(grid.get(px, py), 0, 'path clear')
      if(py < y) {
        py += 1
      } else {
        py -= 1
      }
    }
  }
}

function verifyCases(t, grid, queries) {
  //Prepare l1-path-find data structure
  var planner = createPlanner(grid)
  checkPlannerInvariant(t, planner)

  //Prepare node-pathfinding structures
  var array = unpack(grid)
  var shape = grid.shape
  var bytes = pathfinding.bytesFrom2DArray(shape[0], shape[1], array)
  var nodegrid = pathfinding.buildGrid(shape[0], shape[1], bytes)

  //Run the planner
  for(var i=0; i<queries.length; ++i) {
    var q = queries[i]

    //Run planner
    var path = []
    var dist = planner.search(q[0][0], q[0][1], q[1][0], q[1][1], path)

    //Check planner invariant
    checkPlannerInvariant(t, planner)

    //Check path
    checkPath(t, grid, path, dist, q[0], q[1])

    //Run node-pathfinding
    var expectedPath = pathfinding.findPath(q[0][0], q[0][1], q[1][0], q[1][1], nodegrid, false, false)

    //Compare path lengths
    if(expectedPath.length === 0) {
      t.equals(dist, Infinity, 'path empty')
    } else {
      t.equals(dist, expectedPath.length-1, 'path length ok')
    }
  }
}
