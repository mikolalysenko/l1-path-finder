'use strict'

var now = require('right-now')
var imshow = require('ndarray-imshow')
var parse = require('parse-grid-bench')
var nets = require('nets')
var codes = require('./codes')
var meta = require('../viz/meta.json')


var defaultCase = 'sc1/Cauldron'

var WARMUP_COUNT = 0
var REPEAT_COUNT = 1

function getURL(url) {
  return 'https://mikolalysenko.github.io/sturtevant-grid-benchmark/' + url.slice(1)
}

function loadCase(c, cb) {
  var error = false
  var count = 0
  var mapData = null
  var scenData = null
  nets({
    url: getURL(c.map),
    encoding: 'utf-8'
  }, function(err, resp, body) {
    if(error) {
      return
    }
    if(err) {
      error = true
      cb(err)
      return
    }
    mapData = parse.map(body)
    if(mapData) {
      ++count
    } else {
      error = true
      cb(new Error('error parsing map'))
      return
    }
    if(count === 2) {
      cb(null, mapData, scenData)
    }
  })
  nets({
    url: getURL(c.scenario),
    encoding: 'utf-8'
  }, function(err, resp, body) {
    if(error) {
      return
    }
    if(err) {
      error = true
      cb(err)
      return
    }
    scenData = parse.scen(body)
    if(scenData) {
      ++count
    } else {
      error = true
      cb(new Error('error parsing scenario'))
      return
    }
    if(count === 2) {
      cb(null, mapData, scenData)
    }
  })
}

function benchmarkAlgorithm(name, preprocess, map, scenarios) {
  var search = preprocess(map)
  console.log('testing: ', name)
  var totalTime = 0
  var sum = 0
  console.profile('l1-search')

  for(var i=0; i<scenarios.length; ++i) {
    var sx = scenarios[i].srcX
    var sy = scenarios[i].srcY
    var tx = scenarios[i].dstX
    var ty = scenarios[i].dstY

    //Warm up
    for(var j=0; j<WARMUP_COUNT; ++j) {
      sum += search(sx, sy, tx, ty)
    }

    var start = now()
    for(var j=0; j<REPEAT_COUNT; ++j) {
      sum += search(sx, sy, tx, ty)
    }
    var end = now()

    var time = (end - start) / REPEAT_COUNT
    totalTime += time
  }
  console.profileEnd('l1-search')

  console.log('\taverage:', name, ' - ', totalTime, 'ms total sum = ', sum)
}


function processCase(caseName, cb) {
  var data = meta[caseName]
  if(!data) {
    cb(new Error('invalid case name'))
    return
  }
  loadCase(data, function(err, mapData, scenData) {
    if(err) {
      cb(err)
      return
    }
    Object.keys(codes).forEach(function(name) {
        benchmarkAlgorithm(name, codes[name], mapData, scenData)
    })
    cb(null)
  })
}

processCase(defaultCase, function(err) {
  console.log(err)
})
