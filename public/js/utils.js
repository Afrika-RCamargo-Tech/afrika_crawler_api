/**
 * Afrika Crawler - Utility Functions
 * Reusable helper functions
 */

// ===== Date Utilities =====
const DateUtils = {
    /**
     * Format date to Brazilian Portuguese locale
     */
    format(dateStr) {
        return new Date(dateStr).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        });
    },

    /**
     * Format date in short format
     */
    formatShort(dateStr) {
        return new Date(dateStr).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    },

    /**
     * Get relative time string
     */
    getRelative(dateStr) {
        const date = new Date(dateStr);
        const now = new Date();
        const diff = Math.floor((now - date) / (1000 * 60 * 60 * 24));
        
        if (diff === 0) return 'Hoje';
        if (diff === 1) return 'Ontem';
        if (diff < 7) return `${diff} dias atrás`;
        if (diff < 30) return `${Math.floor(diff / 7)} semanas atrás`;
        if (diff < 365) return `${Math.floor(diff / 30)} meses atrás`;
        return `${Math.floor(diff / 365)} anos atrás`;
    },

    /**
     * Check if date is within X days
     */
    isWithinDays(dateStr, days) {
        const date = new Date(dateStr);
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - days);
        return date >= cutoff;
    },

    /**
     * Get days since a date
     */
    getDaysSince(dateStr) {
        const date = new Date(dateStr);
        const now = new Date();
        return Math.floor((now - date) / (1000 * 60 * 60 * 24));
    }
};

// ===== String Utilities =====
const StringUtils = {
    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    /**
     * Truncate string with ellipsis
     */
    truncate(str, length) {
        if (!str) return '';
        return str.length > length ? str.substring(0, length) + '...' : str;
    },

    /**
     * Generate a link with text fragment
     */
    generateDetailsLink(update) {
        if (!update.link) return null;
        const dateObj = new Date(update.date);
        const dateEnglish = dateObj.toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric'
        });
        return `${update.link}#:~:text=${encodeURIComponent(dateEnglish)}`;
    },

    /**
     * Highlight search term in text
     */
    highlight(text, term) {
        if (!term) return text;
        const regex = new RegExp(`(${term})`, 'gi');
        return text.replace(regex, '<mark>$1</mark>');
    }
};

// ===== DOM Utilities =====
const DOMUtils = {
    /**
     * Create element with classes and attributes
     */
    createElement(tag, classes = [], attributes = {}) {
        const el = document.createElement(tag);
        if (classes.length) el.className = classes.join(' ');
        Object.entries(attributes).forEach(([key, value]) => {
            el.setAttribute(key, value);
        });
        return el;
    },

    /**
     * Add ripple effect to button
     */
    addRipple(event) {
        // Ensure we operate on the actual button element. The listener
        // is attached to `document`, so `event.currentTarget` may be
        // `document` which would cause a HierarchyRequestError when
        // appending a child.
        const button = (event.target && event.target.closest)
            ? event.target.closest('.btn')
            : event.currentTarget;

        if (!button || button === document) return;

        const circle = document.createElement('span');
        const diameter = Math.max(button.clientWidth, button.clientHeight);
        const radius = diameter / 2;
        const rect = button.getBoundingClientRect();

        circle.style.width = circle.style.height = `${diameter}px`;
        circle.style.left = `${event.clientX - rect.left - radius}px`;
        circle.style.top = `${event.clientY - rect.top - radius}px`;
        circle.classList.add('ripple');

        const ripple = button.querySelector('.ripple');
        if (ripple) ripple.remove();

        button.appendChild(circle);
    },

    /**
     * Debounce function
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    /**
     * Throttle function
     */
    throttle(func, limit) {
        let inThrottle;
        return function executedFunction(...args) {
            if (!inThrottle) {
                func(...args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },

    /**
     * Smooth scroll to element
     */
    scrollTo(element, offset = 0) {
        const top = element.getBoundingClientRect().top + window.pageYOffset - offset;
        window.scrollTo({ top, behavior: 'smooth' });
    }
};

// ===== Storage Utilities =====
const StorageUtils = {
    /**
     * Get item from localStorage with fallback
     */
    get(key, fallback = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : fallback;
        } catch {
            return fallback;
        }
    },

    /**
     * Set item in localStorage
     */
    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (e) {
            console.error('Error saving to localStorage:', e);
        }
    },

    /**
     * Remove item from localStorage
     */
    remove(key) {
        try {
            localStorage.removeItem(key);
        } catch (e) {
            console.error('Error removing from localStorage:', e);
        }
    }
};

// ===== Animation Utilities =====
const AnimationUtils = {
    /**
     * Animate counting up a number
     */
    countUp(element, target, duration = 1000) {
        const start = 0;
        const increment = target / (duration / 16);
        let current = start;

        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                element.textContent = target;
                clearInterval(timer);
            } else {
                element.textContent = Math.floor(current);
            }
        }, 16);
    },

    /**
     * Fade in element
     */
    fadeIn(element, duration = 300) {
        element.style.opacity = 0;
        element.style.display = 'block';
        
        let start = null;
        const animate = (timestamp) => {
            if (!start) start = timestamp;
            const progress = timestamp - start;
            element.style.opacity = Math.min(progress / duration, 1);
            if (progress < duration) {
                requestAnimationFrame(animate);
            }
        };
        requestAnimationFrame(animate);
    },

    /**
     * Fade out element
     */
    fadeOut(element, duration = 300) {
        let start = null;
        const animate = (timestamp) => {
            if (!start) start = timestamp;
            const progress = timestamp - start;
            element.style.opacity = Math.max(1 - progress / duration, 0);
            if (progress < duration) {
                requestAnimationFrame(animate);
            } else {
                element.style.display = 'none';
            }
        };
        requestAnimationFrame(animate);
    }
};

