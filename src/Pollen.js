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

function GUI() {

  var settings = {};
  // Select file window
  var od =new OpenDialog("Choose a file", null);
  var folder = od.getDirectory();
  var file = od.getFileName();
  settings.path = folder + file;

  var size=120.0;
  var sig1 =16.0;
  var sig2 = 18.0;
  var threshold =40.0;

  var gd=new GenericDialog("Pollen Params");
  gd.addNumericField("Particle Size:", size, 1);
  gd.addNumericField("Sigma1:", sig1, 2);
  gd.addNumericField("Sigma2:", sig2, 3);
  gd.addNumericField("Threshold", threshold, 4);
  // Tolerance or Threshold
  // Particle size,
  // 
  // etc.
  gd.showDialog();

  settings.size=gd.getNextNumber();
  settings.sig1=gd.getNextNumber();
  settings.sig2=gd.getNextNumber();
  settings.threshold=gd.getNextNumber();

  return settings;
}

/**
 * DoG: Difference of Gaussian
 */
function DoG(imp,sig1,sig2) {
  var copy = imp.duplicate();
  IJ.run(copy, "8-bit", "");
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

function findParticles(imageplus,threshold) {
  // Reset Results window
  ResultsTable.getResultsTable().reset();

  var excludeOnEdges = false;
  var outputType=4;//list x, y of maxima in the Results table
  var ip= imageplus.getProcessor();
  var mf = new MaximumFinder();
  ip3= mf.findMaxima(ip, threshold, outputType, excludeOnEdges);
}

//**************** M A I N ****************/

//Parameters
var DEBUG = false;


// 0-Dialog

var settings = GUI();

var imp = IJ.openImage(settings.path);


// 1- DoG
var imp3 = DoG(imp,settings.sig1,settings.sig2);

// throw "End of Script";

// 2- Find Maxima

findParticles(imp3,settings.threshold);


// 3- Picking


var results = ResultsTable.getResultsTable();

var x = results.getColumn(results.getColumnIndex('X'));
var y = results.getColumn(results.getColumnIndex('Y'));
//var d = results.getColumn(results.getColumnIndex('Diameter'));

var out = IJ.createImage("Gallery", "8-bit black", settings.size, settings.size, 1);
var half = settings.size/2.0;

IJ.log('\\Clear');
for(var i = 0;i < x.length; i++){
  // Remove outliers
  if (x[i] - half >= 0.0 && x[i] + half < imp.width && y[i] - half >= 0.0 && y[i] + half < imp.height) {
      // Extract
      IJ.log(x[i]+' '+y[i]);
      imp.setRoi(new Roi(1.0*x[i]-half,1.0*y[i]-half,settings.size,settings.size) );
      IJ.run(imp, "Copy", "");

      IJ.run(out, "Paste", "");  
      IJ.run(out, "Add Slice", "");
  }
}
out.show();

// 4- Classification


