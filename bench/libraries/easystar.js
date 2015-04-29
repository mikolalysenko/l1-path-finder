'use strict'

var EasyStar = require('easystarjs')
var unpack = require('ndarray-unpack')

module.exports = preprocess

function preprocess(grid) {
  var array = unpack(grid)
  var easystar = new EasyStar.js()
  easystar.setGrid(array)
  easystar.setAcceptableTiles([0])
  easystar.setIterationsPerCalculation(Infinity)


  var ACTIVE = 10
  var PENDING = []

  function search(sx,sy,tx,ty,cb,n) {
    var hasFinished = false
    if(sx === tx && sy === ty) {
      setTimeout(function() {
        cb(0)
      })
    } else {
      if(ACTIVE <= 0) {
        PENDING.push([sx,sy,tx,ty,cb,n])
      } else {
        ACTIVE -= 1
        setTimeout(function() {
          easystar.findPath(sx,sy,tx,ty, function(path) {
            if(PENDING.length > 0) {
              var top = PENDING.pop()
              search(top[0], top[1], top[2], top[3], top[4], top[5])
            }
            ACTIVE += 1
            if(path) {
              cb(path.length)
            } else {
              cb(0)
            }
          })
          easystar.calculate()
        })
      }
    }
  }

  var calcInterval = setInterval(function() {
    easystar.calculate()
  }, 0)

  search.clear = function() {
    clearInterval(calcInterval)
  }

  search.async = true

  return search
}
