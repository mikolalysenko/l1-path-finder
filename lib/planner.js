'use strict'

var bsearch = require('binary-search-bounds')
var rbush = require('rbush')
var createGeometry = require('./geometry')
var Graph = require('./graph')

var LEAF_CUTOFF = 0
var BUCKET_SIZE = 16

module.exports = createPlanner

function Node(x, verts, left, right, rtree) {
  this.x      = x
  this.verts  = verts
  this.left   = left
  this.right  = right
  this.rtree  = rtree
}

function L1PathPlanner(geometry, graph, root) {
  this.geometry   = geometry
  this.graph      = graph
  this.root       = root
}

var proto = L1PathPlanner.prototype

var BOX = [0,0,0,0]
function stabBoxNode(rtree, ax, ay, bx, by) {
  BOX[0] = Math.min(ax, bx)+0.5
  BOX[1] = Math.min(ay, by)+0.5
  BOX[2] = Math.max(ax, bx)+0.5
  BOX[3] = Math.max(ay, by)+0.5
  return rtree.collides(BOX)
}


function compareY(vert, y) {
  return vert.y - y
}

proto.search = function(sx, sy, tx, ty, out) {

  return Infinity

  var geom = this.geometry

  //Check easy case - s and t directly connected
  if(!geom.stabBox(tx, ty, sx, sy)) {
    if(out) {
      out.push(tx, ty, sx, sy)
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
    if(node.rtree) {
      var vv = node.verts
      var nn = vv.length
      for(var i=0; i<nn; ++i) {
        var v = vv[i]
        if(!stabBoxNode(node.rtree, v.x, v.y, tx, ty)) {
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
        if(!stabBoxNode(node.rtree, v.x, v.y, sx, sy)) {
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

  console.log('on=', on.join(':'))

  //Construct vertices and horizontal edges
  var vis = []
  var rem = []
  for(var i=0; i<on.length; ) {
    var l = x
    var r = x
    var v = on[i]
    var y = v[1]
    while(i < on.length && on[i][1] === y && on[i][0] < x) {
      l = on[i++][0]
    }
    if(l < x) {
      vis.push([l,y])
    }
    while(i < on.length && on[i][1] === y && on[i][0] === x) {
      rem.push(on[i])
      vis.push(on[i])
      ++i
    }
    if(i < on.length && on[i][1] === y) {
      r = on[i++][0]
      while(i < on.length && on[i][1] === y) {
        ++i
      }
    }
    if(r > x) {
      vis.push([r,l])
    }
  }

  console.log('vis=', vis.join(':'))

  return {
    x: x,
    left:    left,
    right:   right,
    on:      rem,
    vis:     vis
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

    var boxes = geom.rtree.search([x0, -Infinity, x1+1, Infinity])
    var rtree = rbush(9)
    rtree.load(boxes)

    return new Node(0, localVerts, null, null, rtree)
  }

  function makeBucket(corners, x) {
    //Split visible corners into 3 cases
    var left  = []
    var right = []
    var on    = []
    for(var i=0; i<corners.length; ++i) {
      if(corners[i][0] < x) {
        left.push(corners[i])
      } else if(corners[i][0] > x) {
        right.push(corners[i])
      } else {
        on.push(corners[i])
      }
    }

    //Add Steiner vertices if needed
    function addSteiner(y) {
      if(!geom.stabTile(x,y)) {
        if(on.length > 0 &&
          (on[0][1] === y || on[on.length-1][1] === y)) {
          return
        }
        var pair = [x,y]
        on.push(pair)
        console.log('steiner vertex:', pair)
        if(!verts[pair]) {
          verts[pair] = graph.vertex(x,y)
        }
      }
    }

    addSteiner(corners[0][1])
    addSteiner(corners[corners.length-1][1])


    function bipartite(a, b) {
      for(var i=0; i<a.length; ++i) {
        var u = a[i]
        for(var j=0; j<b.length; ++j) {
          var v = b[j]
          if(!geom.stabBox(u[0], u[1], v[0], v[1])) {
            edges.push([u,v])
          }
        }
      }
    }

    bipartite(left, right)
    bipartite(on, left)
    bipartite(on, right)

    //Connect vertical edges
    for(var i=1; i<on.length; ++i) {
      var u = on[i-1]
      var v = on[i]
      if(!geom.stabBox(u[0], u[1], v[0], v[1])) {
        edges.push([u,v])
      }
    }
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

    //Construct vertices
    for(var i=0; i<partition.on.length; ++i) {
      verts[partition.on[i]] = graph.vertex(partition.on[i][0], partition.on[i][1])
    }

    //Build buckets
    var vis = partition.vis
    for(var i=0; i<vis.length; ) {
      var v0 = i
      var v1 = Math.min(i+BUCKET_SIZE, vis.length)
      while(v1+1 < vis.length && vis[v1][1] === vis[v1+1][1]) {
        v1 += 1
      }
      if(v1 - v0 > 1) {
        makeBucket(vis.slice(v0, v1), x)
      }
      i = v1+1
    }

    return null
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
