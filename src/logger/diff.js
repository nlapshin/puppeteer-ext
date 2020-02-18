const ms = require('ms');

module.exports = class Diff {
	constructor() {
		this.spaces = {};
	}

	init(name) {
		this.spaces[name] = {
			started: new Date(),
			lasted: new Date()
		};
	}

	calc(name) {
		const curr = new Date();

		const diffStarted = curr - this.spaces[name].started;
		const diffLasted = curr - this.spaces[name].lasted;

		this.spaces[name].lasted = curr;

		return `${ms(diffLasted)} / ${ms(diffStarted)}`;
	}
};