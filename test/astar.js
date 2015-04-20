'use strict'

var tape = require('tape')
var vtx = require('../lib/vertex')
var Graph = require('../lib/graph')

function V(v) {
  return [v.x, v.y]
}

function checkDefaultGraphInvariant(t, graph) {
  t.equals(graph.toVisit, vtx.NIL, 'heap empty')
  t.equals(graph.freeList, graph.target, 'target head of freelist')

  t.equals(graph.target.left, vtx.NIL, 'target left clear')
  t.equals(graph.target.right, vtx.NIL, 'target right clear')
  t.equals(graph.target.parent, vtx.NIL, 'target parent clear')
  t.equals(graph.target.state, 0, 'target state clear')
  t.equals(graph.target.nextFree, null, 'target nextFree null')
  t.same(graph.target.edges, [], 'target edges empty')
  t.same(graph.target.lengths, [], 'target edge weights clear')

  graph.verts.forEach(function(v, i) {
    //Check topology
    t.equals(v.lengths.length, v.edges.length, 'edge length = weight length')
    v.edges.forEach(function(u, j) {
      var v_idx = u.edges.indexOf(v)
      t.ok(v_idx >= 0, 'vertex ' + V(v) + ' linked to ' + V(u))

      var d = Math.abs(v.x - u.x) + Math.abs(v.y - u.y)
      t.equals(u.lengths[v_idx], d, 'u length ok')
      t.equals(v.lengths[j], d, 'v length ok')
    })

    t.equals(v.left, vtx.NIL, 'left clear')
    t.equals(v.right, vtx.NIL, 'right clear')
    t.equals(v.parent, vtx.NIL, 'parent clear')
    t.ok(!v.target, 'not target')
    t.equals(v.state, 0, 'state ok')
    t.equals(v.nextFree, null, 'free list empty')
  })
}

tape('a-star - singleton', function(t) {

  var g = new Graph()
  var v = g.vertex(0,0)

  checkDefaultGraphInvariant(t, g)

  g.setSourceAndTarget(-1,-1,  1,1)
  g.addS(v)
  t.equals(v.distance, 2, 'vdist ok')
  t.equals(v.weight, 4, 'weight ok')
  t.equals(v.state, 1, 'v active')

  g.addT(v)
  t.ok(v.target, 'target ok')

  t.equals(g.search(), 4, 'distance ok')

  var p = g.getPath([])
  t.same(p, [1,1,0,0,-1,-1], 'path ok')

  checkDefaultGraphInvariant(t, g)

  g.setSourceAndTarget(-1,-1,  1,1)
  g.addS(v)
  t.equals(v.distance, 2, 'vdist ok')
  t.equals(v.weight, 4, 'weight ok')
  t.equals(v.state, 1, 'v active')

  t.equals(g.search(), Infinity, 'disconnected')

  checkDefaultGraphInvariant(t, g)

  t.end()
})

tape('a-star - grid', function(t) {

  var g = new Graph()
  var verts = []

  for(var i=0; i<11; ++i) {
    var row = verts[i] = []
    for(var j=0; j<11; ++j) {
      row[j] = g.vertex(i, j)
    }
  }

  //Link edges
  for(var i=0; i<10; ++i) {
    for(var j=0; j<10; ++j) {
      g.link(verts[i][j], verts[i+1][j])
      g.link(verts[i][j], verts[i][j+1])
    }
  }

  checkDefaultGraphInvariant(t, g)

  //Run a series of random tests
  for(var i=0; i<20; ++i) {
    var sx = (Math.random()*10)|0
    var sy = (Math.random()*10)|0
    var tx = (Math.random()*10)|0
    var ty = (Math.random()*10)|0

    g.setSourceAndTarget(sx,sy, tx,ty)
    g.addS(verts[sx][sy])
    t.equals(verts[sx][sy].distance, 0, 'vdist ok')
    t.equals(verts[sx][sy].weight, Math.abs(sx-tx)+Math.abs(sy-ty), 'weight ok')
    t.equals(verts[sx][sy].state, 1, 'v active')

    g.addT(verts[tx][ty])
    t.ok(verts[tx][ty].target, 'target ok')

    t.equals(g.search(), Math.abs(sx-tx) + Math.abs(sy-ty), 'dist ok')
    checkDefaultGraphInvariant(t, g)
  }

  t.end()
})
