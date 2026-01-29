/**
 * Afrika Crawler - Chart Manager
 * Handle Chart.js charts for analytics
 */

class ChartManager {
    constructor() {
        this.charts = {};
        this.colors = ColorUtils.toolColors;
        this.setupChartDefaults();
    }

    setupChartDefaults() {
        if (typeof Chart === 'undefined') return;

        Chart.defaults.font.family = "'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
        Chart.defaults.color = getComputedStyle(document.documentElement).getPropertyValue('--text-secondary').trim();
        Chart.defaults.plugins.legend.labels.usePointStyle = true;
        Chart.defaults.plugins.legend.labels.padding = 20;
        Chart.defaults.plugins.tooltip.backgroundColor = '#0f172a';
        Chart.defaults.plugins.tooltip.titleColor = '#ffffff';
        Chart.defaults.plugins.tooltip.bodyColor = '#e2e8f0';
        Chart.defaults.plugins.tooltip.borderColor = '#334155';
        Chart.defaults.plugins.tooltip.borderWidth = 1;
        Chart.defaults.plugins.tooltip.padding = 12;
        Chart.defaults.plugins.tooltip.cornerRadius = 8;
        Chart.defaults.plugins.tooltip.displayColors = true;
    }

    /**
     * Create or update the updates timeline chart
     */
    createTimelineChart(container, updates) {
        const ctx = container.getContext('2d');
        
        // Destroy existing chart
        if (this.charts.timeline) {
            this.charts.timeline.destroy();
        }

        // Group updates by month
        const monthlyData = this.groupByMonth(updates);

        this.charts.timeline = new Chart(ctx, {
            type: 'line',
            data: {
                labels: monthlyData.labels,
                datasets: [{
                    label: 'Updates',
                    data: monthlyData.values,
                    borderColor: '#6366f1',
                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    pointBackgroundColor: '#6366f1',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            title: (items) => items[0].label,
                            label: (item) => `${item.raw} updates`
                        }
                    }
                },
                scales: {
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            font: { size: 11 }
                        }
                    },
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        },
                        ticks: {
                            stepSize: 1,
                            font: { size: 11 }
                        }
                    }
                }
            }
        });

        return this.charts.timeline;
    }

    /**
     * Create or update the tools distribution chart
     */
    createToolsChart(container, updates) {
        const ctx = container.getContext('2d');
        
        if (this.charts.tools) {
            this.charts.tools.destroy();
        }

        const toolsData = this.groupByTool(updates);

        this.charts.tools = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: toolsData.labels,
                datasets: [{
                    data: toolsData.values,
                    backgroundColor: toolsData.labels.map((_, i) => this.colors[i % this.colors.length]),
                    borderWidth: 0,
                    hoverOffset: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '65%',
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            padding: 16,
                            font: { size: 12 }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: (item) => {
                                const total = item.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((item.raw / total) * 100).toFixed(1);
                                return `${item.label}: ${item.raw} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });

        return this.charts.tools;
    }

    /**
     * Create activity heatmap
     */
    createActivityChart(container, updates) {
        const ctx = container.getContext('2d');
        
        if (this.charts.activity) {
            this.charts.activity.destroy();
        }

        const weekdayData = this.groupByWeekday(updates);

        this.charts.activity = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'],
                datasets: [{
                    label: 'Updates por dia',
                    data: weekdayData,
                    backgroundColor: weekdayData.map((v, i) => {
                        const maxVal = Math.max(...weekdayData);
                        const opacity = 0.3 + (v / maxVal) * 0.7;
                        return `rgba(99, 102, 241, ${opacity})`;
                    }),
                    borderRadius: 6,
                    borderSkipped: false
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    x: {
                        grid: {
                            display: false
                        }
                    },
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        },
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });

        return this.charts.activity;
    }

    // Helper methods
    groupByMonth(updates) {
        const months = {};
        
        updates.forEach(u => {
            const date = new Date(u.date);
            const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            months[key] = (months[key] || 0) + 1;
        });

        const sortedKeys = Object.keys(months).sort().slice(-12);
        
        return {
            labels: sortedKeys.map(k => {
                const [year, month] = k.split('-');
                return new Date(year, month - 1).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
            }),
            values: sortedKeys.map(k => months[k])
        };
    }

    groupByTool(updates) {
        const tools = {};
        updates.forEach(u => {
            tools[u.tool] = (tools[u.tool] || 0) + 1;
        });

        const sorted = Object.entries(tools).sort((a, b) => b[1] - a[1]);
        
        return {
            labels: sorted.map(([tool]) => tool),
            values: sorted.map(([, count]) => count)
        };
    }

    groupByWeekday(updates) {
        const days = [0, 0, 0, 0, 0, 0, 0];
        updates.forEach(u => {
            const day = new Date(u.date).getDay();
            days[day]++;
        });
        return days;
    }

    // Update charts on theme change
    updateTheme() {
        const textColor = getComputedStyle(document.documentElement).getPropertyValue('--text-secondary').trim();
        Chart.defaults.color = textColor;
        
        Object.values(this.charts).forEach(chart => {
            if (chart) {
                chart.options.scales?.x?.ticks && (chart.options.scales.x.ticks.color = textColor);
                chart.options.scales?.y?.ticks && (chart.options.scales.y.ticks.color = textColor);
                chart.update();
            }
        });
    }

    // Destroy all charts
    destroyAll() {
        Object.values(this.charts).forEach(chart => {
            if (chart) chart.destroy();
        });
        this.charts = {};
    }
}

// Create global instance
window.ChartManager = new ChartManager();

// Update charts on theme change
document.addEventListener('themechange', () => {
    ChartManager.updateTheme();
});
