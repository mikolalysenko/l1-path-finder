'use strict'

module.exports = checkDefaultGraphInvariant

var vtx = require('../lib/vertex')

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

  graph.verts.forEach(function(v, i) {
    //Check topology
    v.edges.forEach(function(u, j) {
      var v_idx = u.edges.indexOf(v)
      t.ok(v_idx >= 0, 'vertex ' + V(v) + ' linked to ' + V(u))
    })

    t.equals(v.left, vtx.NIL, 'left clear')
    t.equals(v.right, vtx.NIL, 'right clear')
    t.equals(v.parent, vtx.NIL, 'parent clear')
    t.ok(!v.target, 'not target')
    t.equals(v.state, 0, 'state ok')
    t.equals(v.nextFree, null, 'free list empty')
  })
}
