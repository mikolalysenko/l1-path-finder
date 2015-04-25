'use strict'

var checkGraph = require('./graph-invariant')
var checkGeometry = require('./geometry-invariant')

module.exports = checkPlannerInvariant

function checkPlannerInvariant(t, planner) {
  checkGraph(t, planner.graph)
  checkGeometry(t, planner.geometry)

  //TODO: Check connected components

  //TODO: Check tree invariants

  //Check visibility of each edge
  for(var i=0; i<planner.graph.verts.length; ++i) {
    var v = planner.graph.verts[i]
    for(var j=0; j<v.edges.length; ++j) {
      var u = v.edges[j]
      t.ok(!planner.geometry.stabBox(v.x, v.y, u.x, u.y), 'edge visible: ' + [v.x,v.y] + '-' + [u.x,u.y])
    }
  }
}
