'use strict'

module.exports = Graph

var vtx = require('./vertex')
var NIL = vtx.NIL
var NUM_LANDMARKS = vtx.NUM_LANDMARKS
var LANDMARK_DIST = vtx.LANDMARK_DIST

function heuristic(tdist, tx, ty, node) {
  var nx = +node.x
  var ny = +node.y
  var pi = Math.abs(nx-tx) + Math.abs(ny-ty)
  var ndist = node.landmark
  for(var i=0; i<NUM_LANDMARKS; ++i) {
    pi = Math.max(pi, tdist[i]-ndist[i])
  }
  return 1.0000009536743164 * pi
}

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
  this.landmarks = []
  this.landmarkDist = LANDMARK_DIST.slice()
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

//Mark vertex connected to source
proto.addS = function(v) {
  if((v.state & 2) === 0) {
    v.heuristic   = heuristic(this.landmarkDist, this.dstX, this.dstY, v)
    v.weight      = Math.abs(this.srcX - v.x) + Math.abs(this.srcY - v.y) + v.heuristic
    v.state       |= 2
    v.pred        = null
    this.toVisit  = vtx.push(this.toVisit, v)
    this.freeList = vtx.insert(this.freeList, v)
    this.lastS    = v
  }
}

//Mark vertex connected to target
proto.addT = function(v) {
  if((v.state & 1) === 0) {
    v.state       |= 1
    this.freeList = vtx.insert(this.freeList, v)
    this.lastT    = v

    //Update heuristic
    var d = Math.abs(v.x-this.dstX) + Math.abs(v.y-this.dstY)
    var vdist = v.landmark
    var tdist = this.landmarkDist
    for(var i=0; i<NUM_LANDMARKS; ++i) {
      tdist[i] = Math.min(tdist[i], vdist[i]+d)
    }
  }
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
  var verts = this.verts
  var n = verts.length
  for(var i=0; i<n; ++i) {
    verts[i].component = -1
  }
  var components = []
  for(var i=0; i<n; ++i) {
    var root = verts[i]
    if(root.component >= 0) {
      continue
    }
    var label = components.length
    root.component = label
    var toVisit = [root]
    var ptr = 0
    while(ptr < toVisit.length) {
      var v = toVisit[ptr++]
      var adj = v.edges
      for(var j=0; j<adj.length; ++j) {
        var u = adj[j]
        if(u.component >= 0) {
          continue
        }
        u.component = label
        toVisit.push(u)
      }
    }
    components.push(toVisit)
  }
  return components
}

//Find all landmarks
function compareVert(a, b) {
  var d = a.x - b.x
  if(d) { return d }
  return a.y - b.y
}

//For each connected component compute a set of landmarks
proto.findLandmarks = function(component) {
  component.sort(compareVert)
  var v = component[component.length>>>1]
  for(var k=0; k<NUM_LANDMARKS; ++k) {
    v.weight = 0.0
    this.landmarks.push(v)
    for(var toVisit = v; toVisit !== NIL; ) {
      v = toVisit
      v.state = 2
      toVisit = vtx.pop(toVisit)
      var w = v.weight
      var adj = v.edges
      for(var i=0; i<adj.length; ++i) {
        var u = adj[i]
        if(u.state === 2) {
          continue
        }
        var d = w + Math.abs(v.x-u.x) + Math.abs(v.y-u.y)
        if(u.state === 0) {
          u.state = 1
          u.weight = d
          toVisit = vtx.push(toVisit, u)
        } else if(d < u.weight) {
          u.weight = d
          toVisit = vtx.decreaseKey(toVisit, u)
        }
      }
    }
    var farthestD = 0
    for(var i=0; i<component.length; ++i) {
      var u = component[i]
      u.state = 0
      u.landmark[k] = u.weight
      var s = Infinity
      for(var j=0; j<=k; ++j) {
        s = Math.min(s, u.landmark[j])
      }
      if(s > farthestD) {
        v = u
        farthestD = s
      }
    }
  }
}

proto.init = function() {
  var components = this.findComponents()
  for(var i=0; i<components.length; ++i) {
    this.findLandmarks(components[i])
  }
}

//Runs a* on the graph
proto.search = function() {
  var target   = this.target
  var freeList = this.freeList
  var tdist    = this.landmarkDist

  //Initialize target properties
  var dist = Infinity

  //Test for case where S and T are disconnected
  if( this.lastS && this.lastT &&
      this.lastS.component === this.lastT.component ) {

    var sx = +this.srcX
    var sy = +this.srcY
    var tx = +this.dstX
    var ty = +this.dstY

    for(var toVisit=this.toVisit; toVisit!==NIL; ) {
      var node = toVisit
      var nx   = +node.x
      var ny   = +node.y
      var d    = Math.floor(node.weight - node.heuristic)

      if(node.state === 3) {
        //If node is connected to target, exit
        dist = d + Math.abs(tx-nx) + Math.abs(ty-ny)
        target.pred = node
        break
      }

      //Mark node closed
      node.state = 4

      //Pop node from toVisit queue
      toVisit = vtx.pop(toVisit)

      var adj = node.edges
      var n   = adj.length
      for(var i=0; i<n; ++i) {
        var v = adj[i]
        var state = v.state
        if(state === 4) {
          continue
        }
        var vd = d + Math.abs(nx-v.x) + Math.abs(ny-v.y)
        if(state < 2) {
          var vh      = heuristic(tdist, tx, ty, v)
          v.state    |= 2
          v.heuristic = vh
          v.weight    = vh + vd
          v.pred      = node
          toVisit     = vtx.push(toVisit, v)
          freeList    = vtx.insert(freeList, v)
        } else {
          var vw = vd + v.heuristic
          if(vw < v.weight) {
            v.weight   = vw
            v.pred     = node
            toVisit    = vtx.decreaseKey(toVisit, v)
          }
        }
      }
    }
  }

  //Clear the free list & priority queue
  vtx.clear(freeList)

  //Reset pointers
  this.freeList = target
  this.toVisit = NIL
  this.lastS = this.lastT = null

  //Reset landmark distance
  for(var i=0; i<NUM_LANDMARKS; ++i) {
    tdist[i] = Infinity
  }

  //Return target distance
  return dist
}
