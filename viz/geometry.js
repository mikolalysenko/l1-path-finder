'use strict'

var createEditor = require('./editor')
var createGeometry = require('../lib/geometry')

var editor = createEditor()
var geometry

function buildGeometry() {
  geometry = createGeometry(editor.grid)
}

function drawGeometry() {
  editor.drawCorners(geometry.corners)
  editor.rtree(geometry.rtree)
}

buildGeometry()
editor.events.on('data-change', buildGeometry)
editor.events.on('render', drawGeometry)
