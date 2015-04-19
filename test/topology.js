'use strict'

var tape = require('tape')
var vtx = require('../lib/vertex')

tape('topology', function(t) {

  var verts = []
  for(var i=0; i<10; ++i) {
    verts.push(vtx.create(i,i))
  }

  for(var i=0; i<10; ++i) {
    var v = verts[i]
    for(var j=1+i; j<10; j+=(i+1)) {
      var u = verts[j]
      vtx.link(u, v)

    }
  }

  for(var i=0; i<10; ++i) {
    var v = verts[i]
    for(var j=1+i; j<10; j+=(i+1)) {
      var u = verts[j]
      var v_idx = v.edges.indexOf(u)
      var u_idx = u.edges.indexOf(v)
      t.equals(v.edges[v_idx], u)
      t.equals(u.edges[u_idx], v)
      var d = Math.abs(v.x - u.x) + Math.abs(v.y - u.y)
      t.equals(v.lengths[v_idx], d)
      t.equals(u.lengths[u_idx], d)
    }
  }

  t.end()
})
