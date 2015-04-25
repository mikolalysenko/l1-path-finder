'use strict'

var now = require('right-now')
var createEditor = require('./map-loader')
var createPlanner = require('../lib/planner')

var editor = createEditor()
var planner

var src = [104,10]
var dst = [71,74]
var path = []

function calcPath() {
  path.length = 0
  if(src[0] < 0 || dst[0] < 0) {
    return
  }
  var start = now()
  planner.search(src[0], src[1], dst[0], dst[1], path)
  var end = now()
  console.log('elapsed time: ', (end - start))
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
  }
}

function buildPlanner() {
  planner = createPlanner(editor.grid)
  calcPath()
}

function drawGeometry() {
  editor.graph(planner.graph, '#b0b')
  editor.path(path, '#fff')
  editor.circle(src[0], src[1], '#0f0')
  editor.circle(dst[0], dst[1], '#f00')
  for(var i=0; i<planner.graph.landmarks.length; ++i) {
    var l = planner.graph.landmarks[i]
    editor.circle(l.x, l.y, '#00f')
  }
}

buildPlanner()
editor.events.on('data-change', buildPlanner)
editor.events.on('render', drawGeometry)
editor.events.on('button-change', buttonChange)
