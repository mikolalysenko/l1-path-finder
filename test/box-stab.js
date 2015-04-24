'use strict'

var tape = require('tape')
var ndarray = require('ndarray')
var createGeometry = require('../lib/geometry')
var checkGeometry = require('./geometry-invariant')

function checkStab(t, geom, grid, boxes) {
  for(var i=0; i<boxes.length; ++i) {
    var b = boxes[i]
    var lox = Math.min(b[0], b[2])
    var loy = Math.min(b[1], b[3])
    var hix = Math.max(b[0], b[2])
    var hiy = Math.max(b[1], b[3])

    var hit = false
    for(var x=lox; x<=hix; ++x) {
      for(var y=loy; y<=hiy; ++y) {
        if(grid.get(x,y)) {
          hit = true
        }
      }
    }
    t.equals(geom.stabBox(b[0], b[1], b[2], b[3]), hit, 'stab: ' + b)
  }
}


tape('box stabbing', function(t) {

  var grid = ndarray([
    0, 0, 0, 0, 0,
    1, 0, 0, 1, 0,
    1, 1, 0, 0, 1,
    1, 1, 0, 0, 1,
    0, 0, 0, 0, 0
  ], [5,5])

  var queries = []
  for(var i=0; i<4; ++i) {
    for(var j=0; j<4; ++j) {
      for(var k=0; k<4; ++k) {
        for(var l=0; l<4; ++l) {
          queries.push([i,j,k,l])
        }
      }
    }
  }

  var geom = createGeometry(grid)
  checkGeometry(t, geom)
  checkStab(t, geom, grid, queries)

  t.end()
})
