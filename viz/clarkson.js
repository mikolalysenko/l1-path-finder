'use strict'

var createEditor = require('./editor')
var createPlanner = require('../lib/clarkson')

var editor = createEditor()
var planner

function buildPlanner() {
  planner = createPlanner(editor.grid)
}

function drawGeometry() {
  editor.graph(planner.graph, '#f0f')
  editor.drawCorners(planner.geometry.corners, '#ff0')
  editor.rtree(planner.geometry.rtree)
}

buildPlanner()
editor.events.on('data-change', buildPlanner)
editor.events.on('render', drawGeometry)
