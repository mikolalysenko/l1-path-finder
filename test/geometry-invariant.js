'use strict'

module.exports = checkGeometry

function checkGeometry(t, geom) {
  var corners = geom.corners.slice()
  corners.sort(function(a,b) {
    var d = a[0] - b[0]
    if(d) {
      return d
    }
    return a[1] - b[1]
  })

  for(var i=1; i<corners.length; ++i) {
    var a = corners[i]
    var b = corners[i-1]
    t.ok(a[0] !== b[0] || a[1] !== b[1], 'uniqueness')
  }
}
