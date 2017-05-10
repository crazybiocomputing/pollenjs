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
 
 
 var tools = {};

/**
 * Dialog Window for various settings
 *
 */
 
tools.GUI = function () {

  var predefined = {
    "Colza" : {
      size :120.0,
      sig1 : 16.0,
      sig2 : 18.0,
      threshold  :100
    },
    "Peach" : {
    
    },
    "Strawberry": {
    
    },
    "Tomato" : {
    
    }
  };
  
  
  var settings = {};
  // Select file window
  var od =new OpenDialog("Choose a file", null);
  var folder = od.getDirectory();
  settings.extension = od.getFileName().split('.').pop();
  settings.path = folder;
  var dir = new java.io.File(folder);
  var files = dir.listFiles(); 
  settings.filenames = [];
  for (var i = 0; i < files.length; i++) {
    settings.filenames.push(files[i].toString());
  }
  settings.filenames.sort();
  
  var size=120.0;
  var sig1 =16.0;
  var sig2 = 18.0;
  var threshold =100;

  var gd=new GenericDialog("Pollen Params");
  gd.addChoice("Predefined", ["Custom..","Colza","Peach","Strawberry","Tomato"],"Custom...");
  gd.addNumericField("Particle Size:", size, 1);
  gd.addNumericField("Sigma1:", sig1, 2);
  gd.addNumericField("Sigma2:", sig2, 3);
  gd.addNumericField("Threshold", threshold, 4);

  // Tolerance or Threshold
  // Particle size,
  // 
  // etc.
  gd.showDialog();

  if (gd.wasCanceled()) {
    return undefined;
  }
  else {
    settings.type = gd.getNextChoice();
    settings.size = gd.getNextNumber();
    settings.sig1 = gd.getNextNumber();
    settings.sig2 = gd.getNextNumber();
    settings.threshold = gd.getNextNumber();
  }


  return settings;
}

/**
 * DoG: Difference of Gaussian
 */
tools.DoG = function(imp,sig1,sig2) {
  var copy = imp.duplicate();
  copy.getProcessor().invert();
  var imp1 = copy.duplicate(); imp1.setTitle("sigma 1");
  var imp2 = copy.duplicate(); imp2.setTitle("sigma 2");
  IJ.run(imp1, "Gaussian Blur...", "sigma=" + sig1);
  IJ.run(imp2, "Gaussian Blur...", "sigma=" + sig2);
  var ic = new ImageCalculator();
  var dog = ic.run("Subtract create", imp1, imp2);
  IJ.run(dog, "Enhance Contrast...", "saturated=0.0 normalize");
  dog.setTitle("DoG");
  // Clean up imageplus
  imp1.close();
  imp2.close();
  // return 
  if (DEBUG) {
    dog.show();
  }
  return dog;
}

/**
 * Find Particles from DoG filtered image
 *
 */
tools.findParticles = function(imageplus,threshold) {
  // Reset Results window
  // ResultsTable.getResultsTable().reset();

  var excludeOnEdges = false;
  // var outputType=4; //list x, y of maxima in the Results table
  var ip= imageplus.getProcessor();
  var mf = new MaximumFinder();
  // ip3= mf.findMaxima(ip, threshold, outputType, excludeOnEdges);
  return polygon = mf.getMaxima(ip, threshold, excludeOnEdges);
}

/**
 * Pick and Extract Particles
 *
 */
tools.pickParticles = function(org,coords,src,out) {
  var results = ResultsTable.getResultsTable();

  var x = coords.xpoints;
  var y = coords.ypoints;
  //var d = results.getColumn(results.getColumnIndex('Diameter'));

  var half = settings.size/2.0;

  for(var i = 0;i < x.length; i++){
    // Remove outliers
    if (x[i] - half >= 0.0 && x[i] + half < org.width && y[i] - half >= 0.0 && y[i] + half < org.height) {
        // Extract
        particles.push({x: x[i], y: y[i], box: settings.size, source: src});
        org.setRoi(new Roi(1.0*x[i]-half,1.0*y[i]-half,settings.size,settings.size) );
        var tmp = org.duplicate();
        out.getImageStack().addSlice(tmp.getProcessor());
        // out.updateImage();
    }
  }
}





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
