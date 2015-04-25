'use strict'

var tape = require('tape')
var ndarray = require('ndarray')
var checkPath = require('./check-path')
var createPlanner = require('../lib/planner')

tape('basic path finding test', function(t) {
  var grid = ndarray([
    0, 0, 0, 0, 0, 0, 0,
    0, 1, 0, 1, 0, 1, 0,
    0, 0, 0, 0, 0, 0, 0,
    0, 1, 0, 1, 0, 1, 0,
    0, 0, 0, 0, 0, 0, 0,
    0, 1, 0, 1, 0, 1, 0,
    0, 0, 0, 0, 0, 0, 0
  ], [7,7])

  var planner = createPlanner(grid)
  var geom = planner.geometry
  var graph = planner.graph


  //Test paths
  var queries = []
  for(var i=0; i<7; ++i) {
    for(var j=0; j<7; ++j) {
      for(var k=0; k<=i; ++k) {
        for(var l=0; l<=j; ++l) {
          queries.push([[i,j],[k,l]])
        }
      }
    }
  }

  checkPath(t, grid, queries)



  t.end()
})
