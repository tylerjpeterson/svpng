/* eslint no-unused-vars: ["error", { "caughtErrors": "none" }] */
'use strict';

const path = require('path');
const fs = require('fs');
const mkdirp = require('mkdirp');
const tape = require('tape');
const size = require('image-size');
const ImageParser = require('image-parser');
const convert = require('../..');

const SVG = path.join(__dirname, 'svg', '1.svg');
const INVALID_SVG = path.join(__dirname, 'svg', '2.svg');
const NO_SVG = path.join(__dirname, 'svg', '3.svg');
const TMP = path.join(__dirname, '..', '..', 'tmp');

mkdirp.sync(TMP);

tape('Module exports a function.', test => {
	test.equal(typeof convert, 'function', 'Module exports a function.');
	test.end();
});

tape('Module generates a PNG file at dest.', async test => {
	const out = path.join(TMP, '1.png');

	try {
		await convert(SVG, out, {overwrite: true});
		test.equal(fs.existsSync(out), true, 'PNG saved to dest.');
		test.end();
	} catch (error) {
		test.fail('PNG not saved at dest.');
	}
});

tape('Should throw when invalid svg is passed.', async test => {
	const out = path.join(TMP, '1.png');

	try {
		await convert(NO_SVG, out);
		test.fail('Did not throw error.');
	} catch (error) {
		test.pass('Invalid SVG error thrown.');
		test.end();
	}
});

tape('Should not overwrite file unless told to.', async test => {
	const out = path.join(TMP, '1.png');
	const oldTime = fs.statSync(out).mtimeMs;

	try {
		await convert(SVG, out);
		test.fail('Did not throw error.');
	} catch (error) {
		test.equal(fs.statSync(out).mtimeMs, oldTime, 'PNG was not overwritten.');
		test.pass('Overwrite error thrown.');
		test.end();
	}
});

tape('Should overwrite file when told to.', async test => {
	const out = path.join(TMP, '1.png');
	const oldTime = fs.statSync(out).mtimeMs;

	try {
		await convert(SVG, out, {overwrite: true});
		test.equal(fs.existsSync(out), true, 'PNG overwrote file saved to dest.');
		test.notEqual(fs.statSync(out).mtimeMs, oldTime, 'PNG overwrote older file.');
		test.end();
	} catch (error) {
		test.fail('PNG not overwritten at dest.');
	}
});

tape('Should render file based on SVG dimensions.', async test => {
	const out = path.join(TMP, '1.png');
	const srcDims = size(SVG);

	try {
		await convert(SVG, out, {overwrite: true});
		const outDims = size(out);
		test.equal(outDims.width, srcDims.width, `PNG width matches raw SVG width (${outDims.width}px).`);
		test.equal(outDims.height, srcDims.height, `PNG height matches raw SVG height (${outDims.height}px).`);
		test.end();
	} catch (error) {
		test.fail('PNG not overwritten at dest.');
	}
});

tape('Should render file based on options.', async test => {
	const out = path.join(TMP, '1.png');

	try {
		await convert(SVG, out, {width: 1200, overwrite: true});
		const outDims = size(out);
		test.equal(outDims.width, 1200, `PNG width matches width option (${outDims.width}px).`);
		test.equal(outDims.height, 1200, `PNG height scales based on width (${outDims.height}px).`);
		test.end();
	} catch (error) {
		test.fail('PNG not overwritten at dest.');
	}
});

tape('Should render file based on options without skewing height.', async test => {
	const out = path.join(TMP, '1.png');

	const opts = {
		width: 1200,
		height: 500,
		overwrite: true
	};

	try {
		await convert(SVG, out, opts);
		const outDims = size(out);
		test.equal(outDims.width, 1200, `PNG width matches width option without skewing (${outDims.width}px).`);
		test.equal(outDims.height, 500, `PNG height matches width option without skewing (${outDims.height}px).`);
		test.end();
	} catch (error) {
		test.fail('PNG not overwritten at dest.');
	}
});

