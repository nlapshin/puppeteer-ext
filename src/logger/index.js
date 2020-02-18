require('colors');

const Diff = require('./diff');
const diff = new Diff();

module.exports = class Logger {
	constructor(options = {}) {
		this.enabled = options.enabled || false;
		this.name = options.namespace ? options.namespace : 'fetcher';

		diff.init(this.name);
	}

	log(message = '', colors = {}) {
		if (this.enabled === false) {
			return;
		}

		colors = {
			date: 'gray',
			name: 'blue',
			message: 'yellow',
			differ: 'green',
			...colors
		};

		const differ = diff.calc(this.name);

		console.log(`  ${this.date[colors.date].bold} ${this.name[colors.name].bold} ${message[colors.message].bold} ${differ[colors.differ].bold}`);
	}

	info(message = '', colors = {}) {
		this.log(message, colors);
	}

	error(message = '', colors = {}) {
		this.log(message, { message: 'red', ...colors });
	}

	get date() {
		const date = new Date();

		return date.getUTCFullYear() +
    '-' + pad(date.getUTCMonth() + 1) +
    '-' + pad(date.getUTCDate()) +
    ' ' + pad(date.getUTCHours()) +
    ':' + pad(date.getUTCMinutes()) +
    ':' + pad(date.getUTCSeconds());

		function pad(number) {
			if (number < 10) {
				return '0' + number;
			}
			return number;
		}
	}
};
