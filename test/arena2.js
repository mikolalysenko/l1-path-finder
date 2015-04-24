'use strict'

var tape = require('tape')
var path = require('path')
var fs = require('fs')
var parser = require('parse-grid-bench')
var checkPath = require('./check-path')

tape('Cauldron case', function(t) {

  var mapStr  = fs.readFileSync(path.join(__dirname, './data/arena2.map'), 'utf-8')
  var scenStr = fs.readFileSync(path.join(__dirname, './data/arena2.map.scen'), 'utf-8')

  var map = parser.map(mapStr)
  var scenario = parser.scen(scenStr)

  var queries = scenario.map(function(q) {
    return [[q.srcY, q.srcX], [q.dstY, q.dstX]]
  })

  queries = [[[104,10],[71,74]]]

  checkPath(t, map, queries)

  t.end()
})
