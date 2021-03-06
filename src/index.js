const puppeteer = require('puppeteer');
const EventEmitter3 = require('eventemitter3');
const ConsoleProfiler = require('console-profiler');

const { compact } = require('lodash');

const Logger = require('./logger');
const makeOptions = require('./options');

module.exports = class Harvester extends EventEmitter3 {
	constructor(options = {}) {
		super();

		this.options = makeOptions(options);

		this.csl = new ConsoleProfiler(this.options.profiler);
		this.logger = new Logger(this.options.logger);

		this.logger.info(`Proxy ${this.options.proxy.enabled ? 'enabled' : 'disabled'}`);
		this.logger.info(`Blocked ${this.options.blocked.enabled ? 'enabled' : 'disabled'}`);
		this.logger.info(`Profiler ${this.options.profiler.enabled ? 'enabled' : 'disabled'}`);
		this.logger.info(`Headless ${this.options.headless ? 'enabled' : 'disabled'}`);
		this.logger.info(`Browser ${this.options.chrome ? 'Chrome' : 'Chromium'}`);
	}

	async browser() {
		const { proxy, executor } = this.options;
		const { headless, chrome, chromePath, defaultViewport, ignoreHTTPSErrors, slowMo, userDataDir } = executor;

		const windowSize = `${defaultViewport.width},${defaultViewport.height}`;

		return puppeteer.launch(Object.assign({
			args: compact([
				`${proxy.enabled ? `--proxy-server=${proxy.server}` : ''}`,
				`--window-size=${windowSize}`,
			]),
			headless,
			defaultViewport,
			ignoreHTTPSErrors,
			executablePath: chrome ? chromePath : '',
			slowMo,
			userDataDir
		}));
	}

	async page(browser) {
		const { proxy, blocked, profiler, page: pageOpts } = this.options;

		const page = await browser.newPage();

		if (proxy.enabled) {
			await page.authenticate({
				username: proxy.username,
				password: proxy.password
			});
		}

		await page.setRequestInterception(true);
		await page.setDefaultTimeout(pageOpts.defaultTimeout);

		page.on('request', request => {
			const type = request.resourceType();
			const url = request.url();

			this.emit('request:url', url);

			if (blocked.enabled) {
				if (blocked.types.includes(type)) {
					request.abort();

					return;
				}

				if (blocked.sites.some(compareUrl => !!(url.indexOf(compareUrl) + 1))) {
					request.abort();

					return;
				}
			}

			if (profiler.enabled) {
				this.csl.time(url);
			}

			request.continue();
		});

		page.on('response', response => {
			const url = response.url();

			this.emit('response:url', url);

			if (profiler.enabled) {
				this.csl.timeEnd(url);
			}
		});

		page.on('error', error => {
			console.log(error);
		});

		return page;
	}

	async exec(link, cookies) {
		const browser = await this.browser();
		const page = await this.page(browser);

		if (cookies) await this.cookies(page, cookies);
		if (link) await page.goto(link);

		return { browser, page };
	}

	async body(page, waitTime = 0) {
		await page.waitFor(waitTime);
		await page.waitForSelector('body');

		return page.evaluate(() => document.body.innerHTML);
	}

	async gotoTimeless (page, link) {
		return page.goto(link, { timeout: 0 });
	}

	async has (page, selector) {
		const result = await page.$(selector);

		return result !== null;
	}

	async cookies (page, data) {
		if (data) {
			return page.setCookie(...data);
		} else {
			return page.cookies();
		}
	}

	async type (page, selector, value, delay = 50) {
		return page.type(selector, value, { delay });
	}

	async find (page, selector) {
		return page.$(selector);
	}

	async findAll (page, selector) {
		return page.$$(selector);
	}

	async findByIndex (page, selector, index) {
		const elements = await this.findAll(page, selector);

		return elements.length >= index ? elements[index] : null;
	}

	async findAndScroll (page, scrollableSection) {
		return page.evaluate(selector => {
			const scrollableSection = document.querySelector(selector);

			scrollableSection.scrollTop = scrollableSection.offsetHeight;
		}, scrollableSection);
	}

	async findAndClick(page, selector) {
		const element = await page.$(selector);
		await element.click();
	}

	async findElementByText(page, selector, text) {
		return page.evaluateHandle((selector, text) => {
			const elements = document.querySelectorAll(selector);
			const element = elements ? Array.from(elements).find(elem => elem.innerText.toLowerCase().includes(text.toLowerCase())) : null;

			return element;
		}, selector, text);
	}

	async findElementByTextAndClick(page, selector, text) {
		return page.evaluate((selector, text) => {
			const elements = document.querySelectorAll(selector);
			const element = elements ? Array.from(elements).find(elem => elem.innerText.toLowerCase().includes(text.toLowerCase())) : null;

			if (element) {
				element.click();
			}
		}, selector, text);
	}

	async clickIfVisible(page, selector) {
		if (await this.isVisible(page, selector)) {
			return page.click(selector);
		}
	}

	async isVisible (page, selector) {
		return page.evaluate((selector) => {
			const elem = document.querySelector(selector);

			if (!elem) {
				return false;
			}

			const style = window.getComputedStyle(elem);
			return style && style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
		}, selector);
	}

	async isVisibleElement (page, elementHandle) {
		return page.evaluate(el => {
			const height = window.getComputedStyle(el).getPropertyValue('display') !== 'none' && el.offsetHeight;

			return !!height;
		}, elementHandle);
	}
};
