const path			= require("sdk/fs/path"),
	  system		= require("sdk/system");

exports.config = {
	// Use this when we need a unique id for SDK elements
	id: "googleredesigned",

	// The user-facing name of the extension
	title: "Google Redesigned",

	// URL where to get style manifest
	manifest_url: "http://www.globexdesigns.com/products/gr/extension/styles",

	// URL where to send users for donations
	donation_url: "http://www.globexdesigns.com/products/gr/donate.php",

	// URL where to send users for Bug Reports
	bug_url: "http://www.globexdesigns.com/bugtracker",

	// Local directory where css files will be saved
	extension_dir: path.join(system.pathFor('ProfD'), "googleredesigned")
};