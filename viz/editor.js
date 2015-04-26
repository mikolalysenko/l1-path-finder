'use strict'

var ndarray = require('ndarray')
var createRenderer = require('./render')

module.exports = createEditor

function createEditor(shape, canvas) {
  shape = shape || [32, 32]
  var renderer = createRenderer(shape, canvas)
  var data = ndarray(new Uint8Array(shape[0]*shape[1]), shape)

  var tileState = 1

  renderer.events.on('button-change', function(tileX, tileY, button) {
    if((button & 1) && tileX >= 0 && tileY >= 0) {
      tileState = (data.get(tileX, tileY)^1)&1
      data.set(tileX, tileY, tileState)
      renderer.events.emit('data-change')
    }
  })

  renderer.events.on('tile-change', function(tileX, tileY, button) {
    if((button & 1) && tileX >= 0 && tileY >= 0) {
      data.set(tileX, tileY, tileState)
      renderer.events.emit('data-change')
    }
  })

  renderer.grid = data

  renderer.events.on('render', function() {
    for(var i=0; i<data.shape[0]; ++i) {
      for(var j=0; j<data.shape[1]; ++j) {
        if(data.get(i,j)) {
          renderer.tile(i, j, '#ccc')
        }
      }
    }
  })

  return renderer
}
