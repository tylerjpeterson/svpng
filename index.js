/* eslint no-unused-vars: ["error", { "caughtErrors": "none" }] */
'use strict';

const path = require('path');
const fs = require('fs');
const ejs = require('ejs');
const Svgo = require('svgo');
const size = require('image-size');
const puppeteer = require('puppeteer');
const opts = require('./svgo-options');

const template = path.join(__dirname, 'template', 'index.html.ejs');
const render = ejs.compile(`${fs.readFileSync(template)}`);
const svgo = new Svgo(opts);

/**
 * Sets SVG dimensions based on user render options and returns rendered SVG dimensions
 * to set viewport to match before taking screnshot.
 *
 * @param {Number} width - Desired SVG width
 * @param {Number} height - Desired SVG height
 * @param {Boolean} trim - Whether or not to trim the SVG to its bounds
 * @return {Object} - Rendered SVG dimensions
 */
/* istanbul ignore next */
const getComputedDims = (width, height, trim) => {
	const svg = document.querySelector('svg');

	if (trim) {
		// If trimming SVG to immediate bounds, retrieve
		// dimensions based on bounding box, not the element
		const bbox = svg.getBBox();
		const viewBox = [bbox.x, bbox.y, bbox.width, bbox.height].join(' ');
		svg.setAttribute('viewBox', viewBox);
	}

	// Remove height and width attributes and set height and width
	// to desired values; SVG will scale itself proportionally
	svg.removeAttribute('width');
	svg.removeAttribute('height');
	svg.style.height = `${height}px`;
	svg.style.width = `${width}px`;

	// Get the computed dimensions, maintaining aspect ratio
	const computed = window.getComputedStyle(svg);

	return {
		w: parseInt(computed.getPropertyValue('width'), 10),
		h: parseInt(computed.getPropertyValue('height'), 10)
	};
};

/**
 * Creates a PNG from an SVG with rendering based on passed options.
 *
 * @param {String} src - Path to source SVG file
 * @param {String} dest - Path to save generated PNG
 * @param {Object} options - Rendering options
 * @return {String} - Path to generated PNG
 */
const convertSvgToPng = async (src, dest, options) => {
	// Merge passed options with defaults
	options = {
		...convertSvgToPng.DEFAULTS,
		...options
	};

	// Force omitBackground to false if backgroundColor is set
	if (options.backgroundColor) {
		options.omitBackground = false;
	}

	// Confirm source file exists
	if (!fs.existsSync(src)) {
		throw new Error(`SVG file not found at "${src}".`);
	}

	// Throw if destination file exists and overwrite option is false
	if (fs.existsSync(dest) && !options.overwrite) {
		throw new Error(`File exists at "${dest}".`);
	}

	// If width or height options are set, we should ignore the SVG size attributes
	const ignoreSizeAttributes = (options.width || options.height);

	// Use fallback svg length in case size cannot be determined
	let info = {
		width: options.defaultSvgLength,
		height: options.defaultSvgLength
	};

	try {
		// Attempt to get the SVG's dimensions
		info = size(src);
	} catch (error) {
		// If size cannot be determined, force trim option
		options.trim = true;
	}

	// Retrieve contents of SVG file
	const svg = `${fs.readFileSync(src, 'utf8')}`;

	// Optimize SVG content
	const {data} = await svgo.optimize(svg, {path: src});

	// Create an HTML page with the SVG embedded
	const markup = render({
		svg: data,
		padding: options.padding,
		backgroundColor: options.backgroundColor
	});

	// Launch a puppeteer instance
	const browser = await puppeteer.launch();

	// Create a puppeteer browser
	const page = await browser.newPage();

	// Load the generated HTML markup into the browser
	await page.setContent(markup);

	// Set width and height based on passed options
	let {width, height} = options;

	// If we should not ignore SVG size attributes,
	// set width and height to option value, or
	// measured value, or default SVG length value
	if (!ignoreSizeAttributes) {
		width = width || info.width;
		height = height || info.height;
	}

	// If the image is padded, reduce size of SVG
	if (options.padding > 0) {
		width -= (options.padding * 2);
		height -= (options.padding * 2);
	}

	// Retrieve rendered SVG dimensions according to
	// browser after optionally trimming SVG, and setting
	// desired dimensions
	const computedDims = await page.evaluate(getComputedDims, width, height, options.trim);

	// Set the size of the browser viewport to match
	// the computed dimensions of the SVG
	await page.setViewport({
		width: computedDims.w + (options.padding * 2),
		height: computedDims.h + (options.padding * 2),
		deviceScaleFactor: 1
	});

	// Take a screenshot of the browser, saving output to
	// destination location, with optional transparent background
	await page.screenshot({
		omitBackground: options.omitBackground,
		path: dest
	});

	// Close browser instance
	await browser.close();

	// Return the path to the screenshot
	return dest;
};

convertSvgToPng.DEFAULTS = {
	defaultSvgLength: 1000,
	backgroundColor: null,
	omitBackground: true,
	overwrite: false,
	height: null,
	width: null,
	trim: false,
	padding: 0
};

module.exports = convertSvgToPng;
