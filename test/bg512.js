'use strict'

var tape = require('tape')
var path = require('path')
var fs = require('fs')
var parser = require('parse-grid-bench')
var checkPath = require('./check-path')

tape('bg512 case', function(t) {

  var mapStr  = fs.readFileSync(path.join(__dirname, './data/AR0011SR.map'), 'utf-8')
  var scenStr = fs.readFileSync(path.join(__dirname, './data/AR0011SR.map.scen'), 'utf-8')

  var map = parser.map(mapStr)
  var scenario = parser.scen(scenStr)

  var queries = scenario.map(function(q) {
    return [[q.srcX, q.srcY], [q.dstX, q.dstY]]
  })


  //queries = [[[170,122],[95,97]]]

  checkPath(t, map, queries)

  t.end()
})
