# Google Redesigned

This is the official Google Redesigned add-on for Firefox. It's licensed under MPL 2.0.

The extension was built using [Firefox Add-on SDK](https://developer.mozilla.org/en-US/Add-ons/SDK).

For more info visit: http://www.globexdesigns.com/products/gr

## Installation

```
npm install grunt-cli -g
npm install
```

## Live Development

```
cfx
grunt dev
```

## Building the Addon

```
cfx xpi
```

Then manually update the install.rdf file inside the .xpi package with the changes in `install.rdf.diff`