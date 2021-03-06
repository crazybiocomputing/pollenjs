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

  function basicGUI() {
    var gd=new GenericDialog("Pollen Params");
    gd.addChoice("Predefined", ["Advanced","Colza","Peach","Strawberry","Tomato"],"Advanced");
    gd.addCheckbox("Thumbnails", true);

    gd.showDialog();

    if (gd.wasCanceled()) {
      return undefined;
    }
    else {
      settings.type  = gd.getNextChoice();
      settings.thumb = gd.getNextBoolean();
    }
    return settings;
  }

  function advancedGUI() {
  
    var size    = 100.0;
    var sig1    = 6.0;
    var sig2    = 8.0;
    var thrshld = 100;
  
    var gd=new GenericDialog("Advanced Pollen Params");
    gd.addCheckbox("Dark Pollen", true);
    gd.addCheckbox("Thumbnails", true);
    gd.addNumericField("Particle Diameter (px):", size, 1);
    gd.addNumericField("Sigma1:", sig1, 2);
    gd.addNumericField("Sigma2:", sig2, 3);
    gd.addNumericField("Threshold", thrshld, 4);
    
    gd.showDialog();

    if (gd.wasCanceled()) {
      return undefined;
    }
    else {
      settings.dark  = gd.getNextBoolean();
      settings.thumb = gd.getNextBoolean();
      settings.diameter  = gd.getNextNumber();
      settings.size  = settings.diameter * 3;
      settings.sig1  = gd.getNextNumber();
      settings.sig2  = gd.getNextNumber();
      settings.threshold = gd.getNextNumber();
    }
    return settings;
  }

  var predefined = {
    "Colza" : {
      dark :true,
      diameter :40.0,
      sig1 : 16.0,
      sig2 : 18.0,
      threshold  :100
    },
    "Peach" : {
    
    },
    "Strawberry": {
    
    },
    "Tomato" : {
      dark :false,
      diameter : 30.0,
      sig1 : 6.0,
      sig2 : 9.0,
      threshold  :80

    }
  };
  
  
  var settings = {scale: 4,size: -1};
  
  // Select file window
  var od =new OpenDialog("Choose a file", null);
  var folder = od.getDirectory();
  settings.extension = od.getFileName().split('.').pop();
  settings.path = folder;
  var dir = new java.io.File(folder);
  var files = dir.listFiles(); 
  settings.filenames = [];
  for (var i = 0; i < files.length; i++) {
    settings.filenames.push(files[i].toString().substring(folder.length));
  }
  settings.filenames.sort();
  settings.path   = folder;
  settings.folder = folder.substring(0,folder.length - 1).split('/').pop();
  

  settings = basicGUI();
  if (settings.type === 'Advanced') {
    settings = advancedGUI();
  } 
  else {
    settings.dark = predefined[settings.type].dark;
    settings.diameter = predefined[settings.type].diameter;
    settings.size = settings.diameter * 3;
    settings.sig1 = predefined[settings.type].sig1;
    settings.sig2 = predefined[settings.type].sig2;
    settings.threshold = predefined[settings.type].threshold;
  }

  return settings;
}

/**
 * DoG: Difference of Gaussian
 */
tools.DoG = function(imp,sig1,sig2) {
  var copy = imp.duplicate();
  if (settings.dark) {
    copy.getProcessor().invert();
  }
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
  return polygon = new MaximumFinder().getMaxima(imageplus.getProcessor(), threshold, false);
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
        particles.push({x: x[i], y: y[i], type: 'U', box: settings.size, source: settings.folder + '/' + src});
        org.setRoi(new Roi(1.0*x[i]-half,1.0*y[i]-half,settings.size,settings.size) );
        var tmp = org.duplicate();
        out.getImageStack().addSlice(tmp.getProcessor());
        // out.updateImage();
    }
  }
}

tools.overlaps = function(pctls) {
  for (var i in pctls) {

  }
}
tools.displaySettings = function() {
  for (var prop in settings) {
    IJ.log(prop + ': '+settings[prop]);
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
