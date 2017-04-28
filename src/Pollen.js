//Parameters
var path= '';
var size=120.0;
var sig1 =16.0;
var sig2 = 18.0;
var threshold =130;

var imp = IJ.getImage();

// 1- DoG

// 2- Find Maxima

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
  imp.setRoi(new Roi(1.0*x[i]-half,1.0*y[i]-half,size,size) );
  IJ.run(imp, "Copy", "");

  IJ.run(out, "Paste", "");  
  IJ.run(out, "Add Slice", "");
}
out.show();