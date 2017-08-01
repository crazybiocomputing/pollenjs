/*
 *  pollenjs: A pollen classifier plugin for ImageJ
 *  Copyright (C) 2017  Jean-Christophe Taveau.
 *
 *  This file is part of pollenjs
 *
 * This program is free software: you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with pollenjs.  If not, see <http://www.gnu.org/licenses/>.
 *
 *
 * Authors:
 * Rudy Anne
 * Jean-Christophe Taveau
 */
 
var HT2D = {};

HT2D.gradient = function(imp) {

    // DX Gradient with Sobel Operator
    var impDX = imp.duplicate();
    IJ.run(impDX, "32-bit", "");
    IJ.run(impDX, "Enhance Contrast...", "saturated=0 normalize process_all use");
    IJ.run(impDX, "Convolve...", "text1=[1 0 -1\n2 0 -2\n1 0 -1\n]  stack");
    // IJ.run(impDX, "Enhance Contrast...", "saturated=0 normalize process_all");



    // DY Gradient with Sobel Operator
    var impDY = imp.duplicate();
    IJ.run(impDY, "32-bit", "");
    IJ.run(impDY, "Enhance Contrast...", "saturated=0 normalize process_all use");
    IJ.run(impDY, "Convolve...", "text1=[1 2 1\n0 0 0\n-1 -2 -1\n]  stack");
    // IJ.run(impDY, "Enhance Contrast...", "saturated=0 normalize process_all");

    
   
    IJ.run(impDY, "8-bit", "");
    IJ.run(impDX, "8-bit", "");
    // Create RGB stack corresponding to a DX-DY-DZ Gradient stack
    var stack = RGBStackMerge.mergeStacks(impDX.getImageStack(),impDY.getImageStack(),impDX.getImageStack(), true);
    return new ImagePlus("gradient2D",stack);
}


HT2D.transform = function(edge,gradient,minRad,maxRad) {

    //
    // F U N C T I O N S
    //
    function addLine(x0,y0,dx, dy, min_radius, max_radius) {
      for (var k = 0; k<2; k++) {
        var x1 = x0 + min_radius * dx;
        var y1 = y0 + min_radius * dy;
        for (var r = min_radius; r <= max_radius; x1 += dx, y1 +=dy, r++) {
          var xx = Math.round(x1/accuCellSize) + maxRad;
          var yy = Math.round(y1/accuCellSize) + maxRad;
          accuip.setf(xx, yy, accuip.getf(xx, yy) +1.0);
        }
        dx = -dx; dy = -dy;
      }
    }


    var ip = edge.getProcessor();
    var w = edge.getWidth();
    var h = edge.getHeight();
    var accuCellSize = 1.0


    // 2D gradient image
    var dxyz = gradient.getProcessor();

    // Create accumulator
    var accu = IJ.createImage("Accumulator", "32-bit Black", w/accuCellSize + 2 * maxRad, h/accuCellSize + 2 * maxRad,1);
    var accuip = accu.getProcessor();

    for (var y=0; y<h; y++) {
      // if (y%10==0) IJ.log("Row # "+y);
      for (var x=0; x<w; x++) {
        if ( ip.get(x,y) != 0) {
          vx = parseFloat((dxyz.get(x,y) >> 16) & 0xff) - 128.0;
          vy = parseFloat((dxyz.get(x,y) >> 8) & 0xff ) - 128.0;
          vz = Math.sqrt(parseFloat( dxyz.get(x,y) & 0xff) - 128.0);
          mag = Math.sqrt(vx * vx + vy * vy);
          if (mag != 0) {
            sx = vx / mag;
            sy = vy / mag;
            // IJ.log(x +  " " + y + ": " + ip.get(x,y) + "->" + (dxyz.getPixel(x,y) & 0xffffff).toString(16) + "> " + vx + " " + vy + "[" + mag + "] = " +  sx + " "+ sy);
            addLine(x,y,sx,sy,minRad,maxRad);
          }
        }
      }
    }

    IJ.run(accu, "Canvas Size...", "width="+(w/accuCellSize)+" height="+(h/accuCellSize)+" position=Center zero");
    IJ.run(accu, "Enhance Contrast...", "saturated=0 normalize");
    
    return accu;

};

HT2D.threshold = function(accu,value) {
    var threshold = value || 0.25;
    
    var accuip = accu.getProcessor();
    var stats = accuip.getStatistics();
    print("stats " + stats );

    tolerance = threshold * (stats.max - stats.min) + stats.min; 
    excludeOnEdges = true;
    mf = new MaximumFinder();
    maxima = mf.getMaxima(accuip, tolerance, excludeOnEdges);
    print("count="+maxima.npoints);
};


// Test 
// From image:
// Pollen Rudy/X3.2/17-07-04 pollen tomate  test Blanche 32 LED exposure 250 X3.2.jpg");
//

var imp = IJ.getImage();
// Step#1: Extract channels and keep green channel
var channels = ChannelSplitter.split(imp);
var green = channels[1]; // Green channel

// Step #2: Subtract background
IJ.run(green, "Subtract Background...", "rolling=20");

// Step #3: Edge Detection and Cleaning (threshold)
IJ.run(green, "Find Edges", "");
Prefs.blackBackground = true;
IJ.setAutoThreshold(green, "Minimum");
IJ.run(green, "Convert to Mask", "");
IJ.run(green, "Invert", "");
IJ.run(green, "Invert LUT", "");

// Step #4: Hough transform
var gradient2D = HT2D.gradient(green);
var accumulator = HT2D.transform(green,gradient2D, 6,10);
// Only for testing - gradient2D.show();
accumulator.show();

IJ.run(accumulator, "Find Maxima...", "noise=0.25 output=[Point Selection]");



