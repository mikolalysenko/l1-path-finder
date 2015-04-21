l1-path-finder
==============
An implementation of Clarkson's algorithm for finding the shortest path in a grid.

Some notes about this implementation:

* All memory is preallocated.  At run time, searches trigger no garbage collection or other memory allocations.
* This data structure is asymptotically faster than naive grid based algorithms like Jump Point Search or simple A*/Dijkstra based searches.
* The heap data structure used in this implementation is a pairing heap based on the following paper:

G. Navarro, R. Paredes. (2010) "[On sorting, heaps, and minimum spanning trees](http://citeseerx.ist.psu.edu/viewdoc/summary?doi=10.1.1.218.3241)" Algorithmica

* The algorithm implemented in this module is based on the following result by Clarkson et al:

K. Clarkson, S. Kapoor, P. Vaidya. (1987) "[Rectilinear shortest paths through polygonal obstacles in O(n(log(n)²) time]" SoCG 87

# Example

```javascript
var unpack = require('ndarray-unpack')
var createPlanner = require('l1-path-finder')

//Read in maze into an ndarray
var maze = unpack([
  [1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 0, 1, 0, 0, 0, 0, 0, 1],
  [1, 0, 1, 0, 1, 0, 0, 0, 1],
  [1, 0, 1, 0, 1, 1, 1, 0, 1],
  [1, 0, 1, 0, 1, 0, 0, 0, 1],
  [1, 0, 1, 0, 1, 0, 0, 0, 1],
  [1, 0, 1, 0, 1, 0, 0, 0, 1],
  [1, 0, 1, 0, 1, 0, 1, 1, 1],
  [1, 0, 1, 0, 1, 0, 0, 0, 1],
  [1, 0, 1, 0, 1, 0, 0, 0, 1],
  [1, 0, 0, 0, 1, 0, 0, 0, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1]
])

//Create path planner
var planner = createPlanner(maze)

//Find path
var path = []
var dist = planner.search(1,1,  10,8,  path)

//Output ditance
console.log('distance = ', dist)
console.log('path = ', path)

//Render result
```

# Install
This module works in any node-flavored CommonJS environment, including [node.js](https://nodejs.org/), [iojs](https://iojs.org/en/index.html) and [browserify](http://browserify.org/).  You can install it using the [npm package manager](https://docs.npmjs.com/) with the following command:

```
npm i l1-path-finder
```

The input the library is in the form of an [ndarray](https://github.com/scijs/ndarray).  For more information on this data type, check out the [SciJS](https://scijs.net) project.

# API

```javascript
var createPlanner = require('l1-path-finder')
```

#### `var planner = createPlanner(grid)`
The default method from the package is a constructor which creates a path planner.

* `grid` is a 2D ndarray.  `0` or `false`-y values correspond to empty cells and non-zero or `true`-thy values correspond to impassable obstacles

**Returns** A new planner object which you can use to answer queries about the path.

**Time Complexity** `O(grid.shape[0]*grid.shape[1] + n log(n))` where `n` is the number of concave corners in the grid.

**Space Complexity** `O(n log(n))`

#### `var dist = planner.search(srcX, srcY, dstX, dstY[, path])`
Executes a path search on the grid.

* `srcX, srcY` are the coordinates of the start of the path (source)
* `dstX, dstY` are the coordiantes of the end of the path (target)
* `path` is an optional array which receives the result of the path

**Returns** The distance from the source to the target

**Time Complexity** Worst case `O(n log²(n))`, but in practice much less usually
