'use strict'

var tape = require('tape')
var ndarray = require('ndarray')
var checkPath = require('./check-path')

tape('basic path finding test', function(t) {
  var grid = ndarray([
    0, 0, 0, 0,
    0, 1, 1, 0,
    0, 1, 0, 0,
    0, 1, 0, 1
  ], [4,4])

  var queries = []
  for(var i=0; i<4; ++i) {
    for(var j=0; j<4; ++j) {
      for(var k=0; k<4; ++k) {
        for(var l=0; l<4; ++l) {
          queries.push([[i,j],[k,l]])
        }
      }
    }
  }

  checkPath(t, grid, queries)

  //Something with weird topology
  grid = ndarray([
    0, 0, 0, 0,
    1, 1, 1, 1,
    0, 0, 0, 0,
    0, 0, 0, 0
  ], [4,4])
  checkPath(t, grid, queries)

  grid = ndarray([
    0, 0, 1, 0,
    1, 0, 0, 1,
    0, 0, 0, 1,
    0, 1, 0, 0
  ], [4,4])
  checkPath(t, grid, queries)


  t.end()
})
