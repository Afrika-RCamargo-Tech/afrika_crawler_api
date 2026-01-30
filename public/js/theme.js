/**
 * Afrika Crawler - Theme Manager
 * Dark/Light mode management with system preference detection
 */

class ThemeManager {
    constructor() {
        this.theme = 'light';
        this.storageKey = 'afrika-theme';
        this.init();
    }

    init() {
        // Load saved theme or detect system preference
        const savedTheme = StorageUtils.get(this.storageKey);
        
        if (savedTheme) {
            this.theme = savedTheme;
        } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            this.theme = 'dark';
        }

        this.apply();
        this.setupListeners();
    }

    setupListeners() {
        // Listen for system theme changes
        if (window.matchMedia) {
            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
                if (!StorageUtils.get(this.storageKey)) {
                    this.theme = e.matches ? 'dark' : 'light';
                    this.apply();
                }
            });
        }

        // Listen for toggle button clicks
        document.addEventListener('click', (e) => {
            const toggle = e.target.closest('[data-theme-toggle]');
            if (toggle) {
                this.toggle();
            }
        });
    }

    apply() {
        document.documentElement.setAttribute('data-theme', this.theme);
        
        // Update toggle button icon
        const toggles = document.querySelectorAll('[data-theme-toggle]');
        toggles.forEach(toggle => {
            const icon = toggle.querySelector('[data-lucide]');
            if (icon) {
                icon.setAttribute('data-lucide', this.theme === 'dark' ? 'sun' : 'moon');
            }
        });

        // Reinitialize Lucide icons
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        // Dispatch theme change event
        document.dispatchEvent(new CustomEvent('themechange', { 
            detail: { theme: this.theme } 
        }));
    }

    toggle() {
        this.theme = this.theme === 'light' ? 'dark' : 'light';
        StorageUtils.set(this.storageKey, this.theme);
        this.apply();
    }

    get isDark() {
        return this.theme === 'dark';
    }

    get isLight() {
        return this.theme === 'light';
    }
}

// Create global instance
window.ThemeManager = new ThemeManager();
