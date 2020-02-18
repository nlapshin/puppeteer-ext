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
		this.logger = new Logger(this.options.namespace);
	}

	async browser() {
		const { proxy, blocked, profiler, executor } = this.options;
		const { headless, chrome, chromePath, defaultViewport, ignoreHTTPSErrors } = executor;

		this.logger.info('Browser started!');
		this.logger.info(`Proxy ${proxy.enabled ? 'enabled' : 'disabled'}`);
		this.logger.info(`Blocked ${blocked.enabled ? 'enabled' : 'disabled'}`);
		this.logger.info(`Profiler ${profiler.enabled ? 'enabled' : 'disabled'}`);
		this.logger.info(`Headless ${headless ? 'enabled' : 'disabled'}`);
		this.logger.info(`Browser ${chrome ? 'Chrome' : 'Chromium'}`);

		return puppeteer.launch(Object.assign({
			args: compact([
				`${proxy.enabled ? `--proxy-server=${proxy.server}` : ''}`,
				// '--no-sandbox',
				// '--disable-setuid-sandbox',
				// '--disable-dev-shm-usage',
				// '--disable-accelerated-2d-canvas',
				// '--disable-gpu',
				`--window-size=${defaultViewport} ? ${defaultViewport.height}x${defaultViewport.width} : '1920x1080'`,
			]),
			headless,
			defaultViewport,
			ignoreHTTPSErrors,
			executablePath: chrome ? chromePath : ''
		}));
	}

	async page(browser) {
		const { proxy, blocked, profiler } = this.options;

		const page = await browser.newPage();

		if (proxy.enabled) {
			await page.authenticate({
				username: proxy.username,
				password: proxy.password
			});
		}

		await page.setRequestInterception(true);

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

	async exec(link) {
		const browser = await this.browser();
		const page = await this.page(browser);

		if (link) await page.goto(link);

		return { browser, page };
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
};
