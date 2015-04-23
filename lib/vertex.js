'use strict'

//Vertices have to do multiple things
//
//  1.  They store the topology of the graph which is gonna get searched
//  2.  They implement the pairing heap data sturcture (intrusively)
//  3.  They implement a linked list for tracking clean up
//  4.  Track search information (keep track of predecessors, distances, open state)
//

function Vertex(x, y) {
  //User data
  this.x        = x
  this.y        = y

  //Adjacency info
  this.edges    = []

  //Visit tags
  this.distance         = 0.25
  this.target           = false
  this.state            = 0
  this.pred             = null

  //Priority queue info
  this.weight   = 0.25
  this.left     = null
  this.right    = null
  this.parent   = null

  //Free list
  this.nextFree = null
}

//Sentinel node
var NIL = new Vertex(Infinity,Infinity)
NIL.weight = -Infinity
NIL.left = NIL.right = NIL.parent = NIL

//Heap insertion
function link(a, b) {
  var al = a.left
  b.right = al
  al.parent = b
  b.parent = a
  a.left = b
  a.right = NIL
  return a
}

function merge(a, b) {
  if(a === NIL) {
    return b
  } else if(b === NIL) {
    return a
  } else if(a.weight < b.weight) {
    return link(a, b)
  } else {
    return link(b, a)
  }
}

function heapPush(root, node) {
  if(root === NIL) {
    return node
  } else if(root.weight < node.weight) {
    var l = root.left
    node.right = l
    l.parent = node
    node.parent = root
    root.left = node
    return root
  } else {
    var l = node.left
    root.right = l
    l.parent = root
    root.parent = node
    node.left = root
    return node
  }
}

function takeMin(root) {
  var p = root.left
  root.left = NIL
  root = p
  while(true) {
    var q = root.right
    if(q === NIL) {
      break
    }
    p = root
    var r = q.right
    var s = merge(p, q)
    root = s
    while(true) {
      p = r
      q = r.right
      if(q === NIL) {
        break
      }
      r = q.right
      s = s.right = merge(p, q)
    }
    s.right = NIL
    if(p !== NIL) {
      p.right = root
      root = p
    }
  }
  root.parent = NIL
  return root
}

function decreaseKey(root, p) {
  var q = p.parent
  if(q.weight < p.weight) {
    return root
  }
  var r = p.right
  r.parent = q
  if(q.left === p) {
    q.left = r
  } else {
    q.right = r
  }
  if(root.weight <= p.weight) {
    var l = root.left
    l.parent = p
    p.right = l
    root.left = p
    p.parent = root
    return root
  } else {
    var l = p.left
    root.right = l
    l.parent = root
    p.left = root
    root.parent = p
    p.right = p.parent = NIL
    return p
  }
}

//Topology
function createVertex(x, y) {
  var result = new Vertex(x, y)
  result.left = result.right = result.parent = NIL
  return result
}

function addEdge(u, v) {
  u.edges.push(v)
  v.edges.push(u)
}

//Free list functions
function pushList(list, node) {
  if(node.nextFree) {
    return list
  }
  node.nextFree = list
  return node
}

function clearList(v) {
  while(v) {
    var next = v.nextFree
    v.target = false
    v.state = 0
    v.left = v.right = v.parent = NIL
    v.nextFree = null
    v = next
  }
}

//Graph topology
exports.create        = createVertex
exports.link          = addEdge

//Free list management
exports.insert        = pushList
exports.clear         = clearList

//Heap operations
exports.NIL           = NIL
exports.push          = heapPush
exports.pop           = takeMin
exports.decreaseKey   = decreaseKey
