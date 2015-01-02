/* global self, React */

"use strict";

/**
 * Renders the contents of the panel
 * @method render
 *
 * @param	{object}	data		- Data from the panel show event
 *
 */
var PanelComponent = React.createClass({

	getDefaultProps: function () {
		return {
			locales: {},
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
							<span className="message">{error}</span>
						);
					}

					styles.push(
						<li className={cls} key={name} onClick={this.handleClickStyle.bind(null, name)}>
							{name}
							<span className="version">{style[name][this.props.mode]}</span>
							<span className="icon"></span>
							{message}
						</li>
					);
				}
			}.bind(this));
		}

		return (
			<ul className="panel">
				{styles}
				<li className={this.props.updating ? "loading checker" : "checker"} onClick={this.handleClickCheck}>
					{this.props.updating ? this.props.locales.loading : this.props.locales.check_for_updates}
				</li>
				<li className="donate" onClick={this.handleClickDonation}>
					{this.props.locales.make_a_donation}
				</li>
				<li className="bugs" onClick={this.handleClickBugs}>
					{this.props.locales.submit_bug_report}
				</li>
			</ul>
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
	React.render(<PanelComponent
		locales={data.locales}
		manifest={data.manifest}
		mode={data.mode}
		styles={data.styles}
		updating={data.updating} />,
		document.body
	);
});