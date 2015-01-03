"use strict";

const
	config			= require('config').config,
	EventEmitter2	= require('eventemitter2').EventEmitter2,
	srvr			= require('server').server,

	_				= require('sdk/l10n').get,
	file			= require('sdk/io/file'),
	notifications	= require('sdk/notifications'),
	pageMod			= require('sdk/page-mod'),
	panels			= require('sdk/panel'),
	path			= require('sdk/fs/path'),
	self			= require('sdk/self'),
	sp				= require('sdk/simple-prefs'),
	ss				= require('sdk/simple-storage'),
	tabs			= require('sdk/tabs'),
	ToggleButton	= require('sdk/ui/button/toggle');


// =================================================================================


// Setup custom event handler. We need this because the system events library
// seems to be highly inconsistent. Perhaps it doesn't like it when new events are triggers
// when previous events haven't stopped yet. EventEmitter2 doesn't have this limitation.
const GR_EVENTS = new EventEmitter2({
	delimiter: ":"
});

// Share event module with server module
const server = new srvr({GR_EVENTS: GR_EVENTS});

// Holds the currently active pageMods
var mods = {},
	modversions = {};


// =================================================================================


// Register the extension button
var button = ToggleButton.ToggleButton({
	id: config.id,
	label: config.title,
	icon: {
		"16": "./img/icon-16.png",
		"32": "./img/icon-32.png",
		"64": "./img/icon-64.png"
	},
	onClick: function (state) {
		if (state.checked) {
			panel.show({
				position: button
			});
		}
	}
});

// Button Menu
var panel = panels.Panel({
	contentScriptFile: [
		self.data.url("bower_components/react/react.min.js"),
		self.data.url("js/panel.js")
	],
	contentURL: self.data.url("html/panel.html"),
	onHide: function () {
		button.state('window', {checked: false});
	},
	height: 160,
	width: 200
});


// =================================================================================


/**
 * This is the data that will be sent to the Panel menu
 * @method getPanelData
 *
 * @return {object}
 */
var getPanelData = function () {
	return {
		styles: ss.storage.styles,
		locales: {
			check_for_updates:	_("check_for_updates"),
			loading:			_("loading"),
			make_a_donation:	_("make_a_donation"),
			submit_bug_report:	_("submit_bug_report")
		},
		mode: sp.prefs.dev ? "dev" : "stable",
		manifest: ss.storage.manifest
	};
};

/**
 * Call this when you need to trigger a panel redraw
 * @method syncPanel
 *
 * @param	{object}	options				- Options object
 * @param	{object}	options.error		- Error object
 * @param	{boolean}	options.updating	- Currently updating the manifest
 *
 */
var syncPanel = function (options) {
	options = options || {};

	// If the panel is currently showing - re-render it
	if (panel.isShowing) {
		panel.port.emit("show", Object.assign(getPanelData(), options));
	}
};


/**
 * Handles the loading of CSS strings from the local files.
 * @method getCSSFromFile
 *
 * @param	{object}	manifestData		- Manifest data we will be loading
 *
 * @return {string}
 */
var getCSSFromFile = function (manifestData) {
	var filepath = path.join(config.extension_dir, manifestData.css + '.css'),
		textReader = file.open(filepath, 'r'),
		css = textReader.read();
	textReader.close();
	return css;
};


/**
 * This is what attaches our custom user style to the tabs the user has open
 * in their browser.
 * @method attachCSS
 *
 * @param	{string}	style		- Name of userstyle to load
 * @param	{string}	version		- Version of the style to load
 * @param	{string}	css			- The CSS string to attach
 *
 */
var attachCSS = function (style, version, css) {
	// If already loaded -- do nothing
	if (mods[style] != null && modversions[style] === version) return;

	// NOTE: We can't use ssutils.loadStyle() here due to a mysterious
	// window SDK error coming from inside the Firefox SDK itself;
	// NOTE: We can't use contentStyleFile here either because that requires
	// the file to be local to the extension -- which in our case -- it is not.
	var mod = pageMod.PageMod({
		attachTo: ["existing", "top", "frame"],
		include: /.*google.*/,
		contentStyle: css
	});

	// Save to local store
	if (!mods[style]) mods[style] = [];
	mods[style].push(mod);
	modversions[style] = version;
};


/**
 * Enables styles according to the current preferences
 * @method enableStyles
 */
