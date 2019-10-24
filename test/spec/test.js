'use strict';

const path = require('path');
const fs = require('fs');
const mkdirp = require('mkdirp');
const tape = require('tape');
const size = require('image-size');
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

tape('Module generates a PNG file at dest.', test => {
	const out = path.join(TMP, '1.png');
	test.plan(1);

	convert(SVG, out, {overwrite: true})
		.then(() => test.equal(fs.existsSync(out), true, 'PNG saved to dest.'))
		.catch(() => test.fail('PNG not saved at dest.'));
});

tape('Should throw when invalid svg is passed.', test => {
	const out = path.join(TMP, '1.png');
	test.plan(1);

	convert(NO_SVG, out)
		.then(() => test.fail('Did not throw error.'))
		.catch(() => test.pass('Invalid SVG error thrown.'));
});

tape('Should not overwrite file unless told to.', test => {
	const out = path.join(TMP, '1.png');
	const oldTime = fs.statSync(out).mtimeMs;

	convert(SVG, out)
		.then(() => {
			test.fail('Did not throw error.');
			test.end();
		})
		.catch(() => {
			test.equal(fs.statSync(out).mtimeMs, oldTime, 'PNG was not overwritten.');
			test.pass('Overwrite error thrown.');
			test.end();
		});
});

tape('Should overwrite file when told to.', test => {
	const out = path.join(TMP, '1.png');
	const oldTime = fs.statSync(out).mtimeMs;

	convert(SVG, out, {overwrite: true})
		.then(() => {
			test.equal(fs.existsSync(out), true, 'PNG overwrote file saved to dest.');
			test.notEqual(fs.statSync(out).mtimeMs, oldTime, 'PNG overwrote older file.');
			test.end();
		})
		.catch(() => test.fail('PNG not overwritten at dest.'));
});

tape('Should render file based on SVG dimensions.', test => {
	const out = path.join(TMP, '1.png');
	const srcDims = size(SVG);

	convert(SVG, out, {overwrite: true})
		.then(() => {
			const outDims = size(out);
			test.equal(outDims.width, srcDims.width, `PNG width matches raw SVG width (${outDims.width}px).`);
			test.equal(outDims.height, srcDims.height, `PNG height matches raw SVG height (${outDims.height}px).`);
			test.end();
		})
		.catch(() => test.fail('PNG not overwritten at dest.'));
});

tape('Should render file based on options.', test => {
	const out = path.join(TMP, '1.png');

	convert(SVG, out, {width: 1200, overwrite: true})
		.then(() => {
			const outDims = size(out);
			test.equal(outDims.width, 1200, `PNG width matches width option (${outDims.width}px).`);
			test.equal(outDims.height, 1200, `PNG height scales based on width (${outDims.height}px).`);
			test.end();
		})
		.catch(() => test.fail('PNG not overwritten at dest.'));
});

tape('Should render file based on options without skewing height.', test => {
	const out = path.join(TMP, '1.png');

	const opts = {
		width: 1200,
		height: 500,
		overwrite: true
	};

	convert(SVG, out, opts)
		.then(() => {
			const outDims = size(out);
			test.equal(outDims.width, 1200, `PNG width matches width option without skewing (${outDims.width}px).`);
			test.equal(outDims.height, 500, `PNG height matches width option without skewing (${outDims.height}px).`);
			test.end();
		})
		.catch(() => test.fail('PNG not overwritten at dest.'));
});

tape('Should render file based on options without skewing width.', test => {
	const out = path.join(TMP, '1.png');

	const opts = {
		width: 500,
		height: 1200,
		overwrite: true
	};

	convert(SVG, out, opts)
		.then(() => {
			const outDims = size(out);
			test.equal(outDims.height, 1200, `PNG height matches height option without skewing (${outDims.height}px).`);
			test.equal(outDims.width, 500, `PNG width matches height option without skewing (${outDims.width}px).`);
			test.end();
		})
		.catch(() => test.fail('PNG not overwritten at dest.'));
});

tape('Should render a trimmed file without changing dimensions.', test => {
	const out = path.join(TMP, '1.png');

	const opts = {
		trim: true,
		width: 500,
		height: 500,
		overwrite: true
	};

	convert(SVG, out, opts)
		.then(() => {
			const outDims = size(out);
			test.equal(outDims.height, 500, `PNG height matches height option without skewing (${outDims.height}px).`);
			test.equal(outDims.width, 500, `PNG width matches height option without skewing (${outDims.width}px).`);
			test.end();
		})
		.catch(() => test.fail('PNG not overwritten at dest.'));
});

tape('Should render an invalid SVG to size based on options and trim.', test => {
	const out = path.join(TMP, '1.png');

	const opts = {
		width: 500,
		height: 500,
		overwrite: true
	};

	convert(INVALID_SVG, out, opts)
		.then(() => {
			const outDims = size(out);
			test.equal(outDims.height, 500, `PNG height matches height option (${outDims.height}px).`);
			test.equal(outDims.width, 500, `PNG width matches height option (${outDims.width}px).`);
			test.end();
		})
		.catch(() => test.fail('PNG not overwritten at dest.'));
});

tape('Should render an invalid SVG to default size.', test => {
	const out = path.join(TMP, '1.png');

	const opts = {
		overwrite: true
	};

	convert(INVALID_SVG, out, opts)
		.then(() => {
			const outDims = size(out);
			test.equal(convert.DEFAULTS.defaultSvgLength, outDims.height, `PNG height matches defaultSvgLength (${outDims.height}px).`);
			test.equal(convert.DEFAULTS.defaultSvgLength, outDims.width, `PNG width matches defaultSvgLength (${outDims.width}px).`);
			test.end();
		})
		.catch(() => test.fail('PNG not overwritten at dest.'));
});

tape('Should render an invalid SVG to default size as set as defaultSvgLength option.', test => {
	const out = path.join(TMP, '1.png');

	const opts = {
		defaultSvgLength: 500,
		overwrite: true
	};

	convert(INVALID_SVG, out, opts)
		.then(() => {
			const outDims = size(out);
			test.equal(500, outDims.height, `PNG height matches options.defaultSvgLength (${outDims.height}px).`);
			test.equal(500, outDims.width, `PNG width matches options.defaultSvgLength (${outDims.width}px).`);
			test.end();
		})
		.catch(() => test.fail('PNG not overwritten at dest.'));
});
