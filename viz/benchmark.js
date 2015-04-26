'use strict'

var now = require('right-now')
var createEditor = require('./map-loader')
var createPlanner = require('../lib/planner')

var editor = createEditor()
var planner

var src = [-10,-10]
var dst = [-10,-10]
var path = []
var totalTime = 0
var caseNo = 0
var budget = 5

var benchInProgress = false
var benchInterval

function loopTime(scenario, search, budget) {
  var start = now()
  for(var i=0; i<budget && caseNo<scenario.length; ++caseNo,++i) {
    var scen = scenario[caseNo]
    search(scen.srcX, scen.srcY, scen.dstX, scen.dstY)
  }
  return now() - start
}

function runBench() {
  var scenario = editor.scenario
  var search   = editor.search

  var start = now()
  var elapsed = 0
  var total = 0
  while(elapsed < 64) {
    total += Math.min(budget, scenario.length-caseNo)
    totalTime += loopTime(scenario, search, budget)
    elapsed = now() - start
    if(elapsed > 10) {
      budget = (Math.ceil(total / elapsed * 64) + 5)|0
    }
  }

  if(caseNo >= scenario.length) {
    editor.enable()
    src[0] = src[1] = dst[0] = dst[1] = -10
    path.length = 0
    clearInterval(benchInterval)
    benchInProgress = false
    editor.benchButton.value = 'Run Benchmark'
    editor.logMessage('done: ' + totalTime + 'ms')
  } else {
    var scen = scenario[caseNo]
    path.length = 0
    src[0] = scen.srcY
    src[1] = scen.srcX
    dst[0] = scen.dstY
    dst[1] = scen.dstX
    editor.search(src[1], src[0], dst[1], dst[0], path)
    editor.logMessage('running benchmark: ' + totalTime + 'ms')
  }
}

function doBenchmark() {
  if(benchInProgress) {
    editor.enable()
    src[0] = src[1] = dst[0] = dst[1] = -10
    path.length = 0
    clearInterval(benchInterval)
    benchInProgress = false
    editor.benchButton.value = 'Run Benchmark'
    editor.logMessage('benchmark aborted')
  } else {
    editor.disable()
    benchInProgress = true
    caseNo = 0
    totalTime = 0
    editor.logMessage('starting bencmark...')
    benchInterval = setInterval(runBench, 16)
    editor.benchButton.value = 'Stop Benchmark'
    editor.benchButton.disabled = false
  }
}

function calcPath() {
  if(benchInProgress) {
    return
  }
  path.length = 0
  if(src[0] < 0 || dst[0] < 0) {
    editor.logMessage('ready')
    return
  }
  var start = now()
  //Flipped here from benchmark
  var len = editor.search(src[1], src[0], dst[1], dst[0], path)
  var end = now()
  editor.logMessage('length: ' + len + ', search time: ' + (end - start) + 'ms')
}

function buttonChange(tileX, tileY, buttons) {
  if(benchInProgress) {
    return
  }
  if(buttons) {
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
  src[0] = src[1] = dst[0] = dst[1] = -10
  editor.logMessage('ready')
  path.length = 0
  planner = createPlanner(editor.grid)
  calcPath()
}

function drawGeometry() {
  editor.path(path, '#fff')
  editor.circle(src[0], src[1], '#0f0')
  editor.circle(dst[0], dst[1], '#f00')
}

buildPlanner()
editor.events.on('planner-change', function() {
  budget = 5
  calcPath()
})
editor.events.on('data-change', buildPlanner)
editor.events.on('render', drawGeometry)
editor.events.on('button-change', buttonChange)
editor.events.on('benchmark', doBenchmark)