tape('Should render file based on options without skewing width.', async test => {
	const out = path.join(TMP, '1.png');

	const opts = {
		width: 500,
		height: 1200,
		overwrite: true
	};

	try {
		await convert(SVG, out, opts);
		const outDims = size(out);
		test.equal(outDims.height, 1200, `PNG height matches height option without skewing (${outDims.height}px).`);
		test.equal(outDims.width, 500, `PNG width matches height option without skewing (${outDims.width}px).`);
		test.end();
	} catch (error) {
		test.fail('PNG not overwritten at dest.');
	}
});

tape('Should render a trimmed file without changing dimensions.', async test => {
	const out = path.join(TMP, '1.png');

	const opts = {
		trim: true,
		width: 500,
		height: 500,
		overwrite: true
	};

	try {
		await convert(SVG, out, opts);
		const outDims = size(out);
		test.equal(outDims.height, 500, `PNG height matches height option without skewing (${outDims.height}px).`);
		test.equal(outDims.width, 500, `PNG width matches height option without skewing (${outDims.width}px).`);
		test.end();
	} catch (error) {
		test.fail('PNG not overwritten at dest.');
	}
});

tape('Should render an invalid SVG to size based on options and trim.', async test => {
	const out = path.join(TMP, '1.png');

	const opts = {
		width: 500,
		height: 500,
		overwrite: true
	};

	try {
		await convert(INVALID_SVG, out, opts);
		const outDims = size(out);
		test.equal(outDims.height, 500, `PNG height matches height option (${outDims.height}px).`);
		test.equal(outDims.width, 500, `PNG width matches height option (${outDims.width}px).`);
		test.end();
	} catch (error) {
		test.fail('PNG not overwritten at dest.');
	}
});

tape('Should render an invalid SVG to default size.', async test => {
	const out = path.join(TMP, '1.png');

	const opts = {
		overwrite: true
	};

	try {
		await convert(INVALID_SVG, out, opts);
		const outDims = size(out);
		test.equal(convert.DEFAULTS.defaultSvgLength, outDims.height, `PNG height matches defaultSvgLength (${outDims.height}px).`);
		test.equal(convert.DEFAULTS.defaultSvgLength, outDims.width, `PNG width matches defaultSvgLength (${outDims.width}px).`);
		test.end();
	} catch (error) {
		test.fail('PNG not overwritten at dest.');
	}
});

tape('Should render an invalid SVG to default size as set as defaultSvgLength option.', async test => {
	const out = path.join(TMP, '1.png');

	const opts = {
		defaultSvgLength: 500,
		overwrite: true
	};

	try {
		await convert(INVALID_SVG, out, opts);
		const outDims = size(out);
		test.equal(500, outDims.height, `PNG height matches options.defaultSvgLength (${outDims.height}px).`);
		test.equal(500, outDims.width, `PNG width matches options.defaultSvgLength (${outDims.width}px).`);
		test.end();
	} catch (error) {
		test.fail('PNG not overwritten at dest.');
	}
});

tape('Should pad output image based on padding option.', async test => {
	const out = path.join(TMP, '1.png');

	const opts = {
		width: 500,
		height: 500,
		padding: 50,
		overwrite: true
	};

	try {
		await convert(SVG, out, opts);
		const outDims = size(out);
		test.equal(500, outDims.height, `PNG height matches options.height even with padding (${outDims.height}px).`);
		test.equal(500, outDims.width, `PNG width matches options.width even with padding (${outDims.width}px).`);
		test.end();
	} catch (error) {
		test.fail('PNG not overwritten at dest.');
	}
});

tape('Should set background color based on backgroundColor option.', async test => {
	const out = path.join(TMP, '1.png');
	const color = 'rgb(254,255,188)';

	const opts = {
		trim: true,
		width: 500,
		height: 500,
		padding: 20,
		overwrite: true,
		backgroundColor: color
	};

	try {
		await convert(SVG, out, opts);
		const img = new ImageParser(out);
		img.parse(error => {
			if (error) {
				test.fail('Error reading output image.');
			}

			const px = img.getPixel(1, 1);
			test.equal(color, `rgb(${px.r},${px.g},${px.b})`, `Output image background color matches backgroundColor option (${color}).`);
			test.end();
		});
	} catch (error) {
		test.fail('PNG not overwritten at dest.');
	}
});
