module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    bower: {
      install: {
        options: {
          install: true,
          copy: false
        }
      }
    },
    copy: {
      themes: {
        files: [
          {
            expand: true,
            cwd: 'bower_components/highlight.js/src/styles',
            src: ['*.css'],
            dest: 'css'
          }
        ]
      }
    }
  });

  grunt.loadNpmTasks('grunt-bower-task');
  grunt.loadNpmTasks('grunt-contrib-copy');

  grunt.registerTask('default', ['bower', 'copy']);
};
