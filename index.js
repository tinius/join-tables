import fs from 'fs'
import sync from 'csv-parse/lib/sync'
import csvStringify from 'csv-stringify'
import intoStream from 'into-stream'
import minimist from 'minimist'

const args = minimist(process.argv.slice(2))

const flatten = (interm, cur) => {
	return interm ? interm.concat(cur) : interm
}

const joinDict = (interm, cur) => {
	return Object.assign(interm, cur)
}


try {

	const data = 
		args._.map(fn => {
			return fn.endsWith('csv') ? sync(fs.readFileSync(fn), { columns : true }) : JSON.parse(fs.readFileSync(fn))
		})

	const key = args.key || 'id'
	const keep = args.keep ? args.keep.split(',') : []
	const outFile = args.out
	const json = args.json || (outFile && outFile.endsWith('json') ? true : false)

	const columns = Array.from(new Set(data.map(table => Object.keys(table[0])).reduce(flatten)))

	const defaults = Object.assign(...columns.map(c => ({ [c] : '' } )))


	const ids = Array.from(new Set(data.map(table => table.map(row => row[key])).reduce(flatten)))

	const joined = ids
		.map(id => {

			return data.map(sheet => {
				return sheet.find(row => row[key] === id)
			}).reduce(joinDict, Object.assign({}, defaults))

		})
		.sort((a, b) => a[key] < b[key] ? -1 : 1)

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