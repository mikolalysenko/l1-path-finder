'use strict'

var createEditor = require('./editor')
var createPlanner = require('../lib/planner')

var editor = createEditor([32,32], document.getElementById('visualize-canvas'))
var planner

var src = [-10,-10]
var dst = [-10,-10]
var path = []

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
