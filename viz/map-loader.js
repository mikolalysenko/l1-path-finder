'use strict'

var parse = require('parse-grid-bench')
var ndarray = require('ndarray')
var nets = require('nets')
var createRenderer = require('./render')
var files = require('./meta.json')

module.exports = createMapLoader

function grabFile(url, cb) {
  var burl = 'https://mikolalysenko.github.io/sturtevant-grid-benchmark/' + url.slice(1)
  nets({ url: burl, encoding: 'utf-8' }, function(err, resp, body) {
    cb(err, body)
  })
}

function createMapLoader() {

  var mapDiv = document.createElement('p')
  var mapSelect = document.createElement('select')
  mapDiv.appendChild(mapSelect)
  document.body.appendChild(mapDiv)

  var canvas = document.createElement('canvas')
  canvas.width = 1024
  canvas.height = 1024
  document.body.appendChild(canvas)


  var renderer = createRenderer([32,32], canvas)
  var data = ndarray(new Uint8Array(32*32), [32,32])

  var fileNames = Object.keys(files)

  for(var i=0; i<fileNames.length; ++i) {
    mapSelect.options.add(new Option(fileNames[i], fileNames[i]))
  }


  mapSelect.addEventListener('change', function() {
    var file = files[fileNames[mapSelect.selectedIndex]]
    mapSelect.disabled = true

    function handleError(err) {
      alert('Error loading map data')
      mapSelect.disabled = false
    }

    grabFile(file.map, function(err, mapData) {
      if(err) {
        handleError(err)
        return
      }
      mapSelect.disabled = false

      var map = parse.map(mapData)

      if(!map) {
        mapSelect.disabled = false
        alert('Bad map data')
        return
      }

      renderer.grid = map
      renderer.shape = map.shape.slice()
      renderer.events.emit('data-change')
    })
  })

  renderer.grid = data

  renderer.events.on('render', function() {
    var data = renderer.grid
    for(var i=0; i<data.shape[0]; ++i) {
      for(var j=0; j<data.shape[1]; ++j) {
        if(data.get(i,j)) {
          renderer.tile(i, j, '#fff')
        }
      }
    }
  })

  return renderer
}
