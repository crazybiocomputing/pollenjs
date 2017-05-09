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
 * Jean-Christophe Taveau
 * Rudy Anne
 */

/**
 * DoG: Difference of Gaussian
 */
function DoG(imp,sig1,sig2) {
  var imp1 = imp.duplicate();
  var imp2 = imp.duplicate();
  IJ.run(imp1, "Gaussian Blur...", "sigma=" + sig1);
  IJ.run(imp2, "Gaussian Blur...", "sigma=" + sig2);
  var ic = new ImageCalculator();
  var imp3 = ic.run("Subtract create", imp0, imp2);
  // Clean up imageplus
  imp1.close();
  imp2.close();
  // return 
  return imp3;
}

//Parameters
var path= '';
var size=120.0;
var sig1 =16.0;
var sig2 = 18.0;
var threshold =130;
var imp;

// Select file window
var od =new OpenDialog("Choose a file", null);
var folder = od.getDirectory();
var file = od.getFileName();
var path = folder + file;

// 0-Dialog
var gd=new GenericDialog("Pollen Params");
gd.addNumericField("Sigma 1:", 25, 1);
gd.addNumericField("sigma 2:", 21, 2);
// Tolerance or Threshold
// Particle size,
// 
// etc.
gd.showDialog();

sig1=gd.getNextNumber();
sig2=gd.getNextNumber();

// 1- DoG

imp = IJ.openImage(path);
var imp3 = DoG(imp,sig1,sig2);

// 2- Find Maxima
var tolerance = 10; 
var excludeOnEdges = false;
var outputType=4;//list x, y of maxima in the Results table
var ip3= imp3.getProcessor();
var mf = new MaximumFinder();
ip3= mf.findMaxima(ip3, tolerance, outputType, excludeOnEdges);


// 3- Picking

var out = IJ.createImage("Gallery", "8-bit black", size, size, 1);
var half = size/2.0;
var results = ResultsTable.getResultsTable();

var x = results.getColumn(results.getColumnIndex('X'));
var y = results.getColumn(results.getColumnIndex('Y'));
//var d = results.getColumn(results.getColumnIndex('Diameter'));

IJ.log('\\Clear');
for(var i = 0;i < x.length; i++){
  // Remove outliers

  // Extract
  IJ.log(x[i]+' '+y[i]);
  imp0.setRoi(new Roi(1.0*x[i]-half,1.0*y[i]-half,size,size) );
  IJ.run(imp0, "Copy", "");

  IJ.run(out, "Paste", "");  
  IJ.run(out, "Add Slice", "");
}
out.show();

// 4- Classification
