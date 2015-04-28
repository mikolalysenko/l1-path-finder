'use strict'

var now = require('right-now')
var ndarray = require('ndarray')
var mazegen = require('maze-generator')
var morphology = require('ball-morphology')
var mouseChange = require('mouse-change')
var shuffle = require('shuffle-array')
var imshow = require('ndarray-imshow')
var createPlanner = require('../lib/planner')

var BALL_RADIUS = 5
var WIDTH = 1024
var HEIGHT = 512
var TILE_R = 16
var NUM_PARTICLES = 20
var CIRCLE_DIST  = 30
var SPIN_RATE = 0.005

var COLOR_MAIN  = '#76488F'
var COLOR_A     = '#FFDFB1'
var COLOR_B     = '#88B7E1'
var COLOR_MINOR = '#FFFF93'

var COLORS = [
  '#88B7E1',
  '#A5CEF4',
  '#96C3E3',
  '#7CA9D2',
  '#709BC1'
]


var canvas = document.createElement('canvas')
var context = canvas.getContext('2d')

var renderCanvas = document.getElementById('render-canvas')
if(!renderCanvas) {
  renderCanvas = document.createElement('canvas')
  document.body.appendChild(renderCanvas)

  renderCanvas.style.position = 'absolute'
  renderCanvas.style.top = '0'
  renderCanvas.style.left = '0'
  renderCanvas.style.margin = '0'
  renderCanvas.style.width = '100%'
  renderCanvas.style.height = '100%'
}

var renderContext = renderCanvas.getContext('2d')
var pixels, pixelArray, dilated, planner

var particles    = []
var paths        = []
var defTargets   = []
var oldTargets   = []
var speed        = []

function line(x0, y0, x1, y1, s) {
  context.moveTo(x0*s, y0*s)
  context.lineTo(x1*s, y1*s)
}

var maze

function roundDownToMult(x, s) {
  return Math.floor(x / s)*s
}

function roundUpToMult(x, s) {
  return Math.ceil(x / s)*s
}


function drawText(colorful, scale) {

  var MAZE_X = Math.ceil(WIDTH / TILE_R)|0
  var MAZE_Y = Math.ceil(HEIGHT / TILE_R)|0

  var width = canvas.width
  var height = canvas.height

  var s = scale * TILE_R

  context.fillStyle = colorful ? COLOR_MAIN : '#000'
  context.fillRect(0, 0, width, height)

  if(!colorful) {
    maze = mazegen([MAZE_Y,MAZE_X])
  }
  context.strokeStyle = colorful ? COLOR_A : '#fff'
  context.lineWidth = 3*scale
  context.beginPath()
  for(var i=0; i<MAZE_X; ++i) {
    for(var j=0; j<MAZE_Y; ++j) {
      var cell = maze[i][j]
      if(cell & 8) {
        line(i,j, i+1,j, s)
      }
      if(cell & 1) {
        line(i,j, i,j+1, s)
      }
    }
  }
  context.stroke()

  context.fillRect(0, 0, width, roundUpToMult(0.15*height, s)+6*scale)
  context.fillRect(0, roundDownToMult(0.85*height,s)-3*scale, width, 0.4*height)

  var fontSize = Math.floor(0.1 * width)|0


  var y0 = roundDownToMult(0.5*height-0.55*fontSize, s)-3*scale
  var y1 = roundUpToMult(1.1*fontSize,s)+6*scale

  context.fillRect(
    roundDownToMult(0.1*width, s)-3*scale,
    y0,
    roundUpToMult(0.8*width,s)+6*scale,
    y1)

  context.fillStyle = colorful ? COLOR_MINOR : '#fff'
  context.textAlign = 'center'
  context.textBaseline = 'middle'
  context.font = fontSize + "px Verdana"
  context.fillText('l1-path-finder', 0.5*width, y0+0.5*y1-0.1*fontSize)
}


function recalcPaths(targets) {
  for(var i=0; i<particles.length; ++i) {
    var p = particles[i]
    var t = targets[i]
    var npath = []
    planner.search(p[0], p[1], t[0], t[1], npath)
    if(npath.length > 0) {
      paths[i] = npath
    }
  }
}

