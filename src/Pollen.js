//Parameters
var path= '';
var size=120.0;
var sig1 =16.0;
var sig2 = 18.0;
var threshold =130;
var imp;

// Select file window
od =new OpenDialog("Choose a file", null);
folder = od.getDirectory();
file = od.getFileName();
path = folder + file;

// 0-Dialog
gd=new GenericDialog("Choose Sigmas");
gd.addNumericField("Sigma 1:", 25, 1);
gd.addNumericField("sigma 2:", 21, 2);
gd.showDialog();

sig1=gd.getNextNumber();
sig2=gd.getNextNumber();

// 1- DoG

imp = IJ.openImage("C:\\Users\\ranne\\Desktop\\colza-8b\\pH 6.65_0.jpg");
imp0 = imp.duplicate();
imp2 = imp.duplicate();
IJ.run(imp, "Gaussian Blur...", "sigma=" + sig1);
IJ.run(imp2, "Gaussian Blur...", "sigma=" + sig2);
ic = new ImageCalculator();
imp3 = ic.run("Subtract create", imp, imp2);
imp3.show();
imp.close();
imp2.close();

// 2- Find Maxima
IJ.run(imp3, "Find Maxima...", "noise=10 output=List exclude");
imp3.close();

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