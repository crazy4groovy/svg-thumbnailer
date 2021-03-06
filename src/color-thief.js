/*
 * Color Thief v2.1.0
 * by Lokesh Dhakar - http://www.lokeshdhakar.com
 *
 * Thanks
 * ------
 * Nick Rabinowitz - For creating quantize.js.
 * John Schulz - For clean up and optimization. @JFSIII
 * Nathan Spady - For adding drag and drop support to the demo page.
 *
 * License
 * -------
 * Copyright Lokesh Dhakar
 * Released under the MIT license
 * https://raw.githubusercontent.com/lokesh/color-thief/master/LICENSE
 *
 * @license
 */

/*
* GetPalette(sourceImage[, colorCount, quality])
* returns array[ {r: num, g: num, b: num}, {r: num, g: num, b: num}, ...]
*
* Use the median cut algorithm provided by quantize.js to cluster similar colors.
*
* colorCount determines the size of the palette; the number of colors returned. If not set, it
* defaults to 10.
*
* BUGGY: Function does not always return the requested amount of colors. It can be +/- 2.
*
* quality is an optional argument. It needs to be an integer. 1 is the highest quality settings.
* 10 is the default. There is a trade-off between quality and speed. The bigger the number, the
* faster the palette generation but the greater the likelihood that colors will be missed.
*
*/

module.exports.getPalette = function ({data}, colorCount, quality = 5) {
  colorCount = Math.min(256, Math.max(2, colorCount))
  quality = Math.min(20, Math.max(1, quality))

  const pixelCount = data.length

  // Store the RGB values in an array format suitable for quantize function
  const pixelArray = []
  for (let i = 0, offset, r, g, b, a; i < pixelCount; i += quality) {
    offset = i * 4
    r = data[offset + 0]
    g = data[offset + 1]
    b = data[offset + 2]
    a = data[offset + 3]
    // If pixel is mostly opaque and not white
    if (a >= 125) {
      if (!(r > 250 && g > 250 && b > 250)) {
        pixelArray.push([r, g, b])
      }
    }
  }

  // Send array to quantize function which clusters values
  // using median cut algorithm
  const cmap = MMCQ.quantize(pixelArray, colorCount)
  const palette = cmap ? cmap.palette() : null

  return {palette, pixelArray}
}

/*!
* quantize.js Copyright 2008 Nick Rabinowitz.
* Licensed under the MIT license: http://www.opensource.org/licenses/mit-license.php
* @license
*/

// fill out a couple protovis dependencies
/*!
* Block below copied from Protovis: http://mbostock.github.com/protovis/
* Copyright 2010 Stanford Visualization Group
* Licensed under the BSD License: http://www.opensource.org/licenses/bsd-license.php
* @license
*/

const pv = {
  map(array, f) {
    const o = {}
    return f ? array.map((d, i) => {
      o.index = i
      return f.call(o, d)
    }) : array.slice()
  },
  naturalOrder(a, b) {
    return (a < b) ? -1 : ((a > b) ? 1 : 0)
  },
  sum(array, f) {
    const o = {}
    return array.reduce(f ? (p, d, i) => {
      o.index = i
      return p + f.call(o, d)
    } : (p, d) => {
      return p + d
    }, 0)
  },
  max(array, f) {
    return Math.max.apply(null, f ? pv.map(array, f) : array)
  }
}

