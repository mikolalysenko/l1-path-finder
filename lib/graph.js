'use strict'

module.exports = Graph

var UnionFind = require('union-find')
var vtx = require('./vertex')
var NIL = vtx.NIL

function Graph() {
  this.target   = vtx.create(0,0)
  this.verts    = []
  this.freeList = this.target
  this.toVisit  = NIL
  this.lastS    = null
  this.lastT    = null
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
  this.srcX = sx|0
  this.srcY = sy|0
  this.dstX = tx|0
  this.dstY = ty|0
}

proto.heuristic = function(v) {
  return 1.0000009536743164 * (Math.abs(v.x-this.dstX) + Math.abs(v.y-this.dstY))
}

//Mark vertex connected to source
proto.addS = function(v) {
  if((v.state & 2) === 0) {
    v.weight      = Math.abs(this.srcX - v.x) + Math.abs(this.srcY - v.y) + this.heuristic(v)
    v.state       |= 2
    v.pred        = null
    this.toVisit  = vtx.push(this.toVisit, v)
    this.freeList = vtx.insert(this.freeList, v)
    this.lastS    = v
  }
}

//Mark vertex connected to target
proto.addT = function(v) {
  v.state       |= 1
  this.freeList = vtx.insert(this.freeList, v)
  this.lastT    = v
}

//Retrieves the path from dst->src
proto.getPath = function(out) {
  var prevX = this.dstX
  var prevY = this.dstY
  out.push(prevX, prevY)
  var head = this.target.pred
  while(head) {
    if(prevX !== head.x && prevY !== head.y) {
      out.push(head.x, prevY)
    }
    if(prevX !== head.x || prevY !== head.y) {
      out.push(head.x, head.y)
    }
    prevX = head.x
    prevY = head.y
    head = head.pred
  }
  if(prevX !== this.srcX && prevY !== this.srcY) {
    out.push(this.srcX, prevY)
  }
  if(prevX !== this.srcX || prevY !== this.srcY) {
    out.push(this.srcX, this.srcY)
  }
  return out
}

proto.findComponents = function() {
  var n = this.verts.length
  var ds = new UnionFind(n)
  for(var i=0; i<n; ++i) {
    var v = this.verts[i]
    v.component = i
  }
  for(var i=0; i<n; ++i) {
    var v = this.verts[i]
    var adj = v.edges
    for(var j=0; j<adj.length; ++j) {
      ds.link(i, adj[j].component)
    }
  }
  for(var i=0; i<n; ++i) {
    var v = this.verts[i]
    v.component = ds.find(i)
  }
}

//Runs a* on the graph
proto.search = function() {
  var target   = this.target
  var freeList = this.freeList
  var sx = +this.srcX
  var sy = +this.srcY
  var tx = +this.dstX
  var ty = +this.dstY

  //Initialize target properties
  var dist = Infinity

  //Test for case where S and T are disconnected
  if( this.lastS && this.lastT &&
      this.lastS.component === this.lastT.component )
  for(var toVisit=this.toVisit; toVisit!==NIL; ) {
    var node = toVisit
    if(node.state === 3) {
      //If node is connected to target, exit
      dist = Math.floor(node.weight)
      target.pred = node
      break
    }

    var nx = +node.x
    var ny = +node.y
    node.state = 4

    //Pop node from toVisit queue
    toVisit = vtx.pop(toVisit)

    var d   = node.weight - 1.0000009536743164 * (Math.abs(nx-tx) + Math.abs(ny-ty))
    var adj = node.edges
    var n   = adj.length
    for(var i=0; i<n; ++i) {
      var v = adj[i]
      var state = v.state
      if(state === 4) {
        continue
      }
      var vx = +v.x
      var vy = +v.y
      var w = d + Math.abs(nx-vx) + Math.abs(ny-vy) + 1.0000009536743164 * (Math.abs(vx-tx) + Math.abs(vy-ty))
      if(state < 2) {
        v.state    |= 2
        v.weight   = w
        v.pred     = node
        toVisit    = vtx.push(toVisit, v)
        freeList   = vtx.insert(freeList, v)
      } else if(w < v.weight) {
        v.weight   = w
        v.pred     = node
        toVisit    = vtx.decreaseKey(toVisit, v)
      }
    }
  }

  //Clear the free list & priority queue
  vtx.clear(freeList)

  //Reset pointers
  this.freeList = target
  this.toVisit = NIL
  this.lastS = this.lastT = null

  //Return target distance
  return dist
}
