import fs from 'fs'
import sync from 'csv-parse/lib/sync'
import csvStringify from 'csv-stringify'
import minimist from 'minimist'

const args = minimist(process.argv.slice(2))

const flatten = (interm, cur) => {
	return interm ? interm.concat(cur) : interm
}

const data = 
	args._.map(fn => {
		return fn.endsWith('csv') ? sync(fs.readFileSync(fn), { columns : true }) : JSON.parse(fs.readFileSync(fn))
	})

const key = args.key
const keep = args.keep ? args.keep.split(',') : []
const outFile = args.out
const json = args.json || (outFile.endsWith('json') ? true : false)

const joinDict = (interm, cur) => {

	return Object.assign(interm, cur)
}

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
	fs.writeFileSync(outFile, JSON.stringify(joined))
} else {
	csvStringify(joined, { header : true }).pipe(fs.createWriteStream(outFile))
}