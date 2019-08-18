module.exports = class PuppeteerPageExt {
	constructor(page, rootUrl = '') {
		this.page = page;
		this.rootUrl = rootUrl;
	}

	gotoTimeless (path = '') {
		return this.page.goto(path, { timeout: 0 });
	}

	gotoRelative (path = '', opts = {}) {
		path = (path.indexOf(this.rootUrl) + 1) ? path : `${this.rootUrl}${path}`;

		return this.page.goto(path, opts);
	}

	gotoRelativeTimeless (path = '') {
		return this.gotoRelative(path, { timeout: 0 });
	}

	async find (selector) {
		return this.page.$(selector);
	}

	async findAll (selector) {
		return this.page.$$(selector);
	}

	async findByIndex (selector, index) {
		const elements = await this.page.$$(selector);

		return elements.length >= index ? elements[index] : null;
	}

	async findAndScroll (scrollableSection) {
		return this.page.evaluate(selector => {
			const scrollableSection = document.querySelector(selector);

			scrollableSection.scrollTop = scrollableSection.offsetHeight;
		}, scrollableSection);
	}

	async has (selector) {
		const result = await this.page.$(selector);

		return result !== null;
	}

	async click (selector, delay = 50) {
		return this.page.click(selector, { delay });
	}

	async waitForTime (timeout = 0) {
		return this.page.waitFor(timeout);
	}

	async waitForElement (selector) {
		return this.page.waitFor(selector);
	}

	async waitForNavigation () {
		return this.page.waitForNavigation();
	}

	async type (selector, value, delay = 50) {
		return this.page.type(selector, value, { delay });
	}

	async cookies (data) {
		if (data) {
			return this.page.setCookie(...data);
		} else {
			return this.page.cookies();
		}
	}

	async getValues (selector, handler) {
		return this.page.$$eval(selector, handler);
	}

	async isVisible(elementHandle) {
		return this.page.evaluate(el => {
			const height = window.getComputedStyle(el).getPropertyValue('display') !== 'none' && el.offsetHeight;

			return !!height;
		}, elementHandle);
	}
};
