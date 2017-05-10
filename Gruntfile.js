module.exports = function(grunt) {
  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    uglify: {
      options: {
        banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
      },
      build: {
        src:  './<%= pkg.name %>.js',
        dest: './<%= pkg.name %>.min.js'
      }
    },
    concat: {
      build : {
        src: ['src/pollen_core.js','src/pollen_main.js'],
        dest: './<%= pkg.name %>.js'
      }
    }
});
// These plugins provide necessary tasks.
grunt.loadNpmTasks('grunt-contrib-concat');
grunt.loadNpmTasks('grunt-contrib-uglify');


// Default and other tasks.
grunt.registerTask('default',['concat','uglify']);


};
