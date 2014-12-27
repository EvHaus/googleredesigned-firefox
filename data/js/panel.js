/* global self, React */

"use strict";

/**
 * Renders the contents of the panel
 * @method render
 *
 * @param	{object}	data		- Data from the panel show event
 *
 */
var PanelComponent = React.createClass({displayName: "PanelComponent",

	getDefaultProps: function () {
		return {
			manifest: {},
			mode: null,
			styles: {},
			updating: false
		};
	},

	render: function () {

		// Render style items
		var styles = [], prefs, cls, message, error;
		if (this.props.manifest) {
			this.props.manifest.forEach(function (style) {
				for (var name in style) {
					if (name == 'images') continue;

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
						message = (
							React.createElement("span", {className: "message"}, error)
						);
					}

					styles.push(
						React.createElement("li", {className: cls, key: name, onClick: this.handleClickStyle.bind(null, name)}, 
							name, 
							React.createElement("span", {className: "version"}, style[name][this.props.mode]), 
							React.createElement("span", {className: "icon"}), 
							message
						)
					);
				}
			}.bind(this));
		}

		return (
			React.createElement("ul", {className: "panel"}, 
				styles, 
				React.createElement("li", {className: this.props.updating ? "loading checker" : "checker", onClick: this.handleClickCheck}, 
					this.props.updating ? 'Loading...' : 'Check For Style Updates'
				), 
				React.createElement("li", {className: "donate", onClick: this.handleClickDonation}, 
					"Make a Donation"
				), 
				React.createElement("li", {className: "bugs", onClick: this.handleClickBugs}, 
					"Submit Bug Report"
				)
			)
		);
	},

	handleClickStyle: function (style) {
		self.port.emit('GR_TOGGLE_STYLE', {style: style});
	},

	handleClickCheck: function () {
		if (this.props.updating) return;
		self.port.emit('GR_CHECK_FOR_UPDATES');
	},

	handleClickDonation: function () {
		self.port.emit('GR_DONATE');
	},

	handleClickBugs: function () {
		self.port.emit('GR_REPORT_BUG');
	}
});


// When the panel's "show" event is triggered
self.port.on("show", function (data) {
	React.render(React.createElement(PanelComponent, {
		manifest: data.manifest, 
		mode: data.mode, 
		styles: data.styles, 
		updating: data.updating}),
		document.body
	);
});