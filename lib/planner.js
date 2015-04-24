'use strict'

var bsearch = require('binary-search-bounds')
var rbush = require('rbush')
var createGeometry = require('./geometry')
var Graph = require('./graph')

var LEAF_CUTOFF = 48

module.exports = createPlanner

function Node(x, verts, left, right, leaf) {
  this.x      = x
  this.verts  = verts
  this.left   = left
  this.right  = right
  this.leaf   = leaf
}

function L1PathPlanner(geometry, graph, root) {
  this.geometry   = geometry
  this.graph      = graph
  this.root       = root
}

var proto = L1PathPlanner.prototype

function compareY(vert, y) {
  return vert.y - y
}

proto.search = function(tx, ty, sx, sy, out) {
  var geom = this.geometry

  //Degenerate case:  s and t are equal
  if(tx === sx && ty === sy) {
    if(!geom.stabBox(tx, ty, sx, sy)) {
      if(out) {
        out.push(sx, sy)
      }
      return 0
    }
    return Infinity
  }

  //Check easy case - s and t directly connected
  if(!geom.stabBox(tx, ty, sx, sy)) {
    if(out) {
      if(sx !== tx && sy !== ty) {
        out.push(tx, ty, sx, ty, sx, sy)
      } else {
        out.push(tx, ty, sx, sy)
      }
    }
    return Math.abs(tx-sx) + Math.abs(ty-sy)
  }

  //Prepare graph
  var graph = this.graph
  graph.setSourceAndTarget(sx, sy, tx, ty)

  //Mark target nodes
  var node = this.root
  while(node) {

    //Handle leaf case
    if(node.leaf) {
      var vv = node.verts
      var nn = vv.length
      for(var i=0; i<nn; ++i) {
        var v = vv[i]
        if(!geom.stabBox(v.x, v.y, tx, ty)) {
          graph.addT(v)
        }
      }
      break
    }

    var idx = bsearch.le(node.verts, ty, compareY)
    if(idx < 0) {
      var v = node.verts[0]
      if(!geom.stabBox(v.x, v.y, tx, ty)) {
        graph.addT(v)
      }
    } else {
      var v = node.verts[idx]
      if(!geom.stabBox(v.x, v.y, tx, ty)) {
        graph.addT(v)
      }
      if(v.y !== ty && idx < node.verts.length - 1) {
        var u = node.verts[idx+1]
        if(!geom.stabBox(u.x, u.y, tx, ty)) {
          graph.addT(u)
        }
      }
    }
    if(node.x > tx) {
      node = node.left
    } else if(node.x < tx) {
      node = node.right
    } else {
      break
    }
  }

  //Mark source nodes
  var node = this.root
  while(node) {

    //Handle leaf case
    if(node.rtree) {
      var vv = node.verts
      var nn = vv.length
      for(var i=0; i<nn; ++i) {
        var v = vv[i]
        if(!geom.stabBox(node.rtree, v.x, v.y, sx, sy)) {
          graph.addS(v)
        }
      }
      break
    }


    var idx = bsearch.le(node.verts, sy, compareY)
    if(idx < 0) {
      var v = node.verts[0]
      if(!geom.stabBox(v.x, v.y, sx, sy)) {
        graph.addS(v)
      }
    } else {
      var v = node.verts[idx]
      if(!geom.stabBox(v.x, v.y, sx, sy)) {
        graph.addS(v)
      }
      if(v.y !== sy && idx < node.verts.length - 1) {
        var u = node.verts[idx+1]
        if(!geom.stabBox(u.x, u.y, sx, sy)) {
          graph.addS(u)
        }
      }
    }
    if(node.x > sx) {
      node = node.left
    } else if(node.x < sx) {
      node = node.right
    } else {
      break
    }
  }

  //Run A*
  var dist = graph.search()

  //Recover path
  if(out && dist < Infinity) {
    graph.getPath(out)
  }

  return dist
}

function comparePair(a, b) {
  var d = a[1] - b[1]
  if(d) {
    return d
  }
  return a[0] - b[0]
}

function makePartition(x, corners, geom, edges) {
  var left  = []
  var right = []
  var on    = []

  //Intersect rays along x horizontal line
  for(var i=0; i<corners.length; ++i) {
    var c = corners[i]
    if(!geom.stabRay(c[0], c[1], x)) {
      on.push(c)
    }
    if(c[0] < x) {
      left.push(c)
    } else if(c[0] > x) {
      right.push(c)
    }
  }

  //Sort on events by y then x
  on.sort(comparePair)

  //Construct vertices and horizontal edges
  var verts = []
  for(var i=0; i<on.length; ) {
    var l = x
    var r = x
    var v = on[i]
    var y = v[1]
    while(i < on.length && on[i][1] === y && on[i][0] < x) {
      l = on[i++][0]
    }
    while(i < on.length && on[i][1] === y && on[i][0] === x) {
      ++i
    }
    if(i < on.length && on[i][1] === y) {
      r = on[i++][0]
      while(i < on.length && on[i][1] === y) {
        ++i
      }
    }
    verts.push([x, y])
    if(l < x) {
      edges.push([[x,y], [l, y]])
    }
    if(r > x) {
      edges.push([[x,y], [r, y]])
    }
  }

  //Construct vertical edges
  for(var i=0; i+1<verts.length; ++i) {
    var v0 = verts[i]
    var v1 = verts[i+1]
    if(geom.stabBox(v0[0], v0[1], v1[0], v1[1])) {
      continue
    }
    edges.push([v0, v1])
  }

  return {
    x: x,
    left: left,
    right: right,
    verts: verts
  }
}

function createPlanner(grid) {
  var geom = createGeometry(grid)
  var graph = new Graph()
  var verts = {}
  var edges = []

  function makeLeaf(corners, x0, x1) {
    var localVerts = []
    for(var i=0; i<corners.length; ++i) {
      var u = corners[i]
      var ux = graph.vertex(u[0], u[1])
      localVerts.push(ux)
      verts[u] = ux
      for(var j=0; j<i; ++j) {
        var v = corners[j]
        if(!geom.stabBox(u[0], u[1], v[0], v[1])) {
          edges.push([u,v])
        }
      }
    }
    return new Node(0, localVerts, null, null, true)
  }

  //Make tree
  function makeTree(corners, x0, x1) {
    if(corners.length === 0) {
      return null
    }

    if(corners.length < LEAF_CUTOFF) {
      return makeLeaf(corners, x0, x1)
    }

    var x = corners[corners.length>>>1][0]
    var partition = makePartition(x, corners, geom, edges)
    var left      = makeTree(partition.left, x0, x)
    var right     = makeTree(partition.right, x, x1)

    var nodeVerts = new Array(partition.verts.length)
    for(var i=0; i<partition.verts.length; ++i) {
      var v = partition.verts[i]
      nodeVerts[i] = verts[v] = graph.vertex(v[0], v[1])
    }
    return new Node(x, nodeVerts, left, right, false)
  }
  var root = makeTree(geom.corners, -Infinity, Infinity)

  //Link edges
  for(var i=0; i<edges.length; ++i) {
    graph.link(verts[edges[i][0]], verts[edges[i][1]])
  }

  //Find connected components
  graph.findComponents()

  console.log('V=', graph.verts.length, 'E=', edges.length)

  //Return resulting tree
  return new L1PathPlanner(geom, graph, root)
}
