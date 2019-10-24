#!/usr/bin/env node
'use strict';

const program = require('commander');
const pkg = require('../package.json');
const convert = require('..');

program
	.version(pkg.version)
	.description(pkg.description)
	.arguments('<source> <output>')
	.helpOption('-H, --help', 'output usage information')
	.option('-h, --height <number>', 'set the height of the output image')
	.option('-w, --width <number>', 'set the width of the output image')
	.option('-p, --padding <number>', 'set the amount of padding around output image', 0)
	.option('-b, --backgroundColor <color>', 'set the background color of the output image as any valid CSS color')
	.option('-f, --defaultSvgLength <number>', 'width and height to render output if SVG dimensions are invalid', convert.DEFAULTS.defaultSvgLength)
	.option('-y, --overwrite', 'overwrite output file if exists', false)
	.option('-t, --trim', 'trim the output image to the bounds of the SVG', false)
	.option('-o, --opaque', 'save the output image with an opaque background', false)
	.action(async (source, dest) => {
		const hrstart = process.hrtime();

		const options = {
			defaultSvgLength: program.defaultSvgLength,
			backgroundColor: program.backgroundColor,
			omitBackground: !program.opaque,
			overwrite: program.overwrite,
			padding: program.padding,
			height: program.height,
			width: program.width,
			trim: program.trim
		};

		try {
			await convert(source, dest, options);
		} catch (error) {
			console.error(error);
			process.exit(1);
		}

		console.log(`PNG written to "${dest}" in ${process.hrtime(hrstart)[1] / 1000000000}s`);
	});

if (process.argv.slice(2).length === 0) {
	program.outputHelp();
	process.exit();
}

program.parse(process.argv);
