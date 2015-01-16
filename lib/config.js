const path			= require("sdk/fs/path"),
	  system		= require("sdk/system");

exports.config = {
	// Use this when we need a unique id for SDK elements
	id: "googleredesigned",

	// The user-facing name of the extension
	title: "Google Redesigned",

	// URL where to get style manifest
	manifest_url: "https://www.globexdesigns.com/products/gr/extension/styles",

	// URL where to send users for donations
	donation_url: "https://www.globexdesigns.com/products/gr/donate.php",

	// URL where to send users for Bug Reports
	bug_url: "https://www.globexdesigns.com/bugtracker",

	// URL where to send users when the extension has upgraded
	upgrade_url: "https://www.globexdesigns.com/products/gr/changelogs.php",

	// Local directory where css files will be saved
	extension_dir: path.join(system.pathFor('ProfD'), "googleredesigned")
};