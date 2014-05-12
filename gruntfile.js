module.exports = function (grunt){
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    jsdoc : {
        dist : {
            src: ['./lib/*.js'],
            jsdoc: './node_modules/.bin/jsdoc',
            options: {
                destination: 'doc',
                configure: './node_modules/jsdoc/conf.json',
                template: './node_modules/ink-docstrap/template'
            }
        }
    },
    jshint: {
      files: ['lib/killroy.js'],
      options: {
        globals: {
          console: true,
          module: true
        }
      }
    }
  });
  grunt.loadNpmTasks('grunt-jsdoc');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.registerTask('default', ['jsdoc', 'jshint']);
};