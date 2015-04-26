'use strict'

var now = require('right-now')
var ndarray = require('ndarray')
var imshow = require('ndarray-imshow')
var morphology = require('ball-morphology')
var mouseChange = require('mouse-change')
var createPlanner = require('../lib/planner')

var BALL_RADIUS = 6
var WIDTH = 1024
var HEIGHT = 512

var COLORS = [
  'red',
  'orange',
  'yellow',
  'green',
  'blue'
]

var canvas = document.createElement('canvas')
canvas.width = WIDTH
canvas.height = HEIGHT
document.body.appendChild(canvas)

var context = canvas.getContext('2d')

function drawText() {
  context.fillStyle = '#000'
  context.fillRect(0, 0, WIDTH, HEIGHT)

  context.fillStyle = '#fff'
  context.textAlign = 'center'
  context.font = "80pt 'Courier New'"
  context.fillText('l1-path-finder', WIDTH>>1, HEIGHT>>1)
}

drawText()

var pixels = context.getImageData(0, 0, WIDTH, HEIGHT)
var pixelArray = ndarray(pixels.data, [HEIGHT, WIDTH, 4])
var dilated = morphology.dilate(pixelArray.pick(-1,-1,0), BALL_RADIUS)
var planner = createPlanner(dilated.transpose(1,0))

imshow(dilated)

var particles    = []
var paths        = []
var defTargets   = []
var speed        = []

for(var i=0; i<18; ++i) {
  particles.push([ 90 + i * 50, 128 ])
  defTargets.push([ 1024 - (90 + i * 50), 374 ])
  speed.push((Math.random()*2+1)|0)
}

function recalcPaths(targets) {
  for(var i=0; i<particles.length; ++i) {
    var p = particles[i]
    var t = targets[i]
    var path = []
    planner.search(p[0], p[1],
      Math.max(Math.min(t[0], WIDTH), 0),
      Math.max(Math.min(t[1], HEIGHT), 0), path)
    paths[i] = path
    console.log(p, t, path)
  }
}

recalcPaths(defTargets)

var mouseDown = false
var mouseX = 0
var mouseY = 0
mouseChange(canvas, function(buttons, x, y) {
  if(buttons) {
    mouseDown = true
    mouseX = x
    mouseY = y
  } else if(mouseDown) {
    mouseDown = false
    recalcPaths(defTargets)
  }
})

function moveParticle(loc, path, speed) {
  while(speed > 0 && path.length > 0) {
    var x = path[0]
    var y = path[1]
    if(loc[0] < x) {
      loc[0] += 1
      speed -= 1
    } else if(loc[0] > x) {
      loc[0] -= 1
      speed -= 1
    } else if(loc[1] < y) {
      loc[1] += 1
      speed -= 1
    } else if(loc[1] > y) {
      loc[1] -= 1
      speed -= 1
    } else {
      path.shift()
      path.shift()
    }
  }
}

function render() {

  requestAnimationFrame(render)

  drawText()

  if(mouseDown) {
    var theta = (now() * 0.001) % (2*Math.PI)
    var targets = []

    for(var i=0; i<particles.length; ++i) {
      var phi = theta + 2.0 * Math.PI*i/18

      var dx = (mouseX + Math.cos(phi) * 50)|0
      var dy = (mouseY + Math.sin(phi) * 50)|0
      targets[i] = [dx, dy]
    }

    recalcPaths(targets)
  }

  var numActive = 0
  for(var i=0; i<particles.length; ++i) {
    var p = particles[i]
    context.fillStyle = COLORS[i % COLORS.length]
    context.beginPath()
    context.arc(p[0], p[1], BALL_RADIUS, 0, 2 * Math.PI, false)
    context.fill()
    var s = speed[i]
    if(mouseDown) {
      s = 4
    }
    moveParticle(p, paths[i], s)
    if(paths[i].length > 0) {
      numActive ++
    }
  }

  if(numActive === 0) {

  }
}

render()
