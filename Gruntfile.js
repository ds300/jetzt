/*global module:false*/
module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
      banner: '/*! jetzt '
        + '<%= grunt.template.today("yyyy-mm-dd") %>\n'
        + '* https://github.com/ds300/jetzt/\n'
        + '* Copyright (c) <%= grunt.template.today("yyyy") %> '
        + 'David Sheldrick and contributors; Licensed Apache 2.0 */\n'
    // Task configuration.
    , concat: {
          options: {
              banner: '<%= banner %>'
            , stripBanners: true
          }
        , 'jetzt-solid.js' : [
              "modules/preamble.js"
            , "modules/helpers.js"
            , "modules/config.js"
            , "modules/parse.js"
            , "modules/exec.js"
            , "modules/view.js"
            , "modules/select.js"
            , "modules/control.js"
            , "modules/init.js"
          ]
      }

    , uglify: {
          options: {
            banner: '<%= banner %>'
          }       
        , 'jetzt-solid.min.js' : 'jetzt-solid.js'
    }
  });

  // These plugins provide necessary tasks.
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  
  // Default task.
  grunt.registerTask('default', ['concat', 'uglify']);

};
