module.exports = function (grunt) {
	grunt.initConfig({
		babel: {
			build: {
				files: {
					'data/js/panel.js': 'data/jsx/panel.js'
				}
			}
		},
		rename: {
			prebuild: {
				files: [{
					src: 'node_modules',
					dest: '.node_modules'
				}]
			},
			postbuild: {
				files: [{
					src: '.node_modules',
					dest: 'node_modules'
				}]
			}
		},
		shell: {
			run: {
				command: 'jpm run -b "C:\\Program Files\\Mozilla Firefox\\firefox.exe"'
			},
			build: {
				command: 'jpm xpi'
			}
		},
		watch: {
			scripts: {
				files: [
					'index.js',
					'package.json',
					'data/css/*.css',
					'data/jsx/*.js',
					'lib/**/*'
				],
				tasks: ['babel', 'shell:run'],
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
	grunt.registerTask('dev', ['babel', 'shell:run', 'watch']);
	grunt.registerTask('build', [
		'babel',
		'rename:prebuild',
		'shell:build',
		'rename:postbuild'
	]);

	// Load plugins
	grunt.loadNpmTasks('grunt-babel');
	grunt.loadNpmTasks('grunt-contrib-rename');
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-shell');
};