function onResize() {
  WIDTH = Math.ceil(renderCanvas.clientWidth)|0
  HEIGHT = Math.ceil(renderCanvas.clientHeight)|0

  canvas.width = WIDTH
  canvas.height = HEIGHT

  //Render obstacle
  drawText(false, 1)
  pixels = context.getImageData(0, 0, WIDTH, HEIGHT)
  pixelArray = ndarray(pixels.data, [HEIGHT, WIDTH, 4])
  dilated = morphology.dilate(pixelArray.pick(-1,-1,0), BALL_RADIUS)
  planner = createPlanner(dilated.transpose(1,0))

  //Resize by devicePixelRatio for retina
  var pixelRatio = window.devicePixelRatio|1
  var width = Math.round(pixelRatio*WIDTH)|0
  var height = Math.round(pixelRatio*HEIGHT)|0

  canvas.width = width
  canvas.height = height
  renderCanvas.width = width
  renderCanvas.height = height

  //Render background image
  drawText(true, pixelRatio)

  //Initialize particles
  var step = (0.8 * WIDTH) / (NUM_PARTICLES-1)
  particles.length = 0
  defTargets.length = 0
  speed.length = 0
  for(var i=0; i<NUM_PARTICLES; ++i) {
    particles.push([ Math.round(0.1 * WIDTH + i * step), (0.1*HEIGHT)|0 ])
    defTargets.push([ WIDTH - Math.round(0.1 * WIDTH + i * step), (0.9*HEIGHT)|0 ])
    speed.push((Math.random()*2+2)|0)
    paths[i] = []
  }
  oldTargets = particles.map(function(p) {
    return p.slice()
  })

  //Recalculate paths
  recalcPaths(defTargets)
}

onResize()

window.addEventListener('resize', onResize)

var mouseDown = false
var mouseX = 0
var mouseY = 0
mouseChange(renderCanvas, function(buttons, x, y) {
  x = Math.round(x / renderCanvas.clientWidth * WIDTH)|0
  y = Math.round(y / renderCanvas.clientHeight * HEIGHT)|0
  if(buttons) {
    mouseDown = true
    mouseX = x
    mouseY = y
  } else if(mouseDown) {
    mouseDown = false
    for(var i=0; i<paths.length; ++i) {
      paths[i] = []
    }
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

function searchSquare(dx, dy) {
  if(dilated.get(dy, dx)) {
    var cx = dx
    var cy = dy
    var r = 10000
    for(var ox=-5; ox<=5; ++ox) {
      for(var oy=-5; oy<=5; ++oy) {
        if(ox*ox + oy*oy < r) {
          var nx = Math.max(Math.min(dx+ox, WIDTH-1), 0)
          var ny = Math.max(Math.min(dy+oy, HEIGHT-1), 0)
          if(!dilated.get(ny, nx)) {
            cx = nx
            cy = ny
            r = ox*ox + oy*oy
          }
        }
      }
    }
    dx = cx
    dy = cy
  }
  return [dx, dy]
}

var theta = 0.0

function render() {

  requestAnimationFrame(render)

  var pixelRatio = window.devicePixelRatio|1

  renderContext.drawImage(canvas, 0, 0, WIDTH*pixelRatio, HEIGHT*pixelRatio)

  if(mouseDown) {
    theta = (theta + SPIN_RATE) % (2.0 * Math.PI)
    var targets = []

    for(var i=0; i<particles.length; ++i) {
      var phi = theta + 2.0 * Math.PI*i/NUM_PARTICLES

      var dx = Math.round(mouseX + Math.cos(phi) * CIRCLE_DIST)|0
      var dy = Math.round(mouseY + Math.sin(phi) * CIRCLE_DIST)|0
      dx = Math.max(Math.min(dx, WIDTH-1), 0),
      dy = Math.max(Math.min(dy, HEIGHT-1), 0)

      targets[i] = searchSquare(dx, dy)
    }

    recalcPaths(targets)
  }

  var numActive = 0
  for(var i=0; i<particles.length; ++i) {
    var p = particles[i]
    renderContext.fillStyle = COLORS[i % COLORS.length]
    renderContext.beginPath()
    renderContext.arc(pixelRatio*p[0], pixelRatio*p[1], pixelRatio*BALL_RADIUS, 0, 2 * Math.PI, false)
    renderContext.fill()
    var s = speed[i]
    if(mouseDown) {
      s = 10
    }
    moveParticle(p, paths[i], s)
    if(paths[i].length > 0) {
      numActive ++
    }
  }

  if(numActive === 0 && !mouseDown) {
    var tmp = oldTargets
    oldTargets = defTargets
    defTargets = shuffle(tmp)
    for(var i=0; i<particles.length; ++i) {
      speed[i] = (Math.random()*5+2)|0
    }
    recalcPaths(defTargets)
  }
}

render()