var enableStyles = function () {
	var stylemanifest,
		newVersion, oldVersion,
		disabled, upgraded,
		mode = sp.prefs.dev ? 'dev' : 'stable';

	for (var i = 0, l = ss.storage.manifest.length; i < l; i++) {
		stylemanifest = ss.storage.manifest[i];

		for (var style in stylemanifest) {
			if (style === 'images') continue;

			oldVersion = modversions[style];
			newVersion = stylemanifest[style][mode];
			upgraded = (oldVersion != null && newVersion !== oldVersion);
			disabled = !ss.storage.styles[style] || ss.storage.styles[style].disabled;

			// If style is being disabled or upgraded - remove existing page mods
			if (disabled || upgraded) {
				if (mods[style]) {
					mods[style].forEach(function (mod) {
						mod.destroy();
					});

					// Clear store
					mods[style] = null;
				}
			}

			// Register page mods
			if (!disabled) {
				attachCSS(style, newVersion, getCSSFromFile(stylemanifest[style]));
			}
		}
	}
};


/**
 * Performs a check for updates from the server
 * @method checkForUpdates
 *
 * @returns {Promise}
 */
var checkForUpdates = function () {
	syncPanel({updating: true});

	return server.downloadManifest()
		.then(function () {
			syncPanel({updating: false});
		}, function (err) {
			syncPanel({updating: false, error: err});
		});
};


// =================================================================================

var eventHandlers = {
	GR_CHECK_FOR_UPDATES: function () {
		checkForUpdates();
	},
	GR_CHECK_FOR_UPDATES_ALERT: function () {
		checkForUpdates()
			.then(function () {
				notifications.notify({
					iconURL: self.data.url("img/icon-64.png"),
					title: config.title,
					text: _("alert_up_to_date")
				});
			});
	},
	GR_DONATE: function () {
		tabs.open(config.donation_url);
	},
	GR_MODE_CHANGE: function () {
		server.clearManifest();
		eventHandlers.GR_CHECK_FOR_UPDATES();
	},
	GR_REPORT_BUG: function () {
		tabs.open(config.bug_url);
	},
	GR_TOGGLE_STYLE: function (data) {
		ss.storage.styles[data.style].disabled = !ss.storage.styles[data.style].disabled;
		syncPanel();
		enableStyles();
	},
	GR_DOWNLOAD_CHANGED: function (data) {
		// If no data is specified -- assume all styles have changed
		if (!data) {
			for (var style in ss.storage.styles) {
				ss.storage.styles[style].download = null;
			}
		} else {
			ss.storage.styles[data.style._name].download = null;
		}

		syncPanel();
		enableStyles();
	},
	GR_DOWNLOAD_ERROR: function (data) {
		ss.storage.styles[data.style._name].download = data;
		syncPanel();
	}
};

// Bind preference changes
sp.on("dev", eventHandlers.GR_MODE_CHANGE);

// Bind panel menu events
panel.on('show', function () { panel.port.emit("show", getPanelData()); });
panel.on('hide', function () { panel.port.emit("hide", getPanelData()); });

// Forward panel events
panel.port.on('GR_TOGGLE_STYLE',		eventHandlers.GR_TOGGLE_STYLE);
panel.port.on('GR_CHECK_FOR_UPDATES',	eventHandlers.GR_CHECK_FOR_UPDATES_ALERT);
panel.port.on('GR_DONATE',				eventHandlers.GR_DONATE);
panel.port.on('GR_REPORT_BUG',			eventHandlers.GR_REPORT_BUG);

// Bind application events
GR_EVENTS.on('GR_TOGGLE_STYLE',			eventHandlers.GR_TOGGLE_STYLE);
GR_EVENTS.on('GR_DONATE',				eventHandlers.GR_DONATE);
GR_EVENTS.on('GR_REPORT_BUG',			eventHandlers.GR_REPORT_BUG);
GR_EVENTS.on('GR_CHECK_FOR_UPDATES',	eventHandlers.GR_CHECK_FOR_UPDATES);
GR_EVENTS.on('GR_DOWNLOAD_ERROR',		eventHandlers.GR_DOWNLOAD_ERROR);
GR_EVENTS.on('GR_DOWNLOAD_CHANGED',		eventHandlers.GR_DOWNLOAD_CHANGED);


// =================================================================================


// Download the latest styles when the addon is registered (browser is loaded)
GR_EVENTS.emit("GR_CHECK_FOR_UPDATES");