/**
* Basic Javascript port of the MMCQ (modified median cut quantization)
* algorithm from the Leptonica library (http://www.leptonica.com/).
* Returns a color map you can use to map original pixels to the reduced
* palette. Still a work in progress.
*
* @author Nick Rabinowitz
* @example

// array of pixels as [R,G,B] arrays
var myPixels = [[190,197,190], [202,204,200], [207,214,210], [211,214,211], [205,207,207]
              // etc
              ];
var maxColors = 4;

var cmap = MMCQ.quantize(myPixels, maxColors);
var newPalette = cmap.palette();
var newPixels = myPixels.map(function(p) {
  return cmap.map(p);
});

*/
const MMCQ = (function () {
  // Private constants
  const sigbits = 5
  const rshift = 8 - sigbits
  const maxIterations = 1000
  const fractByPopulations = 0.75

  // Get reduced-space color index for a pixel
  function getColorIndex(r, g, b) {
    return (r << (2 * sigbits)) + (g << sigbits) + b
  }

  // Simple priority queue
  function PQueue(comparator) {
    const contents = []
    let sorted = false

    function sort() {
      contents.sort(comparator)
      sorted = true
    }

    return {
      push(o) {
        contents.push(o)
        sorted = false
      },
      peek(index) {
        if (!sorted) {
          sort()
        }

        if (index === undefined) {
          index = contents.length - 1
        }

        return contents[index]
      },
      pop() {
        if (!sorted) {
          sort()
        }

        return contents.pop()
      },
      size() {
        return contents.length
      },
      map(f) {
        return contents.map(f)
      },
      debug() {
        if (!sorted) {
          sort()
        }

        return contents
      }
    }
  }

  // 3d color space box
  function VBox(r1, r2, g1, g2, b1, b2, histo) {
    const vbox = this
    vbox.r1 = r1
    vbox.r2 = r2
    vbox.g1 = g1
    vbox.g2 = g2
    vbox.b1 = b1
    vbox.b2 = b2
    vbox.histo = histo
  }

  VBox.prototype = {
    volume(force) {
      const vbox = this
      if (!vbox._volume || force) {
        vbox._volume = ((vbox.r2 - vbox.r1 + 1) * (vbox.g2 - vbox.g1 + 1) * (vbox.b2 - vbox.b1 + 1))
      }

      return vbox._volume
    },
    count(force) {
      const vbox = this
      const {histo} = vbox
      if (!vbox._count_set || force) {
        let npix = 0
        let index
        let i
        let j
        let k
        for (i = vbox.r1; i <= vbox.r2; i++) {
          for (j = vbox.g1; j <= vbox.g2; j++) {
            for (k = vbox.b1; k <= vbox.b2; k++) {
              index = getColorIndex(i, j, k)
              npix += (histo[index] || 0)
            }
          }
        }

        vbox._count = npix
        // eslint-disable-next-line camelcase
        vbox._count_set = true
      }

      return vbox._count
    },
    copy() {
      const vbox = this
      return new VBox(vbox.r1, vbox.r2, vbox.g1, vbox.g2, vbox.b1, vbox.b2, vbox.histo)
    },
    avg(force) {
      const vbox = this
      const {histo} = vbox
      if (!vbox._avg || force) {
        let ntot = 0
        const mult = 1 << (8 - sigbits)
        let rsum = 0
        let gsum = 0
        let bsum = 0
        let hval
        let i
        let j
        let k
        let histoindex
        for (i = vbox.r1; i <= vbox.r2; i++) {
          for (j = vbox.g1; j <= vbox.g2; j++) {
            for (k = vbox.b1; k <= vbox.b2; k++) {
              histoindex = getColorIndex(i, j, k)
              hval = histo[histoindex] || 0
              ntot += hval
              rsum += (hval * (i + 0.5) * mult)
              gsum += (hval * (j + 0.5) * mult)
              bsum += (hval * (k + 0.5) * mult)
            }
          }
        }

        if (ntot) {
          vbox._avg = [~~(rsum / ntot), ~~(gsum / ntot), ~~(bsum / ntot)]
        } else {
          // Console.log('empty box');
          vbox._avg = [
            ~~(mult * (vbox.r1 + vbox.r2 + 1) / 2),
            ~~(mult * (vbox.g1 + vbox.g2 + 1) / 2),
            ~~(mult * (vbox.b1 + vbox.b2 + 1) / 2)
          ]
        }
      }

      return vbox._avg
    },
    contains(pixel) {
      const vbox = this
      const rval = pixel[0] >> rshift
      const gval = pixel[1] >> rshift
      const bval = pixel[2] >> rshift
      return (rval >= vbox.r1 && rval <= vbox.r2 &&
                  gval >= vbox.g1 && gval <= vbox.g2 &&
                  bval >= vbox.b1 && bval <= vbox.b2)
    }
  }

  // Color map
  function CMap() {
    this.vboxes = new PQueue(((a, b) => {
      return pv.naturalOrder(
        a.vbox.count() * a.vbox.volume(),
        b.vbox.count() * b.vbox.volume()
      )
    }))
  }

  CMap.prototype = {
    push(vbox) {
      this.vboxes.push({
        vbox,
        color: vbox.avg()
      })
    },
    palette() {
      return this.vboxes.map(vb => {
        return vb.color
      })
    },
    size() {
      return this.vboxes.size()
    },
    map(color) {
      const {vboxes} = this
      for (let i = 0; i < vboxes.size(); i++) {
        if (vboxes.peek(i).vbox.contains(color)) {
          return vboxes.peek(i).color
        }
      }

      return this.nearest(color)
    },
    nearest(color) {
      const {vboxes} = this
      let d1
      let d2
      let pColor
      for (let i = 0; i < vboxes.size(); i++) {
        d2 = Math.sqrt(
          color[0] - (vboxes.peek(i).color[0] ** 2) +
          color[1] - (vboxes.peek(i).color[1] ** 2) +
          color[2] - (vboxes.peek(i).color[2] ** 2)
        )
        if (d2 < d1 || d1 === undefined) {
          d1 = d2
          pColor = vboxes.peek(i).color
        }
      }

      return pColor
    },
    forcebw() {
      /// XXX: won't work yet
      const {vboxes} = this
      vboxes.sort((a, b) => {
        return pv.naturalOrder(pv.sum(a.color), pv.sum(b.color))
      })

      // Force darkest color to black if everything < 5
      const lowest = vboxes[0].color
      if (lowest[0] < 5 && lowest[1] < 5 && lowest[2] < 5) {
        vboxes[0].color = [0, 0, 0]
      }

      // Force lightest color to white if everything > 251
      const idx = vboxes.length - 1
      const highest = vboxes[idx].color
      if (highest[0] > 251 && highest[1] > 251 && highest[2] > 251) {
        vboxes[idx].color = [255, 255, 255]
      }
    }
  }

  // Histo (1-d array, giving the number of pixels in
  // each quantized region of color space), or null on error
  function getHisto(pixels) {
    const histosize = 1 << (3 * sigbits)
    const histo = new Array(histosize)
    let index
    let rval
    let gval
    let bval
    pixels.forEach(pixel => {
      rval = pixel[0] >> rshift
      gval = pixel[1] >> rshift
      bval = pixel[2] >> rshift
      index = getColorIndex(rval, gval, bval)
      histo[index] = (histo[index] || 0) + 1
    })
    return histo
  }

  function vboxFromPixels(pixels, histo) {
    let rmin = 1000000
    let rmax = 0
    let gmin = 1000000
    let gmax = 0
    let bmin = 1000000
    let bmax = 0
    let rval
    let gval
    let bval
    // Find min/max
    pixels.forEach(pixel => {
      rval = pixel[0] >> rshift
      gval = pixel[1] >> rshift
      bval = pixel[2] >> rshift
      if (rval < rmin) {
        rmin = rval
      } else if (rval > rmax) {
        rmax = rval
      }

      if (gval < gmin) {
        gmin = gval
      } else if (gval > gmax) {
        gmax = gval
      }

      if (bval < bmin) {
        bmin = bval
      } else if (bval > bmax) {
        bmax = bval
      }
    })
    return new VBox(rmin, rmax, gmin, gmax, bmin, bmax, histo)
  }

  function medianCutApply(histo, vbox) {
    if (!vbox.count()) {
      return
    }

    const rw = vbox.r2 - vbox.r1 + 1
    const gw = vbox.g2 - vbox.g1 + 1
    const bw = vbox.b2 - vbox.b1 + 1
    const maxw = pv.max([rw, gw, bw])
    // Only one pixel, no split
    if (vbox.count() === 1) {
      return [vbox.copy()]
    }

    /* Find the partial sum arrays along the selected axis. */
    let total = 0
    const partialsum = []
    const lookaheadsum = []
    let i
    let j
    let k
    let sum
    let index
    if (maxw === rw) {
      for (i = vbox.r1; i <= vbox.r2; i++) {
        sum = 0
        for (j = vbox.g1; j <= vbox.g2; j++) {
          for (k = vbox.b1; k <= vbox.b2; k++) {
            index = getColorIndex(i, j, k)
            sum += (histo[index] || 0)
          }
        }

        total += sum
        partialsum[i] = total
      }
    } else if (maxw === gw) {
      for (i = vbox.g1; i <= vbox.g2; i++) {
        sum = 0
        for (j = vbox.r1; j <= vbox.r2; j++) {
          for (k = vbox.b1; k <= vbox.b2; k++) {
            index = getColorIndex(j, i, k)
            sum += (histo[index] || 0)
          }
        }

        total += sum
        partialsum[i] = total
      }
    } else { /* Maxw === bw */
      for (i = vbox.b1; i <= vbox.b2; i++) {
        sum = 0
        for (j = vbox.r1; j <= vbox.r2; j++) {
          for (k = vbox.g1; k <= vbox.g2; k++) {
            index = getColorIndex(j, k, i)
            sum += (histo[index] || 0)
          }
        }

        total += sum
        partialsum[i] = total
      }
    }

    partialsum.forEach((d, i) => {
      lookaheadsum[i] = total - d
    })
    function doCut(color) {
      const dim1 = color + '1'
      const dim2 = color + '2'
      let left
      let right
      let vbox1
      let vbox2
      let d2
      let count2 = 0
      for (i = vbox[dim1]; i <= vbox[dim2]; i++) {
        if (partialsum[i] > total / 2) {
          vbox1 = vbox.copy()
          vbox2 = vbox.copy()
          left = i - vbox[dim1]
          right = vbox[dim2] - i
          if (left <= right) {
            d2 = Math.min(vbox[dim2] - 1, ~~(i + (right / 2)))
          } else {
            d2 = Math.max(vbox[dim1], ~~(i - 1 - (left / 2)))
          }

          // Avoid 0-count boxes
          while (!partialsum[d2]) {
            d2++
          }

          count2 = lookaheadsum[d2]
          while (!count2 && partialsum[d2 - 1]) {
            count2 = lookaheadsum[--d2]
          }

          // Set dimensions
          vbox1[dim2] = d2
          vbox2[dim1] = vbox1[dim2] + 1
          //                    Console.log('vbox counts:', vbox.count(), vbox1.count(), vbox2.count());
          return [vbox1, vbox2]
        }
      }
    }

    // Determine the cut planes
    return maxw === rw ? doCut('r') :
      maxw === gw ? doCut('g') :
        doCut('b')
  }

  function quantize(pixels, maxcolors) {
    // Short-circuit
    if (pixels.length === 0 || maxcolors < 2 || maxcolors > 256) {
      /// console.log('wrong number of maxcolors');
      return false
    }

    /// XXX: check color content and convert to grayscale if insufficient

    const histo = getHisto(pixels)
    // Histosize = 1 << (3 * sigbits);

    // check that we aren't below maxcolors already
    let nColors = 0
    histo.forEach(() => {
      nColors++
    })
    if (nColors <= maxcolors) {
      /// XXX: generate the new colors from the histo and return
    }

    // Get the beginning vbox from the colors
    const vbox = vboxFromPixels(pixels, histo)
    const pq = new PQueue(((a, b) => {
      return pv.naturalOrder(a.count(), b.count())
    }))
    pq.push(vbox)

    // Inner function to do the iteration
    function iter(lh, target) {
      let ncolors = 1
      let niters = 0
      let vbox
      while (niters < maxIterations) {
        vbox = lh.pop()
        if (!vbox.count()) { /* Just put it back */
          lh.push(vbox)
          niters++
          continue
        }

        // Do the cut
        const vboxes = medianCutApply(histo, vbox)
        const vbox1 = vboxes[0]
        const vbox2 = vboxes[1]

        if (!vbox1) {
          //                  Console.log("vbox1 not defined; shouldn't happen!");
          return
        }

        lh.push(vbox1)
        if (vbox2) { /* Vbox2 can be null */
          lh.push(vbox2)
          ncolors++
        }

        if (ncolors >= target) {
          return
        }

        if (niters++ > maxIterations) {
          //                    Console.log("infinite loop; perhaps too few pixels!");
          return
        }
      }
    }

    // First set of colors, sorted by population
    iter(pq, fractByPopulations * maxcolors)

    // Re-sort by the product of pixel occupancy times the size in color space.
    const pq2 = new PQueue(((a, b) => {
      return pv.naturalOrder(a.count() * a.volume(), b.count() * b.volume())
    }))
    while (pq.size()) {
      pq2.push(pq.pop())
    }

    // Next set - generate the median cuts using the (npix * vol) sorting.
    iter(pq2, maxcolors - pq2.size())

    // Calculate the actual colors
    const cmap = new CMap()
    while (pq2.size()) {
      cmap.push(pq2.pop())
    }

    return cmap
  }

  return {
    quantize
  }
})()
