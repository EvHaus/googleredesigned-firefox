/* global self, React */

/**
 * Renders the contents of the panel
 * @method render
 * @param	{object}	data		- Data from the panel show event
 */
"use strict";

var PanelComponent = React.createClass({
	displayName: "PanelComponent",

	propTypes: {
		locales: React.PropTypes.object,
		manifest: React.PropTypes.arrayOf(React.PropTypes.object),
		mode: React.PropTypes.string,
		styles: React.PropTypes.object,
		updating: React.PropTypes.bool
	},

	getDefaultProps: function getDefaultProps() {
		return {
			locales: {},
			manifest: {},
			mode: null,
			styles: {},
			updating: false
		};
	},

	render: function render() {

		// Render style items
		var styles = [];
		var prefs = undefined,
		    cls = undefined,
		    message = undefined,
		    error = undefined;
		if (this.props.manifest) {
			this.props.manifest.forEach((function (style) {
				Object.keys(style).forEach((function (name) {
					if (name === 'images') return;
					prefs = this.props.styles[name];
					cls = "style";
					if (prefs.disabled) cls += " disabled";

					// Handle download states
					if (prefs.download) {
						if (prefs.download.error) {
							cls += " error";
							error = prefs.download.error.message;
						}
					}

					// Handle error messages
					if (error) {
						message = React.createElement(
							"span",
							{ className: "message" },
							error
						);
					}

					styles.push(React.createElement(
						"li",
						{ className: cls, key: name, onClick: this.handleClickStyle.bind(null, name) },
						name,
						React.createElement(
							"span",
							{ className: "version" },
							style[name][this.props.mode]
						),
						React.createElement("span", { className: "icon" }),
						message
					));
				}).bind(this));
			}).bind(this));
		}

		return React.createElement(
			"ul",
			{ className: "panel" },
			styles,
			React.createElement(
				"li",
				{ className: this.props.updating ? "loading checker" : "checker", onClick: this.handleClickCheck },
				this.props.updating ? this.props.locales.loading : this.props.locales.check_for_updates
			),
			React.createElement(
				"li",
				{ className: "donate", onClick: this.handleClickDonation },
				this.props.locales.make_a_donation
			),
			React.createElement(
				"li",
				{ className: "bugs", onClick: this.handleClickBugs },
				this.props.locales.submit_bug_report
			)
		);
	},

	handleClickStyle: function handleClickStyle(style) {
		self.port.emit('GR_TOGGLE_STYLE', { style: style });
	},

	handleClickCheck: function handleClickCheck() {
		if (this.props.updating) return;
		self.port.emit('GR_CHECK_FOR_UPDATES');
	},

	handleClickDonation: function handleClickDonation() {
		self.port.emit('GR_DONATE');
	},

	handleClickBugs: function handleClickBugs() {
		self.port.emit('GR_REPORT_BUG');
	}
});

// When the panel's "show" event is triggered
self.port.on("show", function (data) {
	React.render(React.createElement(PanelComponent, {
		locales: data.locales,
		manifest: data.manifest,
		mode: data.mode,
		styles: data.styles,
		updating: data.updating }), document.body);
});
