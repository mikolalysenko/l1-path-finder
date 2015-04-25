'use strict'

var EasyStar = require('easystarjs')
var unpack = require('ndarray-unpack')

module.exports = preprocess

function preprocess(grid) {
  var array = unpack(grid)
  var easystar = new EasyStar.js()
  easystar.setGrid(array)
  easystar.setAcceptableTiles([0])

  function search(sy,sx,ty,tx,cb,n) {
    var hasFinished = false
    easystar.findPath(sx,sy,tx,ty, function(path) {
      if(hasFinished) {
        return
      }
      hasFinished = true
      setTimeout(function() {
        if(path) {
          cb(path.length)
        } else {
          cb(0)
        }
      }, 0)
    })
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