// ===== Export Utilities =====
const ExportUtils = {
    /**
     * Export data as CSV
     */
    toCSV(data, filename = 'export.csv') {
        const headers = Object.keys(data[0]);
        const csvContent = [
            headers.join(','),
            ...data.map(row => 
                headers.map(header => {
                    const value = row[header] || '';
                    return `"${String(value).replaceAll('"', '""')}"`;
                }).join(',')
            )
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        link.click();
        URL.revokeObjectURL(link.href);
    },

    /**
     * Export data as JSON
     */
    toJSON(data, filename = 'export.json') {
        const jsonContent = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonContent], { type: 'application/json' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        link.click();
        URL.revokeObjectURL(link.href);
    },

    /**
     * Copy text to clipboard
     */
    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch {
            // Fallback for older browsers
            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.style.position = 'fixed';
            textarea.style.opacity = 0;
            document.body.appendChild(textarea);
            textarea.select();
            try {
                document.execCommand('copy');
                return true;
            } catch {
                return false;
            } finally {
                textarea.remove();
            }
        }
    }
};

// ===== Color Utilities =====
const ColorUtils = {
    /**
     * Generate a color palette for tools
     */
    toolColors: [
        '#6366f1', // Indigo
        '#22c55e', // Green
        '#f59e0b', // Amber
        '#ef4444', // Red
        '#a855f7', // Purple
        '#ec4899', // Pink
        '#06b6d4', // Cyan
        '#84cc16', // Lime
        '#f97316', // Orange
        '#8b5cf6', // Violet
    ],

    /**
     * Get color for a tool (consistent)
     */
    getToolColor(tool, tools) {
        const index = tools.indexOf(tool);
        return this.toolColors[index % this.toolColors.length];
    },

    /**
     * Get contrasting text color
     */
    getContrastColor(hexcolor) {
        const r = Number.parseInt(hexcolor.slice(1, 3), 16);
        const g = Number.parseInt(hexcolor.slice(3, 5), 16);
        const b = Number.parseInt(hexcolor.slice(5, 7), 16);
        const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
        return yiq >= 128 ? '#000000' : '#ffffff';
    }
};

// Make utilities globally available
globalThis.DateUtils = DateUtils;
globalThis.StringUtils = StringUtils;
globalThis.DOMUtils = DOMUtils;
globalThis.StorageUtils = StorageUtils;
globalThis.AnimationUtils = AnimationUtils;
globalThis.ExportUtils = ExportUtils;
globalThis.ColorUtils = ColorUtils;
