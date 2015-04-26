'use strict'

var parse = require('parse-grid-bench')
var ndarray = require('ndarray')
var toBoxes = require('bitmap-to-boxes')
var nets = require('nets')
var createRenderer = require('./render')
var codes = require('../bench/codes')
var files = require('./meta.json')

module.exports = createMapLoader

function grabFile(url, cb) {
  var burl = 'https://mikolalysenko.github.io/sturtevant-grid-benchmark/' + url.slice(1)
  nets({ url: burl, encoding: 'utf-8' }, function(err, resp, body) {
    cb(err, body)
  })
}

function createMapLoader() {
  var canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 256

  var renderer = createRenderer([32,32], canvas)
  renderer.scenario = []

  var boxes = []

  var headerDiv = document.createElement('div')
  headerDiv.innerHTML = '<h3>L1 Path Planning for Grids</h3>'
  headerDiv.style.position = 'absolute'
  headerDiv.style['text-align'] = 'center'
  headerDiv.style.left = '0'
  headerDiv.style.right = '0'
  headerDiv.style.top = '0'
  document.body.appendChild(headerDiv)

  var gitLink = document.createElement('div')
  gitLink.innerHTML = '<a href="https://github.com/mikolalysenko/l1-path-finder">GitHub Repository</a>'
  gitLink.style.position = 'absolute'
  gitLink.style['text-align'] = 'center'
  gitLink.style.left = '0'
  gitLink.style.right = '0'
  gitLink.style.bottom = '5px'
  document.body.appendChild(gitLink)

  var mapDiv = document.createElement('p')
  mapDiv.style.position = 'absolute'
  mapDiv.style.left = '5%'
  mapDiv.style.top = '30px'
  mapDiv.style.width = '90%'
  mapDiv.style.height = '30px'

  var mapSelect = document.createElement('select')
  mapSelect.style.margin = '5px'
  mapDiv.appendChild(mapSelect)

  var codeSelect = document.createElement('select')
  codeSelect.style.display = 'inline'
  codeSelect.style.margin = '5px'
  var codeNames = Object.keys(codes)
  for(var i=0; i<codeNames.length; ++i) {
    codeSelect.options.add(new Option(codeNames[i], codeNames[i]))
  }

  codeSelect.addEventListener('change', function() {
    renderer.search = renderer.algorithms[codeSelect.value]
    renderer.events.emit('planner-change')
  })

  function rebuildAlgorithms() {
    renderer.algorithms = {}
    for(var i=0; i<codeNames.length; ++i) {
      var name = codeNames[i]
      var code = codes[name]
      renderer.algorithms[name] = code(renderer.grid)
    }
    renderer.search = renderer.algorithms[codeSelect.value]
  }

  mapDiv.appendChild(codeSelect)

  var scaleSelect = document.createElement('select')
  for(var i=1; i<=16; i<<=1) {
    scaleSelect.options.add(new Option(i + 'x', i))
  }
  scaleSelect.value = '2'
  scaleSelect.style.display = 'inline'
  scaleSelect.style.margin = '5px'
  scaleSelect.addEventListener('change', function() {
    var scale = (scaleSelect.value)|0
    renderer.canvas.width = renderer.shape[0] * scale
    renderer.canvas.height = renderer.shape[1] * scale
  })
  mapDiv.appendChild(scaleSelect)

  var scenarioButton = document.createElement('input')
  scenarioButton.type = 'button'
  scenarioButton.value = 'Run Benchmark'
  scenarioButton.style.display = 'inline'
  scenarioButton.disabled = true
  scenarioButton.style.margin = '5px'
  mapDiv.appendChild(scenarioButton)
  scenarioButton.addEventListener('click', function() {
    renderer.events.emit('benchmark')
  })

  var timeDiv = document.createElement('div')
  timeDiv.style.display = 'inline'
  timeDiv.style.margin = '5px'
  mapDiv.appendChild(timeDiv)

  renderer.logMessage = function(str) {
    timeDiv.innerHTML = str
  }

  document.body.appendChild(mapDiv)

  var canvasDiv = document.createElement('div')
  canvasDiv.style.position = 'absolute'
  canvasDiv.style.left = '5%'
  canvasDiv.style.bottom = '25px'
  canvasDiv.style.top = '100px'
  canvasDiv.style.width = '90%'

  canvasDiv.style.overflow = 'scroll'
  canvasDiv.appendChild(canvas)

  document.body.appendChild(canvasDiv)

  function disable() {
    mapSelect.disabled = true
    codeSelect.disabled = true
    scenarioButton.disabled = true
  }

  function enable() {
    mapSelect.disabled = false
    codeSelect.disabled = false
    if(renderer.scenario.length > 0) {
      scenarioButton.disabled = false
    }
  }

  renderer.enable = enable
  renderer.disable = disable

  renderer.benchButton = scenarioButton

  var data = ndarray(new Uint8Array(32*32), [32,32])

  var fileNames = Object.keys(files)

  for(var i=0; i<fileNames.length; ++i) {
    mapSelect.options.add(new Option(fileNames[i], fileNames[i]))
  }

  function mapChange() {
    var file = files[fileNames[mapSelect.selectedIndex]]
    disable()

    renderer.logMessage('loading map ' + fileNames[mapSelect.selectedIndex] + ', please wait')

    function handleError(err) {
      alert('Error loading map data')
      renderer.logMessage('error loading map')
      enable()
    }

    grabFile(file.map, function(err, mapData) {
      if(err) {
        handleError(err)
        return
      }

      var map = parse.map(mapData)

      if(!map) {
        handleError(err)
        return
      }

      if(file.scenario) {
        grabFile(file.scenario, function(err, scenData) {
          if(err || !(renderer.scenario = parse.scen(scenData))) {
            renderer.scenario = []
          }
          enable()
          boxes = toBoxes(map.transpose(1,0), true)
          renderer.grid = map
          renderer.shape = map.shape.slice()
          var scale = (scaleSelect.value)|0
          canvas.width = renderer.shape[0]*scale
          canvas.height = renderer.shape[1]*scale
          rebuildAlgorithms()
          renderer.events.emit('data-change')
        })
      } else {
        enable()
        boxes = toBoxes(map.transpose(1,0), true)
        renderer.grid = map
        renderer.shape = map.shape.slice()
        var scale = (scaleSelect.value)|0
        canvas.width = renderer.shape[0]*scale
        canvas.height = renderer.shape[1]*scale
        renderer.scenario = []
        rebuildAlgorithms()
        renderer.events.emit('data-change')
      }
    })
  }
  mapSelect.addEventListener('change', mapChange)

  renderer.grid = data

  renderer.events.on('render', function() {
    var ctx = renderer.context
    ctx.fillStyle = '#ccc'
    var r = renderer.tileDim()
    for(var i=0; i<boxes.length; ++i) {
      var b = boxes[i]
      ctx.fillRect(r*b[0][0], r*b[0][1], r*(b[1][0]-b[0][0]), r*(b[1][1]-b[0][1]))
    }
  })

  rebuildAlgorithms()

  mapSelect.value = 'dao/lak504d'
  mapChange()

  return renderer
}
