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
  this.toVisit  = NIL
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
proto.addS = function(v) {
  var w = Math.abs(this.srcX - v.x) + Math.abs(this.srcY - v.y)
  v.distance = w
  v.weight = w + this.heuristic(v)
  v.state = ACTIVE
  v.pred = null
  this.toVisit = vtx.push(this.toVisit, v)
  this.freeList = vtx.insert(this.freeList, v)
}

//Mark vertex connected to target
proto.addT = function(v) {
  v.target = true
  this.freeList = vtx.insert(this.freeList, v)
}

//Retrieves the path from dst->src
proto.getPath = function(out) {
  out.push(this.dstX, this.dstY)
  var head = this.target.pred
  if(head.x === this.dstX && head.y === this.dstY) {
    head = head.pred
  }
  while(head) {
    out.push(head.x, head.y)
    head = head.pred
  }
  if(path[path.length-2] !== this.srcX && path[path.length-1] !== this.srcY) {
    out.push(this.srcX, this.srcY)
  }
  return out
}

//Runs a* on the graph
proto.search = function() {
  var target = this.target
  var freeList = this.freeList
  var sx = this.srcX
  var sy = this.srcY

  //Initialize target properties
  target.weight = target.distance = Infinity

  for(var toVisit=this.toVisit; toVisit!==NIL; ) {
    var node = toVisit
    node.state = CLOSED
    toVisit = vtx.pop(toVisit)

    if(node === target) {
      //Done
      break
    }

    //If node is connected to target, add in target distance
    if(node.target) {
      var w = node.weight
      if(target.state === OPEN) {
        target.state = ACTIVE
        target.distance = target.weight = w
        target.pred = node
        toVisit = vtx.decreaseKey(toVisit, target)
      } else if(w < target.weight) {
        target.weight = target.distance = w
        target.pred = node
        toVisit = vtx.decreaseKey(toVisit, target)
      }
    } else {
      var adj = node.edges
      var len = node.lengths
      var d = node.distance
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
          v.pred = node
          toVisit = vtx.push(toVisit, v)
          freeList = vtx.insert(freeList, v)
        } else if(w < v.weight) {
          v.weight = w
          v.distance = dd
          v.pred = node
          toVisit = vtx.decreaseKey(toVisit, v)
        }
      }
    }
  }

  //Clear the free list & priority queue
  vtx.clear(freeList)

  //Reset pointers
  this.freeList = target
  this.toVisit = NIL

  //Return target distance
  return target.distance
}
