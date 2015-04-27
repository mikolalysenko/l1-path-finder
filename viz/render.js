'use strict'

var mouseChange  = require('mouse-change')
var colormap     = require('colormap')
var EventEmitter = require('events').EventEmitter

module.exports = createRenderer

function Renderer(context, canvas, shape, events) {
  this.context = context
  this.canvas  = canvas
  this.shape   = shape
  this.events  = events
}

var proto = Renderer.prototype

proto.tileDim = function() {
  return Math.round(Math.min(
    this.canvas.width/this.shape[0],
    this.canvas.height/this.shape[1]))|0
}

proto.tile = function(x, y, color) {
  var tileR = this.tileDim()
  this.context.fillStyle = color||'#fff'
  this.context.fillRect(x*tileR, y*tileR, tileR, tileR)
}

proto.circle = function(x, y, color) {
  var tileR = this.tileDim()
  if(tileR <= 2) {
    this.tile(x, y, color)
    return
  }
  this.context.fillStyle = color||'#fff'
  this.context.beginPath()
  this.context.arc((x+0.5)*tileR, (y+0.5)*tileR, 0.25*tileR, 0, 2.0*Math.PI)
  this.context.fill()
}

proto.line = function(ax, ay, bx, by, color) {
  var tileR = this.tileDim()
  this.context.strokeStyle = color||'#fff'
  this.context.beginPath()
  this.context.moveTo((ax+0.5)*tileR, (ay+0.5)*tileR)
  this.context.lineTo((bx+0.5)*tileR, (by+0.5)*tileR)
  this.context.stroke()
}

proto.box = function(ax, ay, bx, by, color) {
  this.line(ax-0.5,ay-0.5,ax-0.5,by-0.5,color)
  this.line(bx-0.5,ay-0.5,bx-0.5,by-0.5,color)
  this.line(ax-0.5,ay-0.5,bx-0.5,ay-0.5,color)
  this.line(ax-0.5,by-0.5,bx-0.5,by-0.5,color)
}

proto.drawCorners = function(corners, color) {
  for(var i=0; i<corners.length; ++i) {
    this.circle(corners[i][0], corners[i][1], color || '#ff0')
  }
}

proto.rtree = function(rtree) {
  var self = this
  function drawRec(node, level) {
    if(node.bbox) {
      for(var i=0; i<node.children.length; ++i) {
        drawRec(node.children[i], level+1)
      }
      var intensity = 1.0 - Math.pow(2, -(level+1))
      var color = 'rgba(20,128,' + (255*intensity) + ',' + intensity + ')'
      self.box(node.bbox[0], node.bbox[1], node.bbox[2], node.bbox[2], color)
    } else {
      self.box(node[0], node[1], node[2], node[3], 'rgba(128, 240, 196, 1)')
    }
  }
  drawRec(rtree.data, 0)
}

proto.graph = function(graph, color) {
  for(var i=0; i<graph.verts.length; ++i) {
    var v = graph.verts[i]
    this.circle(v.x, v.y, color)
    for(var j=0; j<v.edges.length; ++j) {
      var u = v.edges[j]
      this.line(v.x, v.y, u.x, u.y, color)
    }
  }
}

proto.graphDist = function(graph) {
  var maxDist = 0
  for(var i=0; i<graph.verts.length; ++i) {
    if(graph.verts[i].weight < Infinity) {
      maxDist = Math.max(
        graph.verts[i].weight-graph.verts[i].heuristic
        , maxDist)
    }
  }

  var cmap = colormap({
    colormap: 'jet',
    nshades: Math.ceil(maxDist+6)|0,
    format: 'rgbaString',
    alpha: 0.5
  })
  for(var i=0; i<graph.verts.length; ++i) {
    var v = graph.verts[i]
    if(v.weight < Infinity) {
      this.tile(v.x, v.y, cmap[Math.floor(maxDist - (v.weight-v.heuristic))|0])
    }
  }
}


proto.path = function(path, color) {
  for(var i=0; i+2<path.length; i+=2) {
    var sx = path[i]
    var sy = path[i+1]
    var tx = path[i+2]
    var ty = path[i+3]
    while(sx < tx) {
      this.circle(sx, sy, color)
      sx += 1
    }
    while(sx > tx) {
      this.circle(sx, sy, color)
      sx -= 1
    }
    while(sy < ty) {
      this.circle(sx, sy, color)
      sy += 1
    }
    while(sy > ty) {
      this.circle(sx, sy, color)
      sy -= 1
    }
    this.circle(tx, ty, color)
  }
}

function createRenderer(shape, canvas) {
  if(!canvas) {
    canvas = document.createElement('canvas')
    canvas.width = canvas.height = 512
    document.body.appendChild(canvas)
  }

  var context = canvas.getContext('2d')

  canvas.addEventListener('contextmenu', function(ev) {
    ev.preventDefault()
  })

  var events = new EventEmitter()

  var result = new Renderer(context, canvas, shape, events)

  var lastButton = 0
    , lastTileX = -1
    , lastTileY = -1
  mouseChange(canvas, function(button, x, y) {
    var tileR = result.tileDim()
    var tileX = Math.floor(x / tileR)
    var tileY = Math.floor(y / tileR)

    if(tileX < 0 ||
       tileY < 0 ||
       tileX >= result.shape[0] ||
       tileY >= result.shape[1]) {
      tileX = tileY = -1
    }

    if(tileX !== lastTileX || tileY !== lastTileY) {
      events.emit('tile-change', tileX, tileY, button)
    }
    if(button !== lastButton) {
      events.emit('button-change', tileX, tileY, button)
    }

    lastTileX = tileX
    lastTileY = tileY
    lastButton = button
  })


  /*
  function render() {
    requestAnimationFrame(render)
    context.fillStyle = '#000'
    context.fillRect(0, 0, canvas.width, canvas.height)
    events.emit('render')
  }
  setTimeout(render, 0)
  */

  return result
}
