/// credit to François Romain: https://medium.com/@francoisromain/smooth-a-svg-path-with-functional-programming-1b9876b8bf7e

function line([AX, AY], [BX, BY]) {
  const lengthX = BX - AX
  const lengthY = BY - AY

  return {
    length: Math.sqrt((lengthX ** 2) + (lengthY ** 2)),
    angle: Math.atan2(lengthY, lengthX)
  }
}

const controlPoint = (lineCalc, smooth) => (current, previous, next, reverse) => {
  const p = previous || current
  const n = next || current

  // Properties of the line between previous and next
  const l = lineCalc(p, n)

  // If is end-control-point, add PI to the angle to go backward
  const angle = l.angle + (reverse ? Math.PI : 0)
  const length = l.length * Math.min(0.3, smooth)
  const decimals = 10 ** 1

  // The control point position is relative to the current point
  const x = Math.round(current[0] + (Math.cos(angle) * length * decimals)) / decimals
  const y = Math.round(current[1] + (Math.sin(angle) * length * decimals)) / decimals

  return [x, y]
}

const bezierCommand = controlPointCalc => (point, i, a) => {
  // Start control point
  const [cpsX, cpsY] = controlPointCalc(a[i - 1], a[i - 2], point)

  // End control point
  const [cpeX, cpeY] = controlPointCalc(point, a[i - 1], a[i + 1], true)

  const isSig = p => Math.abs(Math.round(p)) > 0
  const significant = [cpsX, cpsY, cpeX, cpeY].every(isSig)
  if (!significant) {
    return `l ${point[0]} ${point[1]}`
  }

  return `c ${cpsX},${cpsY} ${cpeX},${cpeY} ${point[0]},${point[1]}`
}

const pointsReducer = command =>
  (acc, point, i, points) => i === 0 ? `l${point[0]} ${point[1]}` : `${acc} ${command(point, i, points)}`

const createLine = (pointsXY, command) =>
  pointsXY.reduce(pointsReducer(command), '')

const controlPointCalc = smooth => controlPoint(line, smooth)

const bezierCommandCalc = smooth => bezierCommand(controlPointCalc(smooth))

module.exports =
  (pointsXY = [], {smooth = 0.1}) => createLine(pointsXY, bezierCommandCalc(smooth))
