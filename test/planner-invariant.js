'use strict'

var checkGraph = require('./graph-invariant')

module.exports = checkPlannerInvariant

function checkPlannerInvariant(t, planner) {
  checkGraph(t, planner.graph)
  checkGeometry(t, planner.geometry)

  //TODO: Check tree invariants

  //TODO: Check visibility of nodes
}
