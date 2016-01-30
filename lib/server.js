const config		= require("./config").config,
	_				= require("sdk/l10n").get,
	file			= require("sdk/io/file"),
	path			= require("sdk/fs/path"),
	Request			= require("sdk/request").Request,
	sp				= require("sdk/simple-prefs"),
	ss				= require("sdk/simple-storage");

exports.server = function (options) {

	const GR_EVENTS = options.GR_EVENTS;

	return {
		/**
		 * Given a Request response object, returns an error object (or null if there are no errors)
		 * @method _getError
		 * @memberof server
		 * @param	{object}		response	- A response from the Request object
		 * @returns {Error|null} Error object or null
		 */
		_getError: function (response) {
			let err;
			switch (response.status) {
			case 200:
				err = null;
				break;
			case 403:
				err = _("error_403");
				break;
			case 404:
				err = _("error_404");
				break;
			case 408:
				err = _("error_404");
				break;
			case 504:
				err = _("error_504");
				break;
			default:
				err = _("error_server_unexpected", this.responseText);
				break;
			}

			return err ? new Error(err) : null;
		},

		/**
		 * Empties the local manifest cache
		 * @method clearManifest
		 * @memberof server
		 */
		clearManifest: function () {
			ss.storage.manifest = null;
		},

		/**
		 * Compare two manifest JSON objects to see which styles need updating
		 * @method _compareVersions
		 * @memberof server
		 * @param	{object}	previous		- Old manifest
		 * @param	{object}	current			- New manifest
		 * @returns {object} Diff object
		 */
		_compareVersions: function (previous, current) {
			previous = previous || [];
			current = current || [];

			const diff = {};
			const mode = sp.prefs.dev ? "dev" : "stable";

			previous.forEach(function (item) {
				Object.keys(item).forEach(function (name) {
					if (name === 'images') return;
					diff[name] = item[name];
				});
			});

			current.forEach(function (item) {
				Object.keys(item).forEach(function (name) {
					if (name === 'images') return;

					// In dev mode -- always re-download styles (even if the versions are the same)
					if (diff[name] && diff[name][mode] === item[name][mode] && mode === 'stable') {
						delete diff[name];
					} else {
						diff[name] = item[name];
					}
				});
			});

			return diff;
		},

		/**
		 * Download the latest JSON manifest file from the server
		 * @method downloadManifeset
		 * @memberof server
		 * @returns {Promise} Promise object
		 */
		downloadManifest: function () {
			return new Promise(function (resolve, reject) {
				const jsontime = new Date().toJSON().replace(/[A-Z\-:\.]/g, "");
				const url = config.manifest_url + "?rel=firefox&amp;time=" + jsontime;

				new Request({
					url: url,
					onComplete: function (response) {
						// Check for errors
						const err = this._getError(response);
						if (err) return reject(err);

						// Check for invalid JSON
						if (!response.json) {
							return reject(new Error(_("error_server_nonjson", response.text)));
						}

						// Add some helpful keys to the manifest object
						const result = response.json.map(function (style) {
							Object.keys(style, function (key) {
								style[key]._name = key;
							});
							return style;
						});

						// Check to see if any styles have updated, if the have -- download them
						const diff = this._compareVersions(ss.storage.manifest, result);

						if (Object.keys(diff).length) this.downloadStyles(diff);

						// Save manifest to simple-storage
						ss.storage.manifest = result;

						// Make sure every style has prefs
						this.ensurePrefs(ss.storage.manifest);

						resolve();
					}.bind(this)
				}).post();
			}.bind(this));
		},

		/**
		 * Downloads CSS style files in a single Promise operation
		 * @method downloadStyles
		 * @memberof server
		 * @param	{object}	styles		- An object of styles and versions to download
		 * @returns {Promise} Promise object
		 */
		downloadStyles: function (styles) {
			return Promise.all(Object.keys(styles).map(function (style) {
				return new Promise(function (resolve, reject) {
					return this.downloadStyle(styles[style])
						.then(resolve, function (data) {
							// Call a download error event for each style failure
							GR_EVENTS.emit("GR_DOWNLOAD_ERROR", data);
							reject();
						});
				}.bind(this));
			}.bind(this))).then(function () {
				GR_EVENTS.emit("GR_DOWNLOAD_CHANGED");
			});
		},

		/**
		 * Downloads a single CSS style file
		 * @method downloadStyle
		 * @memberof server
		 * @param	{object}	style		- A style manifest object to download
		 * @returns {Promise} Promise object
		 */
		downloadStyle: function (style) {
			return new Promise(function (resolve, reject) {

				// First, let's make sure target directory exists
				file.mkpath(config.extension_dir);

				const mode = sp.prefs.dev ? "dev" : "stable";
				const filename = [style.css, '_', style[mode], '.css'].join('');
				const baseurl = mode === "dev" ? style.dev_url : style.url;
				const url = [baseurl, filename].join('');
				const target = path.join(config.extension_dir, style.css + '.css');

				// Download the CSS file as text
				try {
					new Request({
						url: url,
						onComplete: function (response) {
							// Check for errors
							const err = this._getError(response);
							if (err) {
								return reject({
									error: {
										message: err.message
									},
									style: style
								});
							}

							// Save CSS to file
							const writer = file.open(target, 'w');
							writer.write(response.text);
							writer.close();

							// For good measure, let's confirm that the file was actually downloaded
							if (!file.exists(target)) {
								return reject({
									error: {
										message: _("error_file_unsaved")
									},
									style: style
								});
							}

							resolve({
								style: style
							});
						}.bind(this)
					}).get();
				} catch (err) {
					return reject({
						error: {
							message: err.message
						},
						style: style
					});
				}
			}.bind(this));
		},

		/**
		 * Ensures that all styles defined in the manifest have a style
		 * preference defined.
		 * @method ensurePrefs
		 * @memberof server
		 * @param	{object}	manifest		- Manifest to create prefs for
		 */
		ensurePrefs: function (manifest) {
			manifest.forEach(function (style) {
				Object.keys(style).forEach(function (name) {
					if (name === 'images') return;

					if (!ss.storage.styles) ss.storage.styles = {};
					if (!ss.storage.styles[name]) {
						ss.storage.styles[name] = {
							disabled: false
						};
					}
				});
			});
		}
	};
};
