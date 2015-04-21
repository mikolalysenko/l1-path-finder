'use strict'

var mouseChange  = require('mouse-change')
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

proto.drawCorners = function(corners) {
  for(var i=0; i<corners.length; ++i) {
    this.circle(corners[i][0], corners[i][1], '#ff0')
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


  function render() {
    requestAnimationFrame(render)
    context.fillStyle = '#000'
    context.fillRect(0, 0, canvas.width, canvas.height)
    events.emit('render')
  }
  setTimeout(render, 0)

  return result
}
