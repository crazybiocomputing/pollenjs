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
  IJ.showMessage("Script canceled");
  throw "End of Script";
}

// 0- Create Particles stack
var gallery = new ImagePlus("Gallery", ImageStack.create(settings.size, settings.size,1,8));
  
//**************** M A I N   L O O P ****************/

for (var i in settings.filenames) {
  var filename = settings.filenames[i].toString();
  // IJ.log('Image#'+i+ ': '+ filename + '===?' + settings.extension);
  if (filename.split('.').pop() === settings.extension) {

    IJ.log(filename);
    var imp = IJ.openImage(filename);
    IJ.run(imp, "8-bit", "");
    
    // 1- DoG
    var imp3 = tools.DoG(imp,settings.sig1,settings.sig2);

    // 2- Find Maxima
    var coords = tools.findParticles(imp3,settings.threshold);

    // 3- Picking and Particles Extraction
    tools.pickParticles(imp,coords, filename, gallery);
    
    // 4- Add particles in stack
  }
}
  gallery.show();

// 4- Classification

// 5- Print Particles Coordinates

var results = new ResultsTable();
for (var i = 0; i < particles.length; i++) {
  results.incrementCounter();
  results.addValue('X',particles[i].x);
  results.addValue('Y',particles[i].y);
  results.addValue('src',particles[i].source);
}
results.showRowNumbers(true);
results.show("Coords Table");


// throw "End of Script";
