// 2D rectangle: { begin: 2D.vector, end: 2D.vector }

const fromWidget = ({ center, size, rotate }) => {
  const halfDeltaX = size.y * Math.sin(rotate) * 0.5
  const halfDeltaY = size.y * Math.cos(rotate) * -0.5 // canvas y
  return {
    begin: {
      x: center.x + halfDeltaX,
      y: center.y + halfDeltaY
    },
    end: {
      x: center.x - halfDeltaX,
      y: center.y - halfDeltaY
    }
  }
}

export {
  fromWidget
}
