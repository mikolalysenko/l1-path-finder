'use strict'

var createEditor = require('./editor')
var createPlanner = require('../lib/planner')

var editor = createEditor([32,32], document.getElementById('visualize-canvas'))
var planner

var src = [4,4]
var dst = [28,28]
var path = []

for(var i=1; i<4; ++i) {
  for(var j=0; j<32; ++j) {
    editor.grid.set(8*i, j, 1)
    editor.grid.set(j, 8*i, 1)
  }
}

for(var i=1; i<7; ++i) {
  editor.grid.set(16,i,0)
}

for(var i=8; i<=24; ++i) {
  editor.grid.set(i, 27, 1)
  editor.grid.set(i, 28, 0)
  editor.grid.set(i, 29, 1)
}

editor.grid.set(8, 4, 0)
editor.grid.set(24, 4, 0)
editor.grid.set(4, 16, 0)
editor.grid.set(4, 24, 0)
editor.grid.set(28, 8, 0)
editor.grid.set(28, 16, 0)

editor.grid.set(8, 10, 0)
editor.grid.set(24, 22, 0)

for(var i=9; i<24; ++i) {
  for(var j=9; j<24; ++j) {
      editor.grid.set(i,j, 0)
  }
}

for(var i=0; i<4; ++i) {
  editor.grid.set(
    (Math.random()*14+10)|0,
    (Math.random()*14+10)|0,
    1)
}

function calcPath() {
  for(var i=0; i<planner.graph.verts.length; ++i) {
    planner.graph.verts[i].weight = Infinity
  }
  path.length = 0
  if(src[0] < 0 || dst[0] < 0) {
    for(var i=0; i<planner.graph.verts.length; ++i) {
      var v = planner.graph.verts[i]
      v.distance = Infinity
      v.state = 0
      v.target = false
    }
    return
  }
  planner.search(src[0], src[1], dst[0], dst[1], path)
}

function buttonChange(tileX, tileY, buttons) {
  if(buttons&2) {
    if(src[0] < 0) {
      src[0] = tileX
      src[1] = tileY
    } else if(dst[0] < 0) {
      dst[0] = tileX
      dst[1] = tileY
    } else {
      src[0] = tileX
      src[1] = tileY
      dst[0] = dst[1] = -10
    }
    calcPath()
    drawGeometry()
  }
}

function buildPlanner() {
  planner = createPlanner(editor.grid)
  calcPath()
  drawGeometry()
}

function drawGeometry() {
  var context = editor.context
  context.fillStyle = '#132b40'
  context.fillRect(0, 0, 512, 512)

  var data = editor.grid
  for(var i=0; i<data.shape[0]; ++i) {
    for(var j=0; j<data.shape[1]; ++j) {
      if(data.get(i,j)) {
        editor.tile(i, j,  '#d6a866')
      }
    }
  }

  editor.graphDist(planner.graph)
  editor.graph(planner.graph, '#b28dc7')
  editor.drawCorners(planner.geometry.corners, '#d9e6f2')
  for(var i=0; i<planner.graph.landmarks.length; ++i) {
    var l = planner.graph.landmarks[i]
    editor.circle(l.x, l.y, '#ffffb1')
  }
  editor.path(path, '#fff')
  editor.circle(src[0], src[1], '#0f0')
  editor.circle(dst[0], dst[1], '#f00')
}

buildPlanner()
editor.events.on('data-change', buildPlanner)
editor.events.on('button-change', buttonChange)
