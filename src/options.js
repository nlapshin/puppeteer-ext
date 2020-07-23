module.exports = (options = {}) => {
	const namespace = options.namespace || 'downloader:harvester';
	const proxy = Object.assign({ enabled: false, server: '', username: '', password: '' }, options.proxy || {});
	const blocked = Object.assign({ enabled: false, types: [], sites: [] }, options.blocked || {});
	const profiler = Object.assign({ enabled: false, threshold: 1000, namespace }, options.profiler || {});
	const logger = Object.assign({ enabled: false, namespace }, options.logger || {});
	const executor = Object.assign({
		headless: true,
		chrome: false,
		chromePath: '/usr/bin/google-chrome',
		defaultViewport: { height: 800, width: 1024 }
	}, options.executor || {});


	const page = Object.assign({
		defaultTimeout: 30 * 1000
	}, options.page || {});

	return {
		namespace,
		proxy,
		blocked,
		profiler,
		logger,
		executor,
		page
	};
};
