//Hacky experiment with Ken Clarkson-style L1 shortest path finding
// This sketch just visualizes the graph/data structures which are built by the algorithm.
//  The green node is the source node and the red is the sink
//  Magenta nodes/edges are nodes in the graph which is searched
//  The total number of magenta nodes/edges is at most O(n log(n)), n = number of corners
//  Worst case time to search the graph using A* is O(n log^2(n)), but in practice it might
//  be way faster.
//
// Reference:
//  "Rectilinear shortest paths through polygonal obstacles". K.L. Clarkson, S. Kapoor, P.M. Vaidya.
//  http://netlib.lucent.com/who/clarkson/l1mp/p.ps.gz
//
//Interactions:
// Left click to modify the grid
// Right click to set the source/sink node
//
var mouseChange = require('mouse-change')
var ndarray     = require('ndarray')
var getContour  = require('contour-2d')
var orient      = require('robust-orientation')[3]
var uniq        = require('uniq')
var makeBoxes   = require('bitmap-to-boxes')
var rbush       = require('rbush')
var bsearch     = require('binary-search-bounds')

var GRID_SHAPE = [32,32]

var canvas = document.createElement('canvas')
canvas.width = canvas.height = 512
document.body.appendChild(canvas)

var context = canvas.getContext('2d')

var grid = ndarray(new Uint32Array(GRID_SHAPE[0]*GRID_SHAPE[1]), GRID_SHAPE)

canvas.addEventListener('contextmenu', function(ev) {
  ev.preventDefault()
})

var lastButton = 0
  , fillValue = 0
  , root = [0,0]
  , sink = [GRID_SHAPE[0]-1, GRID_SHAPE[1]-1]
  , lastRightClick = 0
mouseChange(canvas, function(button, x, y) {
  if(button) {
    var width = canvas.width
    var height = canvas.height
    var tileX = Math.floor(width/GRID_SHAPE[0])
    var tileY = Math.floor(height/GRID_SHAPE[1])
    var i = Math.floor(x / tileX)
    var j = Math.floor(y / tileY)

    if(i >= 0 && i < GRID_SHAPE[0] &&
       j >= 0 && j < GRID_SHAPE[1]) {
      if(!(lastButton&1)) {
        fillValue = !grid.get(i,j)
      }

      if(button & 1) {
        grid.set(i,j, fillValue)
      }

      if(button & 2) {
        if(lastRightClick === 0) {
          root[0] = i
          root[1] = j
        } else {
          sink[0] = i
          sink[1] = j
        }
        lastRightClick ^= 1
      }
    }
  }

  lastButton = button
})



