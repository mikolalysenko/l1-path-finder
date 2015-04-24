'use strict'

var PF = require('pathfinding')
var unpack = require('ndarray-unpack')
var createPlanner = require('../lib/planner')
var checkPlannerInvariant = require('./planner-invariant')
var checkGraphInvariant = require('./graph-invariant')

module.exports = verifyCases

function convertNDarrayToPF(grid) {
  var result = new PF.Grid(grid.shape[0], grid.shape[1])
  for(var i=0; i<grid.shape[0]; ++i) {
    for(var j=0; j<grid.shape[1]; ++j) {
      result.setWalkableAt(i, j, !grid.get(i,j))
    }
  }
  return result
}


function checkPath(t, grid, path, dist, start, end) {
  if(path.length === 0) {
    t.equals(dist, Infinity, 'empty path ok')
    return
  }

  t.equals(path[0], start[0], 'start x ok')
  t.equals(path[1], start[1], 'start y ok')
  t.equals(path[path.length-2], end[0], 'end x ok')
  t.equals(path[path.length-1], end[1], 'end y ok')

  var computedDist = 0

  for(var i=2; i<path.length; i+=2) {
    //Compare x/y components
    var px = path[i-2]
    var py = path[i-1]
    var x = path[i]
    var y = path[i+1]

    computedDist += Math.abs(px-x) + Math.abs(py-y)

    t.ok(x === px || y === py, 'at least one component =' + [px,py,x,y])
    t.ok(x !== px || y !== py, 'at most one component =' + [px,py,x,y])

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

  t.equals(computedDist, dist, 'distances consistent')
}

function verifyCases(t, grid, queries) {
  //Prepare l1-path-find data structure
  var planner = createPlanner(grid)
  checkPlannerInvariant(t, planner)

  //Prepare node-pathfinding structures
  var pfgrid = convertNDarrayToPF(grid)
  var pfastar = new PF.AStarFinder({
    allowDiagonal: false
  })

  //Run the planner
  for(var i=0; i<queries.length; ++i) {
    var q = queries[i]

    //Run planner
    var path = []
    var dist = planner.search(q[0][0], q[0][1], q[1][0], q[1][1], path)

    //Check planner invariant
    checkGraphInvariant(t, planner.graph)

    //Check path
    checkPath(t, grid, path, dist, q[0], q[1])

    //Run pathfinding.js
    var expectedPath = pfastar.findPath(q[0][0], q[0][1], q[1][0], q[1][1], pfgrid.clone())

    var pathBlocked = grid.get(q[0][0], q[0][1]) || grid.get(q[1][0], q[1][1])

    //Compare path lengths
    if(pathBlocked || expectedPath.length === 0) {
      t.equals(dist, Infinity, 'path empty: ' + q.join('--'))
    } else if(q[0][0] === q[1][0] && q[0][1] === q[1][1]) {
      if(grid.get(q[0][0], q[0][1])) {
        t.equals(dist, Infinity, 'path blocked')
      } else {
        t.equals(dist, 0, 'path length ok')
      }
    } else {
      t.equals(dist, ((expectedPath.length)>>>0)-1, 'path length ok: ' + expectedPath +  ' vs ' + path)
    }
  }
}
