'use strict'

var tape = require('tape')
var vtx = require('../lib/vertex')

tape('free list', function(t) {

  //Test free list
  var list = null

  //Try inserting elements into the list
  var items = []
  for(var i=0; i<100; ++i) {
    var v = vtx.create(i, i)
    v.state = i
    items.push(v)
    list = vtx.insert(list, v)
  }

  //Check list state
  var head = list
  for(var i=99; i>=0; --i) {
    t.equals(head, items[i])
    head = head.nextFree
  }
  t.equals(head, null)


  t.end()
})
