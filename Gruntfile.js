/*global module:false*/
module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    banner: '/*! jetzt ' +
      '<%= grunt.template.today("yyyy-mm-dd") %>\n' +
      '* https://github.com/ds300/jetzt/\n' +
      '* Copyright (c) <%= grunt.template.today("yyyy") %> ' +
      'jetzt contributors; Licensed Apache 2.0 */\n',
    // Task configuration.
    concat: {
      options: {
        banner: '<%= banner %>',
        stripBanners: true
      },
         'jetzt-solid.js' : ["modules/config.js","modules/control.js","modules/helpers.js","modules/parsing.js","modules/running.js","modules/selectmode.js","modules/state.js","modules/view.js",
             "jetzt.js", "localstorage-config.js"],
        
      },
    uglify: {
      options: {
        banner: '<%= banner %>'
      },        
        'jetzt-solid.min.js' : 'jetzt-solid.js'
    }
  });

  // These plugins provide necessary tasks.
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  
  // Default task.
  grunt.registerTask('default', ['concat', 'uglify']);

};
