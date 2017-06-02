import fs from 'fs'
import intoStream from 'into-stream'
import minimist from 'minimist'
import csvStringify from 'csv-stringify'
import sync from 'csv-parse/lib/sync'
import join from './index.js'

try {

	const args = minimist(process.argv.slice(2))
	const data = 
		args._.map(fn => {
			return fn.endsWith('csv') ? sync(fs.readFileSync(fn), { columns : true }) : JSON.parse(fs.readFileSync(fn))
		})

	const opts = {
		key : args.key,
		keep : args.keep
	}

	const joined = join(data, opts)

	const outFile = args.out
	const json = args.json || (outFile && outFile.endsWith('json') ? true : false)

	if(json){
		intoStream(JSON.stringify(joined)).pipe(args.out ? fs.createWriteStream(outFile) : process.stdout)
	} else {
		csvStringify(joined, { header : true }).pipe(args.out ? fs.createWriteStream(outFile) : process.stdout)
	}

} catch (err) {

	console.error('error: ' + err.message)
	console.error('There probably are incorrect or missing arguments. Usage:')
	console.error('join-tables [--key=KEYCOLUMN --out=OUTFILE --json=false] INFILE_1 INFILE_2 [INFILE_3 ...]')

}