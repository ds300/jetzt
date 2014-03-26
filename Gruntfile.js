/*global module:false*/
module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    banner: '/*! jetzt '
      + '<%= grunt.template.today("yyyy-mm-dd") %>\n'
      + '* https://ds300.github.io/jetzt/\n'
      + '* Copyright (c) <%= grunt.template.today("yyyy") %> '
      + 'jetzt contributors; Licensed Apache 2.0 */\n'
    // Task configuration.
    , coffee: {
      options: {
        sourceMap: true,
        sourceMapDir: 'build/maps/' // source map files will be created here
      },
      dynamic_mappings: {
        files: [
          {
            expand: true,     // Enable dynamic expansion.
            cwd: 'src/',      // Src matches are relative to this path.
            src: ['*.coffee'], // Actual pattern(s) to match.
            dest: 'build/',   // Destination path prefix.
            ext: '.js'   // Dest filepaths will have this extension.
          }
        ],
      }
    }
    , concat: {
      options: {
        banner: '<%= banner %>'
        , stripBanners: true
      }
      , 'jetzt-solid.js' : [
            "build/preamble.js"
          , "build/helpers.js"
          , "build/config.js"
          , "build/parse.js"
          , "build/exec.js"
          , "build/view.js"
          , "build/select.js"
          , "build/control.js"
          , "build/init.js"
        ]
      }
    , uglify: {
      options: {
        banner: '<%= banner %>'
      }       
      , 'jetzt-solid.min.js' : 'jetzt-solid.js'
    }
    , watch: {
      files: ["src/**"]
      , tasks: ["coffee", "concat", "uglify"]
    }



  });

  // These plugins provide necessary tasks.
  grunt.loadNpmTasks('grunt-contrib-coffee');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-watch');
  
  // Default task.
  grunt.registerTask('default', ['coffee', 'concat', 'uglify', 'watch']);

};
