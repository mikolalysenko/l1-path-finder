[<img src="https://github.com/mikolalysenko/l1-path-finder/raw/master/img/logo.png">](https://mikolalysenko.github.io/l1-path-finder/www)

[A fast path planner for grids.](https://mikolalysenko.github.io/l1-path-finder/www)

# Example

```javascript
var ndarray = require('ndarray')
var createPlanner = require('l1-path-finder')


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
```

Output:

```
path length= 31
path =  [ 0, 0, 7, 0, 7, 2, 0, 2, 0, 4, 1, 4, 1, 6, 3, 6, 5, 6, 5, 4, 7, 4, 7, 6 ]
```

# Install

This module works in any node-flavored CommonJS environment, including [node.js](https://nodejs.org/), [iojs](https://iojs.org/en/index.html) and [browserify](http://browserify.org/).  You can install it using the [npm package manager](https://docs.npmjs.com/) with the following command:

```
npm i l1-path-finder
```

The input to the library is in the form of an [ndarray](https://github.com/scijs/ndarray).  For more information on this data type, check out the [SciJS](https://scijs.net) project.

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

# Benchmarks

l1-path-finder is probably the fastest JavaScript library for finding paths on
uniform cost grids.  Here is a chart showing some typical comparisons (log-scale):

<img src="https://plot.ly/~MikolaLysenko/221.png" width="512">

You can try out some of the benchmarks in [your browser here](http://mikolalysenko.github.io/benchmark.html), or you can run them locally by cloning this repo.  Data is taken from the [grid path planning challenge benchmark](http://www.movingai.com/benchmarks/).

# Notes and references

* The algorithm implemented in this module is based on the following result by Clarkson et al:
    + K. Clarkson, S. Kapoor, P. Vaidya. (1987) "[Rectilinear shortest paths through polygonal obstacles in O(n log(n)²) time](http://dl.acm.org/citation.cfm?id=41985)" SoCG 87
* This data structure is asymptotically faster than naive grid based algorithms like Jump Point Search or simple A*/Dijkstra based searches.
* All memory is preallocated.  At run time, searches trigger no garbage collection or other memory allocations.
* The heap data structure used in this implementation is a pairing heap based on the following paper:
    + G. Navarro, R. Paredes. (2010) "[On sorting, heaps, and minimum spanning trees](http://citeseerx.ist.psu.edu/viewdoc/summary?doi=10.1.1.218.3241)" Algorithmica
* Box stabbing queries are implemented using rank queries.
* The graph search uses landmarks to speed up A*, based on the technique in the following paper:
    + A. Goldberg, C. Harrelson. (2004) "[Computing the shortest path: A* search meets graph theory](http://research.microsoft.com/pubs/64511/tr-2004-24.pdf)" Microsoft Research Tech Report
* For more information on A* searching, check out [Amit Patel's pages](http://theory.stanford.edu/~amitp/GameProgramming/)

# License

(c) 2015 Mikola Lysenko. MIT License
