'use strict'

module.exports = Graph

var vtx = require('./vertex')
var NIL = vtx.NIL

var OPEN    = 0
var ACTIVE  = 1
var CLOSED  = 2

function Graph() {
  this.target   = vtx.create(0,0)
  this.verts    = []
  this.freeList = this.target
  this.toVisit  = vtx.NIL
  this.srcX     = 0
  this.srcY     = 0
  this.dstX     = 0
  this.dstY     = 0
}

var proto = Graph.prototype

proto.vertex = function(x, y) {
  var v = vtx.create(x, y)
  this.verts.push(v)
  return v
}

proto.link = function(u, v) {
  vtx.link(u, v)
}

proto.setSourceAndTarget = function(sx, sy, tx, ty) {
  this.srcX = sx
  this.srcY = sy
  this.dstX = tx
  this.dstY = ty
}

proto.heuristic = function(v) {
  return Math.abs(v.x-this.dstX) + Math.abs(v.y-this.dstY)
}

//Mark vertex connected to source
proto.addS = function(v, w) {
  v.distance = w
  v.weight = w + this.heuristic(v.x, v.y)
  v.state = ACTIVE
  v.pred = null
  this.toVisit = vtx.push(this.toVisit, v)
  this.freeList = vtx.insert(this.freeList, v)
}

//Mark vertex connected to target
proto.addT = function(v, w) {
  v.target = true
  this.freeList = vtx.insert(this.freeList, v)
}

proto.search = function() {
  var target = this.target
  var freeList = this.freeList
  var sx = this.srcX
  var sy = this.srcY

  //Initialize target properties
  target.weight = target.distance = Infinity

  for(var toVisit=this.toVisit; toVisit!==NIL; toVisit=vtx.pop(toVisit)) {
    var node = toVisit
    node.state = CLOSED
    toVisit = vtx.pop(toVisit)

    if(node === target) {
      //Done
      break
    }

    var d = node.distance

    //If node is connected to target, add in target distance
    if(node.target) {
      var w = node.weight
      if(target.state === OPEN) {
        target.state = active
        target.distance = target.weight = w
        target.pred = node
        toVisit = vtx.decreaseKey(toVisit, target)
      } else if(w < target.weight) {
        target.weight = target.distance = w
        target.pred = node
        toVisit = vtx.decreaseKey(toVisit, target)
      }
    }

    var adj = node.edges
    var len = node.lengths

    var n = adj.length
    for(var i=0; i<n; ++i) {
      var v = adj[i]
      if(v.state === CLOSED) {
        continue
      }
      var dd = len[i] + d
      var w = dd + this.heuristic(v)
      if(v.state === OPEN) {
        v.state = ACTIVE
        v.weight = w
        v.distance = dd
        v.pred = n
        toVisit = vtx.push(toVisit, v)
        freeList = vtx.insert(freeList, v)
      } else if(w < v.weight) {
        v.weight = w
        v.distance = dd
        v.pred = n
        toVisit = vtx.decreaseKey(toVisit, v)
      }
    }
  }

  //Clear the free list
  vtx.clear(freeList)
  this.freeList = target
}
