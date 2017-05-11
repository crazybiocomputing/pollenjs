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


//Parameters
var DEBUG = false;
var particles = [];




IJ.log('\\Clear');

// 00-Dialog and wait for answer

var settings = tools.GUI();

if (settings === undefined) {
  IJ.log("Script canceled");
  throw "End of Script";
}


// 0- Create Particles stack and thumbnails stack if asked
var gallery = new ImagePlus("Gallery", ImageStack.create(settings.size, settings.size,1,8));
var stack;
var last = 0; // Last particle index

//**************** M A I N   L O O P ****************/

var start_time = new Date();

for (var i in settings.filenames) {
  
  var filename = settings.filenames[i].toString();
  // IJ.log('Image#'+i+ ': '+ filename + '===?' + settings.extension);
  if (filename.split('.').pop() === settings.extension) {

    var image = IJ.openImage(settings.path + filename);
    var imp = image.duplicate();
    IJ.run(imp, "8-bit", "");
    IJ.run(imp, "Subtract Background...", "rolling=50"+(settings.dark ? " light": "") );
    
    // 1- DoG
    var imp3 = tools.DoG(imp,settings.sig1,settings.sig2);

    // 2- Find Maxima
    var coords = tools.findParticles(imp3,settings.threshold);

    // 3- Picking and Particles Extraction
    tools.pickParticles(imp,coords, filename, gallery);
    
    if (settings.thumb) {
        IJ.run(image, "Size...", "width="+image.getWidth()/settings.scale+" height="+image.getHeight()/settings.scale+" constrain average interpolation=None");
        if (stack === undefined) {
            stack = new ImagePlus("Thumbnails", ImageStack.create(image.getWidth(), image.getHeight(),1,24));
        }
        stack.getImageStack().addSlice(image.getProcessor());
        stack.getImageStack().setSliceLabel(filename, stack.getNSlices());
        var ip = stack.getImageStack().getProcessor(stack.getNSlices());
        ip.setColor(new java.awt.Color(255,0,255));
        var small = settings.size/settings.scale;
        for (var i= last; i < particles.length; i++) {
            ip.drawOval(particles[i].x/settings.scale - small/2.0,particles[i].y/settings.scale - small/2.0,small,small);
        }
        last = particles.length;
    }

  }
}
gallery.getImageStack().deleteSlice(1);
gallery.show();

// 4- Classification

// 5- Print Particles Coordinates

var results = new ResultsTable();
for (var i = 0; i < particles.length; i++) {
  results.incrementCounter();
  results.addValue('X',particles[i].x);
  results.addValue('Y',particles[i].y);
  results.addValue('type',particles[i].type);
  results.addValue('src',particles[i].source);
}
results.showRowNumbers(true);
results.show("Coords Table");



var end_time = new Date();

IJ.log('Operation took ' + (end_time.getTime() - start_time.getTime()) + ' msec');

if (settings.thumb) {
  stack.getImageStack().deleteSlice(1);
  stack.show();
}

tools.displaySettings();

// throw "End of Script";
