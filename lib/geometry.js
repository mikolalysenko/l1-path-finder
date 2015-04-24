'use strict'

var ndarray     = require('ndarray')
var ops         = require('ndarray-ops')
var prefixSum   = require('ndarray-prefix-sum')
var getContour  = require('contour-2d')
var orient      = require('robust-orientation')[3]

module.exports = createGeometry

function Geometry(corners, grid) {
  this.corners = corners
  this.grid    = grid
}

var proto = Geometry.prototype

proto.stabRay = function(vx, vy, x) {
  return this.stabBox(vx, vy, x, vy)
}

proto.stabTile = function(x, y) {
  return this.stabBox(x, y, x, y)
}

proto.integrate = function(x, y) {
  if(x < 0 || y < 0) {
    return 0
  }
  return this.grid.get(
    Math.min(x, this.grid.shape[0]-1)|0,
    Math.min(y, this.grid.shape[1]-1)|0)
}

proto.stabBox = function(ax, ay, bx, by) {
  var lox = Math.min(ax, bx)
  var loy = Math.min(ay, by)
  var hix = Math.max(ax, bx)
  var hiy = Math.max(ay, by)

  var s = this.integrate(lox-1,loy-1)
        - this.integrate(lox-1,hiy)
        - this.integrate(hix,loy-1)
        + this.integrate(hix,hiy)

  return s > 0
}

function comparePair(a, b) {
  var d = a[0] - b[0]
  if(d) { return d }
  return a[1] - b[1]
}

function createGeometry(grid) {
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

  //Create integral image
  var img = ndarray(new Int32Array(grid.shape[0]*grid.shape[1]), grid.shape)
  ops.gts(img, grid, 0)
  prefixSum(img)

  //Return resulting geometry
  return new Geometry(corners, img)
}
