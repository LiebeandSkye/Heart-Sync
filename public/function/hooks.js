(function () {
    window.AppHooks = window.AppHooks || { store: {} };

    window.AppHooks.register = function register(name, handler) {
        if (!name || typeof handler !== 'function') {
            return;
        }

        if (!this.store[name]) {
            this.store[name] = [];
        }

        this.store[name].push(handler);
    };

    window.AppHooks.run = function run(name, ...args) {
        (this.store[name] || []).forEach((handler) => {
            try {
                handler(...args);
            } catch (error) {
                console.error('AppHooks error for', name, error);
            }
        });
    };
})();
