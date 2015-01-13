/*global module*/
module.exports = function (grunt) {
	'use strict';

	// Project configuration
	grunt.initConfig({
		clean: {
			build: [
				'xpi/resources/googleredesigned/data/bower_components/react/*.json',
				'xpi/resources/googleredesigned/data/bower_components/react/JSXTransformer.js',
				'xpi/resources/googleredesigned/data/bower_components/react/PATENTS',
				'xpi/resources/googleredesigned/data/bower_components/react/react.js',
				'xpi/resources/googleredesigned/data/bower_components/react/react-with*',
				'xpi/resources/googleredesigned/data/jsx'
			],
			xpi: ['googleredesigned.xpi'],
			xpidir: ['xpi']
		},
		shell: {
			build: {
				command: 'cfx xpi'	
			},
			run: {
				command: 'npm run build:jsx && cfx run'
			}
		},
		unzip: {
			'./xpi': './googleredesigned.xpi'
		},
		watch: {
			scripts: {
				files: [
					'data/css/*.css',
					'data/jsx/*.jsx',
					'lib/**/*'
				],
				tasks: ['shell:run'],
				options: {
					interrupt: true
				}
			}
		},
		zip: {
			build: {
				cwd: 'xpi/',
				src: ['xpi/**/*'],
				dest: './googleredesigned.xpi'
			}
		}
	});

	// Tasks
	grunt.registerTask('dev', ['watch']);
	grunt.registerTask('build', ['shell:build', 'unzip', 'clean:xpi', 'clean:build', 'zip', 'clean:xpidir']);

	// Load plugins
	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-shell');
	grunt.loadNpmTasks('grunt-zip');
};