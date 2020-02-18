module.exports = (options = {}) => {
	const namespace = options.namespace || 'downloader:harvester';
	const proxy = Object.assign({ enabled: false, server: '', username: '', password: '' }, options.proxy || {});
	const blocked = Object.assign({ enabled: false, types: [], sites: [] }, options.blocked || {});
	const profiler = Object.assign({ enabled: false, threshold: 1000, namespace }, options.profiler || {});
	const logger = Object.assign({ enabled: false }, options.logger || {});
	const executor = Object.assign({
		headless: true,
		chrome: false,
		chromePath: '/usr/bin/google-chrome',
		defaultViewport: { height: '1080', width: '1920' }
	}, options.executor || {});

	return {
		namespace,
		proxy,
		blocked,
		profiler,
		logger,
		executor
	};
};