function render() {
  requestAnimationFrame(render)

  var width = canvas.width
  var height = canvas.height
  var tileX = Math.floor(width/GRID_SHAPE[0])
  var tileY = Math.floor(height/GRID_SHAPE[1])

  function drawTile(x, y) {
    context.fillRect(x*tileX, y*tileY, tileX, tileY)
  }

  context.fillStyle = '#000'
  context.fillRect(0, 0, width, height)

  for(var i=0; i<GRID_SHAPE[0]; ++i) {
    for(var j=0; j<GRID_SHAPE[1]; ++j) {
      var cell = grid.get(i,j)
      if(cell === 1) {
        context.fillStyle = '#fff'
        drawTile(i,j)
      }
    }
  }

  function drawVertex(v) {
    context.beginPath()
    context.arc(v[0]*tileX, v[1]*tileY, 0.25*Math.min(tileX,tileY), 0, 2.0*Math.PI)
    context.fill()
  }

  function drawLine(a, b) {
    context.beginPath()
    context.moveTo(a[0]*tileX, a[1]*tileY)
    context.lineTo(b[0]*tileX, b[1]*tileY)
    context.stroke()
  }

  function drawBox(box) {
    drawLine([box[0], box[1]], [box[2], box[1]])
    drawLine([box[0], box[3]], [box[2], box[3]])
    drawLine([box[0], box[1]], [box[0], box[3]])
    drawLine([box[2], box[1]], [box[2], box[3]])
  }

  var boxes = makeBoxes(grid.transpose(1,0), true).map(function(b) { return [b[0][0],b[0][1],b[1][0],b[1][1]] })
  context.strokeStyle = 'rgb(0,128,128)'
  boxes.forEach(drawBox)

  var loops = getContour(grid.transpose(1,0))
  var corners = []
  var segments = []
  context.strokeStyle = '#00f'
  loops.forEach(function(polygon) {
    for(var i=0; i<polygon.length; ++i) {
      var a = polygon[(i+polygon.length-1)%polygon.length]
      var b = polygon[i]
      var c = polygon[(i+1)%polygon.length]

      drawLine(a, b)
      segments.push([a,b])

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
        corners.push([b, offset])
      }
    }
  })

  //Remove duplicate corner pairs
  function comparePair(a, b) {
    var d = a[0] - b[0]
    if(d) { return d }
    return a[1] - b[1]
  }
  function comparePoint(p,q) {
    return comparePair(p[0], q[0])
  }
  corners.sort(comparePoint)
  var ptr = 0
  for(var i=0; i<corners.length; ++i) {
    if(i+1 < corners.length) {
      if(comparePoint(corners[i], corners[i+1]) === 0) {
        i += 1
        continue
      }
    }
    corners[ptr++] = corners[i]
  }
  corners.length = ptr

  //Extract tiles
  var cornerVerts = corners.map(function(c) { return c[0] })
  var cornerTiles = uniq(corners.map(function(c) { return c[1] }), comparePair, false)

  context.fillStyle = 'rgba(128, 128, 0, 0.5)'
  cornerTiles.forEach(function(tile) {
    drawTile(tile[0], tile[1])
  })

  //Draw all the corner points
  context.fillStyle = '#ff0'
  cornerVerts.forEach(drawVertex)

  //Build rbush from boxes
  var rtree = rbush(9)
  rtree.load(boxes)

  function drawRay(v, x) {
    var ray = [Math.min(v[0], x), v[1], Math.max(v[0],x), v[1]]
    drawLine([ray[0]+0.5, ray[1]+0.5], [ray[2]+0.5, ray[3]+0.5])
  }

  function stabTile(v) {
    return rtree.search([v[0]+0.5,v[1]+0.5,v[0]+0.5,v[1]+0.5]).length > 0
  }

  function stabRay(v, x) {
    return rtree.search([Math.min(v[0], x)+0.5, v[1]+0.5, Math.max(v[0],x)+0.5, v[1]+0.5]).length > 0
  }

  function stabBox(a, b) {
    return rtree.search([
      Math.min(a[0], b[0])+0.5,
      Math.min(a[1], b[1])+0.5,
      Math.max(a[0], b[0])+0.5,
      Math.max(a[1], b[1])+0.5 ]).length > 0
  }

  function makePartition(x, corners) {
    var left  = []
    var right = []
    var on    = []

    for(var i=0; i<corners.length; ++i) {
      var c = corners[i]
      if(!stabRay(c, x)) {
        on.push(c)
      }
      if(c[0] < x) {
        left.push(c)
      } else if(c[0] > x) {
        right.push(c)
      }
    }

    //Sort on events by x
    on.sort(function(a, b) {
      var d = a[1] - b[1]
      if(d) { return d }
      return a[0] - b[0]
    })

    //Construct vertices and horizontal edges
    var verts = []
    var edges = []
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
      var e = []
      if(l < x) {
        e.push([l, y])
      }
      if(r > x) {
        e.push([r, y])
      }
      edges.push(e)
    }

    for(var i=0; i+1<verts.length; ++i) {
      if(stabBox(verts[i], verts[i+1])) {
        continue
      }
      edges[i].push(verts[i+1])
      edges[i+1].push(verts[i])
    }

    return {
      x: x,
      left: left,
      right: right,
      verts: verts,
      edges: edges
    }
  }

  function drawPartition(partition) {
    var x = partition.x
    context.strokeStyle = '#f0f'
    context.fillStyle = '#f0f'

    partition.verts.forEach(function(v, i) {
      drawVertex([v[0]+0.5, v[1]+0.5])
      var e = partition.edges[i]
      for(var i=0; i<e.length; ++i) {
        drawLine([v[0]+0.5, v[1]+0.5], [e[i][0]+0.5, e[i][1]+0.5])
      }
    })
  }

  function glueVertex(tree, e, v) {
    if(e[0] < tree.x) {
      glueVertex(tree.left, e, v)
    } else if(e[0] > tree.x) {
      glueVertex(tree.right, e, v)
    } else {
      var idx = bsearch.eq(tree.verts, e, comparePair)
      tree.edges[idx].push(v)
    }
  }

  function makeClarksonTree(corners) {
    if(corners.length === 0) {
      return null
    }

    var x = corners[corners.length>>>1][0]
    var partition = makePartition(x, corners)
    drawPartition(partition)

    var leftTree = makeClarksonTree(partition.left)
    var rightTree = makeClarksonTree(partition.right)

    //Glue left/right tree edges to vertex
    for(var i=0; i<partition.edges.length; ++i) {
      var v = partition.verts[i]
      var e = partition.edges[i]
      for(var j=0; j<e.length; ++j) {
        if(e[j][0] < v[0] && leftTree) {
          glueVertex(leftTree, e[j], v)
        } else if(e[j][0] > v[0] && rightTree) {
          glueVertex(rightTree, e[j], v)
        }
      }
    }

    return {
      x: x,
      verts: partition.verts,
      edges: partition.edges,
      left: leftTree,
      right: rightTree
    }
  }

  var tree = makeClarksonTree(cornerTiles)

  function addEdge(a, b) {
    if(!stabBox(a, b)) {
      drawLine([a[0]+0.5, a[1]+0.5], [b[0]+0.5, a[1]+0.5])
      drawLine([b[0]+0.5, a[1]+0.5], [b[0]+0.5, b[1]+0.5])
    }
  }

  function getConnectingVerts(node, vertex) {
    if(!node) {
      return
    }
    var idx = bsearch.le(node.verts, vertex, function(a, b) {
      return a[1] - vertex[1]
    })
    if(idx < 0) {
      addEdge(node.verts[0], vertex)
    } else if(node.verts[idx][1] === vertex[1]) {
      addEdge(node.verts[idx], vertex)
    } else {
      addEdge(node.verts[idx], vertex)
      if(idx < node.verts.length - 1) {
        addEdge(node.verts[idx+1], vertex)
      }
    }
    if(vertex[0] < node.x) {
      getConnectingVerts(node.left, vertex)
    } else if(vertex[0] > node.x) {
      getConnectingVerts(node.right, vertex)
    }
  }

  //Render the root
  context.fillStyle = '#0f0'
  context.strokeStyle = '#0f0'
  drawVertex([root[0]+0.5, root[1]+0.5])
  getConnectingVerts(tree, root)

  addEdge(root, sink)

  //Render the sink
  context.fillStyle = '#f00'
  context.strokeStyle = '#f00'
  drawVertex([sink[0]+0.5, sink[1]+0.5])
  getConnectingVerts(tree, sink)
}
render()
