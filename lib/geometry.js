'use strict'

var getContour  = require('contour-2d')
var getBoxes    = require('bitmap-to-boxes')
var orient      = require('robust-orientation')[3]
var rbush       = require('rbush')

module.exports = createGeometry

function Geometry(corners, boxes, rtree) {
  this.corners = corners
  this.boxes = boxes
  this.rtree = rtree
}

var proto = Geometry.prototype

proto.stab = function(ax, ay, bx, by) {
  var lox = Math.min(ax, bx)
  var loy = Math.min(ay, by)
  var hix = Math.max(ax, bx)
  var hiy = Math.max(ay, by)
  return this.rtree.search([lox+0.5, loy+0.5, hix+0.5, hiy+0.5]).length > 0
}

function comparePair(a, b) {
  var d = a[0] - b[0]
  if(d) { return d }
  return a[1] - b[1]
}

function convertBox(b) {
  return [b[0][0],b[0][1],b[1][0],b[1][1]]
}

function createGeometry(grid) {
  var boxes = getBoxes(grid.transpose(1,0), true).map(convertBox)
  var loops = getContour(grid.transpose(1,0))

  //Extract corners
  var corners = []
  for(var k=0; k<loops.length; ++k) {
    var polygon = loops[k]
    for(var i=0; i<polygon.length; ++i) {
      var a = polygon[(i+polygon.length-1)%polygon.length]
      var b = polygon[i]
      var c = polygon[(i+1)%polygon.length]
      if(orient(a, b, c) > 0) {
        var offset = [0,0]
        for(var j=0; j<2; ++j) {
          if(b[j] - a[j]) {
            offset[j] = b[j] - a[j]
          } else {
            offset[j] = b[j] - c[j]
          }
          offset[j] = b[j]+Math.min(Math.round(offset[j]/Math.abs(offset[j]))|0, 0)
        }
        if(offset[0] >= 0 && offset[0] < grid.shape[0] &&
           offset[1] >= 0 && offset[1] < grid.shape[1] &&
           grid.get(offset[0], offset[1]) === 0) {
          corners.push(offset)
        }
      }
    }
  }

  //Remove duplicate corners
  corners.sort(comparePair)
  var ptr = 0
  for(var i=0; i<corners.length; ++i) {
    corners[ptr++] = corners[i]
    if(i+1 < corners.length) {
      if(comparePair(corners[i], corners[i+1]) === 0) {
        i += 1
        continue
      }
    }
  }
  corners.length = ptr

  //Create rtree
  var rtree = rbush(9)
  rtree.load(boxes)

  //Return resulting geometry
  return new Geometry(corners, boxes, rtree)
}
