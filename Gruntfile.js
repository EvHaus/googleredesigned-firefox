/*global module*/
module.exports = function (grunt) {
	'use strict';

	// Project configuration
	grunt.initConfig({
		shell: {
			build: {
				command: 'npm run build:jsx && cfx run'
			}
		},
		watch: {
			scripts: {
				files: [
					'data/css/*.css',
					'data/jsx/*.jsx',
					'lib/**/*'
				],
				tasks: ['shell'],
				options: {
					interrupt: true
				}
			}
		}
	});

	// Tasks
	grunt.registerTask('dev', ['watch']);

	// Load plugins
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-shell');
};