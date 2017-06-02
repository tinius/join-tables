#!/usr/bin/env node
'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var fs = _interopDefault(require('fs'));
var intoStream = _interopDefault(require('into-stream'));
var minimist = _interopDefault(require('minimist'));
var csvStringify = _interopDefault(require('csv-stringify'));
var sync = _interopDefault(require('csv-parse/lib/sync'));

const args = minimist(process.argv.slice(2));

const flatten = (interm, cur) => {
	return interm ? interm.concat(cur) : interm
};

const joinDict = (interm, cur) => {
	return Object.assign(interm, cur)
};

const join = (data, {

	key = 'id',
	keep = [],
	defaultValue = ''

} = {}) => {

	const columns = Array.from(new Set(data.map(table => Object.keys(table[0])).reduce(flatten)));
	const defaults = Object.assign(...columns.map(c => ({ [c] : defaultValue } )));
	const ids = Array.from(new Set(data.map(table => table.map(row => row[key])).reduce(flatten)));

	return ids
		.map(id => {

			return data.map(sheet => {
				return sheet.find(row => row[key] === id)
			}).reduce(joinDict, Object.assign({}, defaults))

		})
		.sort((a, b) => a[key] < b[key] ? -1 : 1)
};

try {

	const args = minimist(process.argv.slice(2));
	const data = 
		args._.map(fn => {
			return fn.endsWith('csv') ? sync(fs.readFileSync(fn), { columns : true }) : JSON.parse(fs.readFileSync(fn))
		});

	const opts = {
		key : args.key,
		keep : args.keep
	};

	const joined = join(data, opts);

	const outFile = args.out;
	const json = args.json || (outFile && outFile.endsWith('json') ? true : false);

	if(json){
		intoStream(JSON.stringify(joined)).pipe(args.out ? fs.createWriteStream(outFile) : process.stdout);
	} else {
		csvStringify(joined, { header : true }).pipe(args.out ? fs.createWriteStream(outFile) : process.stdout);
	}

} catch (err) {

	console.error('error: ' + err.message);
	console.error('There probably are incorrect or missing arguments. Usage:');
	console.error('join-tables [--key=KEYCOLUMN --out=OUTFILE --json=false] INFILE_1 INFILE_2 [INFILE_3 ...]');

}
