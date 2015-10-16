module.exports = function (grunt) {
	grunt.initConfig({
		babel: {
			build: {
				files: {
					'data/js/panel.js': 'data/jsx/panel.js'
				}
			}
		},
		clean: {
			build: [
				'xpi/resources/googleredesigned/data/jsx'
			],
			xpi: ['googleredesigned.xpi'],
			xpidir: ['xpi']
		},
		shell: {
			run: {
				command: 'jpm run'
			}
		},
		unzip: {
			'./xpi': './googleredesigned.xpi'
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
		'unzip',
		'clean:xpi',
		'clean:build',
		'zip',
		'clean:xpidir'
	]);

	// Load plugins
	grunt.loadNpmTasks('grunt-babel');
	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-shell');
	grunt.loadNpmTasks('grunt-zip');
};
