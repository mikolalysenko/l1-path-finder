var ndarray = require('ndarray')
var createPlanner = require('../lib/planner')

//Create a maze as an ndarray
var maze = ndarray([
  0, 1, 0, 0, 0, 0, 0,
  0, 1, 0, 1, 0, 0, 0,
  0, 1, 0, 1, 1, 1, 0,
  0, 1, 0, 1, 0, 0, 0,
  0, 1, 0, 1, 0, 0, 0,
  0, 1, 0, 1, 0, 0, 0,
  0, 1, 0, 1, 0, 1, 1,
  0, 0, 0, 1, 0, 0, 0,
], [8, 7])

//Create path planner
var planner = createPlanner(maze)

//Find path
var path = []
var dist = planner.search(0,0,  7,6,  path)

//Log output
console.log('path length=', dist)
console.log('path = ', path)
