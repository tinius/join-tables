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

const join = (data, {

	key = 'id',
	keep = [],
	defaultValue = ''

} = {}) => {

	const columns = Array.from(new Set(data.map(table => Object.keys(table[0])).reduce(flatten)))
	const defaults = Object.assign(...columns.map(c => ({ [c] : defaultValue } )))
	const ids = Array.from(new Set(data.map(table => table.map(row => row[key])).reduce(flatten)))

	return ids
		.map(id => {

			return data.map(sheet => {
				return sheet.find(row => row[key] === id)
			}).reduce(joinDict, Object.assign({}, defaults))

		})
		.sort((a, b) => a[key] < b[key] ? -1 : 1)
}

export default join;