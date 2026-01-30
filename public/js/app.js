/**
 * Afrika Crawler - Main Application
 * Core application logic and state management
 */

const App = {
    // Configuration
    config: {
        apiUrl: 'https://afrikacrawlerapi.vercel.app/api',
        perPageOptions: [12, 24, 48, 96],
        defaultPerPage: 24
    },

    // State
    state: {
        updates: [],
        filteredUpdates: [],
        currentPage: 1,
        perPage: 24,
        currentView: 'cards',
        sortField: 'date',
        sortOrder: 'desc',
        isLoading: false,
        error: null,
        calendar: null
    },

    // ===== Initialization =====
    async init() {
        console.log('🚀 Afrika Crawler initializing...');
        
        // Load saved preferences
        this.loadPreferences();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Setup keyboard shortcuts
        this.setupKeyboardShortcuts();
        
        // Load data
        await this.loadUpdates();
        
        // Initialize icons
        lucide.createIcons();
        
        console.log('✅ Afrika Crawler ready!');
    },

    loadPreferences() {
        const prefs = StorageUtils.get('afrika-preferences', {});
        this.state.perPage = prefs.perPage || this.config.defaultPerPage;
        this.state.currentView = prefs.view || 'cards';
        this.state.sortField = prefs.sortField || 'date';
        this.state.sortOrder = prefs.sortOrder || 'desc';
        
        // Sync view toggle buttons with saved preference
        this.syncViewToggle();
    },
    
    syncViewToggle() {
        const savedView = this.state.currentView;
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.classList.remove('active');
            btn.setAttribute('aria-selected', 'false');
            if (btn.dataset.view === savedView) {
                btn.classList.add('active');
                btn.setAttribute('aria-selected', 'true');
            }
        });
    },

    savePreferences() {
        StorageUtils.set('afrika-preferences', {
            perPage: this.state.perPage,
            view: this.state.currentView,
            sortField: this.state.sortField,
            sortOrder: this.state.sortOrder
        });
    },

    // ===== Event Listeners =====
    setupEventListeners() {
        // Search with debounce
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', DOMUtils.debounce(() => {
                this.state.currentPage = 1;
                this.applyFilters();
            }, 300));
        }

        // Filter changes
        ['toolFilter', 'dateFilter', 'sortField', 'sortOrder', 'perPage'].forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.addEventListener('change', (e) => {
                    if (id === 'sortField') this.state.sortField = e.target.value;
                    if (id === 'sortOrder') this.state.sortOrder = e.target.value;
                    if (id === 'perPage') this.state.perPage = Number.parseInt(e.target.value);
                    this.state.currentPage = 1;
                    this.applyFilters();
                    this.savePreferences();
                });
            }
        });

        // View toggle
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.switchView(btn.dataset.view);
            });
        });

        // Modal close
        const modal = document.getElementById('detailModal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) this.closeModal();
            });
        }

        const exportModal = document.getElementById('exportModal');
        if (exportModal) {
            exportModal.addEventListener('click', (e) => {
                if (e.target === exportModal) this.closeExportModal();
            });
        }

        // Ripple effect for buttons
        document.addEventListener('click', (e) => {
            const btn = e.target.closest('.btn');
            if (btn && !btn.classList.contains('btn-ghost')) {
                DOMUtils.addRipple(e);
            }
        });
    },

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Escape - close modal
            if (e.key === 'Escape') {
                this.closeModal();
            }

            // Cmd/Ctrl + K - focus search
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                document.getElementById('searchInput')?.focus();
            }

            // Arrow navigation for pagination
            if (e.key === 'ArrowLeft' && e.altKey) {
                this.goToPage(this.state.currentPage - 1);
            }
            if (e.key === 'ArrowRight' && e.altKey) {
                this.goToPage(this.state.currentPage + 1);
            }
        });
    },

    // ===== Data Loading =====
    async loadUpdates() {
        this.showLoading(true);
        this.hideError();

        try {
            const response = await fetch(`${this.config.apiUrl}/updates?limit=1000`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.error) {
                throw new Error(data.error);
            }

            this.state.updates = data;
            this.populateToolFilter();
            this.updateStats();
            this.applyFilters();
            
            Toast.success('Dados carregados com sucesso!', 'Atualizado');
            
        } catch (err) {
            console.error('Error loading updates:', err);
            this.showError(err.message);
            Toast.error('Falha ao carregar dados. Tente novamente.', 'Erro');
        } finally {
            this.showLoading(false);
        }
    },

    // ===== Filtering & Sorting =====
    handleSort(field) {
        // If clicking the same field, toggle the order
        if (this.state.sortField === field) {
            this.state.sortOrder = this.state.sortOrder === 'desc' ? 'asc' : 'desc';
        } else {
            // If clicking a different field, set it as the sort field with default desc order
            this.state.sortField = field;
            this.state.sortOrder = 'desc';
        }

        // Update dropdowns to reflect the new sort state
        const sortFieldSelect = document.getElementById('sortField');
        const sortOrderSelect = document.getElementById('sortOrder');
        if (sortFieldSelect) sortFieldSelect.value = this.state.sortField;
        if (sortOrderSelect) sortOrderSelect.value = this.state.sortOrder;

        // Reset page and apply filters
        this.state.currentPage = 1;
        this.applyFilters();
        this.savePreferences();
    },

    applyFilters() {
        const search = document.getElementById('searchInput')?.value.toLowerCase() || '';
        const tool = document.getElementById('toolFilter')?.value || '';
        const days = document.getElementById('dateFilter')?.value || '';

        this.state.filteredUpdates = this.state.updates.filter(u => {
            // Search filter
            if (search) {
                const searchable = `${u.tool} ${u.version} ${u.description || ''}`.toLowerCase();
                if (!searchable.includes(search)) return false;
            }

            // Tool filter
            if (tool && u.tool !== tool) return false;

            // Date filter
            if (days && !DateUtils.isWithinDays(u.date, Number.parseInt(days))) {
                return false;
            }

            return true;
        });

        // Sort
        this.state.filteredUpdates.sort((a, b) => {
            let comparison = 0;
            
            if (this.state.sortField === 'date') {
                comparison = new Date(b.date) - new Date(a.date);
            } else if (this.state.sortField === 'tool') {
                comparison = a.tool.localeCompare(b.tool);
            } else if (this.state.sortField === 'version') {
                comparison = a.version.localeCompare(b.version);
            }
            
            return this.state.sortOrder === 'desc' ? comparison : -comparison;
        });

        this.renderCurrentView();
    },

    // ===== Stats =====
    updateStats() {
        const now = new Date();
        const updates = this.state.updates;

        // Total updates
        const total = updates.length;
        
        // Unique tools
        const tools = new Set(updates.map(u => u.tool)).size;
        
        // Updates this month
        const thisMonth = updates.filter(u => {
            const d = new Date(u.date);
            return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        }).length;
        
        // Days since last update
        const mostRecent = updates.length > 0 ? new Date(updates[0].date) : now;
        const daysSince = DateUtils.getDaysSince(mostRecent);

        // Update DOM with animation
        this.animateStat('statTotal', total);
        this.animateStat('statTools', tools);
        this.animateStat('statRecent', thisMonth);
        this.animateStat('statDays', daysSince);
    },

    animateStat(elementId, value) {
        const el = document.getElementById(elementId);
        if (el) {
            AnimationUtils.countUp(el, value, 800);
        }
    },

    populateToolFilter() {
        const tools = [...new Set(this.state.updates.map(u => u.tool))].sort((a, b) => a.localeCompare(b));
        const select = document.getElementById('toolFilter');
        
        if (select) {
            select.innerHTML = '<option value="">Todas as ferramentas</option>' +
                tools.map(t => `<option value="${t}">${t}</option>`).join('');
        }
    },

    // ===== View Rendering =====
    renderCurrentView() {
        const { currentPage, perPage, filteredUpdates, currentView } = this.state;
        const start = (currentPage - 1) * perPage;
        const end = start + perPage;
        const pageUpdates = filteredUpdates.slice(start, end);

        // Hide all views
        document.querySelectorAll('.content-view').forEach(v => v.classList.remove('active'));
        
        // Show current view
        const viewEl = document.getElementById(`${currentView}View`);
        if (viewEl) viewEl.classList.add('active');

        // Toggle pagination visibility
        const paginationContainer = document.getElementById('paginationContainer');
        if (paginationContainer) {
            paginationContainer.style.display = (currentView === 'calendar' || currentView === 'charts') ? 'none' : 'flex';
        }

        // Render based on view type
        switch (currentView) {
            case 'cards':
                this.renderCards(pageUpdates);
                break;
            case 'table':
                this.renderTable(pageUpdates);
                break;
            case 'timeline':
                this.renderTimeline(pageUpdates);
                break;
            case 'calendar':
                this.renderCalendar(filteredUpdates);
                return;
            case 'charts':
                this.renderCharts(filteredUpdates);
                return;
        }

        this.renderPagination();
    },

    renderCards(updates) {
        const grid = document.getElementById('updatesGrid');
        if (!grid) return;

        if (updates.length === 0) {
            grid.innerHTML = Components.emptyState({
                icon: 'inbox',
                title: 'Nenhum update encontrado',
                message: 'Tente ajustar os filtros ou buscar por outro termo'
            });
        } else {
            grid.innerHTML = updates.map((u, i) => {
                const card = Components.updateCard(u);
                return card.replace('class="update-card', `class="update-card" style="animation-delay: ${i * 0.05}s`);
            }).join('');
        }

        lucide.createIcons();
    },

    renderTable(updates) {
        const tbody = document.getElementById('tableBody');
        if (!tbody) return;

        if (updates.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" style="padding: 48px; text-align: center;">
                        ${Components.emptyState({
                            icon: 'inbox',
                            title: 'Nenhum update encontrado',
                            message: 'Tente ajustar os filtros'
                        })}
                    </td>
                </tr>
            `;
        } else {
            tbody.innerHTML = updates.map(u => Components.tableRow(u)).join('');
        }

        // Update table headers with sort indicators
        this.updateTableHeaders();

        lucide.createIcons();
    },

    updateTableHeaders() {
        const headers = document.querySelectorAll('.data-table th');
        headers.forEach(th => {
            th.classList.remove('sorted', 'asc', 'desc');
            
            const field = th.getAttribute('onclick')?.match(/'(\w+)'/)?.[1];
            if (field && field === this.state.sortField) {
                th.classList.add('sorted');
                if (this.state.sortOrder === 'asc') {
                    th.classList.add('asc');
                }
            }
        });
    },

    renderTimeline(updates) {
        const timeline = document.getElementById('timeline');
        if (!timeline) return;

        if (updates.length === 0) {
            timeline.innerHTML = Components.emptyState({
                icon: 'git-commit',
                title: 'Nenhum update na timeline',
                message: 'Aplique filtros diferentes para ver resultados'
            });
        } else {
            timeline.innerHTML = updates.map((u, i) => Components.timelineItem(u, i)).join('');
        }

        lucide.createIcons();
    },

    renderCalendar(updates) {
        const calendarEl = document.getElementById('calendar');
        if (!calendarEl) return;
        
        if (this.state.calendar) {
            this.state.calendar.destroy();
        }

        const tools = [...new Set(updates.map(u => u.tool))];
        
        const events = updates.map(u => ({
            title: `${u.tool}: ${u.version}`,
            start: u.date.split('T')[0],
            backgroundColor: ColorUtils.getToolColor(u.tool, tools),
            borderColor: ColorUtils.getToolColor(u.tool, tools),
            extendedProps: u
        }));

        this.state.calendar = new FullCalendar.Calendar(calendarEl, {
            initialView: 'dayGridMonth',
            headerToolbar: {
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,dayGridWeek,listMonth'
            },
            events: events,
            eventClick: (info) => {
                this.showUpdateDetail(info.event.extendedProps);
            },
            eventDidMount: (info) => {
                tippy(info.el, {
                    content: `<strong>${StringUtils.escapeHtml(info.event.extendedProps.tool)}</strong><br>${StringUtils.escapeHtml(info.event.extendedProps.version)}`,
                    allowHTML: true,
                    theme: 'afrika',
                    animation: 'shift-away',
                    placement: 'top'
                });
            },
            height: 'auto',
            locale: 'pt-br',
            buttonText: {
                today: 'Hoje',
                month: 'Mês',
                week: 'Semana',
                list: 'Lista'
            }
        });

        this.state.calendar.render();

        // Render legend
        this.renderCalendarLegend(tools);
    },

    renderCalendarLegend(tools) {
        const container = document.querySelector('.calendar-container');
        let legend = container?.querySelector('.calendar-legend');
        
        if (!legend) {
            legend = document.createElement('div');
            legend.className = 'calendar-legend';
            container?.appendChild(legend);
        }

        legend.innerHTML = tools.map(tool => `
            <div class="legend-item">
                <span class="legend-color" style="background: ${ColorUtils.getToolColor(tool, tools)}"></span>
                <span>${tool}</span>
            </div>
        `).join('');
    },

    renderCharts(updates) {
        // Check if Chart.js and ChartManager are available
        if (typeof Chart === 'undefined') {
            console.warn('Chart.js not loaded');
            return;
        }
        
        if (typeof ChartManager === 'undefined' || !ChartManager.createTimelineChart) {
            console.warn('ChartManager not ready');
            return;
        }

        // Timeline chart
        const timelineCanvas = document.getElementById('timelineChart');
        if (timelineCanvas) {
            ChartManager.createTimelineChart(timelineCanvas, updates);
        }

        // Tools distribution chart
        const toolsCanvas = document.getElementById('toolsChart');
        if (toolsCanvas) {
            ChartManager.createToolsChart(toolsCanvas, updates);
        }

        // Activity chart
        const activityCanvas = document.getElementById('activityChart');
        if (activityCanvas) {
            ChartManager.createActivityChart(activityCanvas, updates);
        }
    },

    renderPagination() {
        const { currentPage, perPage, filteredUpdates } = this.state;
        const total = filteredUpdates.length;
        const totalPages = Math.ceil(total / perPage);
        const start = (currentPage - 1) * perPage + 1;
        const end = Math.min(currentPage * perPage, total);

        // Update info
        const infoEl = document.getElementById('paginationInfo');
        if (infoEl) {
            infoEl.textContent = total > 0 
                ? `Mostrando ${start}-${end} de ${total} updates`
                : 'Nenhum resultado';
        }

        // Render pagination buttons
        const paginationEl = document.getElementById('pagination');
        if (paginationEl) {
            paginationEl.innerHTML = Components.pagination(currentPage, totalPages);
            lucide.createIcons();
        }
    },

    // ===== Navigation =====
    switchView(view) {
        this.state.currentView = view;
        this.state.currentPage = 1;
        this.renderCurrentView();
        this.savePreferences();
    },

    goToPage(page) {
        const totalPages = Math.ceil(this.state.filteredUpdates.length / this.state.perPage);
        
        if (page < 1 || page > totalPages) return;
        
        this.state.currentPage = page;
        this.renderCurrentView();
        
        // Scroll to top
        DOMUtils.scrollTo(document.querySelector('.toolbar'), 80);
    },

    // ===== Modal =====
    showUpdateDetail(update) {
        const modal = document.getElementById('detailModal');
        const body = document.getElementById('modalBody');
        
        if (modal && body) {
            body.innerHTML = Components.updateDetailModal(update);
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
            lucide.createIcons();
        }
    },

    closeModal() {
        const modal = document.getElementById('detailModal');
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
    },

    openExportModal() {
        const modal = document.getElementById('exportModal');
        if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
            lucide.createIcons();
        }
    },

    closeExportModal() {
        const modal = document.getElementById('exportModal');
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
    },

    performExport() {
        // Get selected format
        const formatRadios = document.querySelectorAll('input[name="exportFormat"]');
        const format = Array.from(formatRadios).find(r => r.checked)?.value || 'csv';

        // Get selected fields
        const fieldCheckboxes = document.querySelectorAll('input[name="exportField"]:checked');
        const fields = Array.from(fieldCheckboxes).map(c => c.value);

        if (fields.length === 0) {
            Toast.error('Selecione pelo menos um campo para exportar', 'Erro');
            return;
        }

        this.exportData(format, fields);
        this.closeExportModal();
    },

    // ===== Loading & Error States =====
    showLoading(show) {
        this.state.isLoading = show;
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.classList.toggle('active', show);
        }
    },

    showError(message) {
        this.state.error = message;
        const banner = document.getElementById('errorBanner');
        const messageEl = document.getElementById('errorMessage');
        
        if (banner && messageEl) {
            messageEl.textContent = message;
            banner.classList.add('visible');
        }
    },

    hideError() {
        this.state.error = null;
        const banner = document.getElementById('errorBanner');
        if (banner) {
            banner.classList.remove('visible');
        }
    },

    // ===== Actions =====
    async refreshData() {
        await this.loadUpdates();
    },

    exportData(format = 'csv', fields = ['tool', 'version', 'date', 'description', 'link']) {
        // Map field names to update properties
        const fieldMap = {
            tool: 'ferramenta',
            version: 'versao',
            date: 'data',
            description: 'descricao',
            link: 'link'
        };

        const data = this.state.filteredUpdates.map(u => {
            const row = {};
            fields.forEach(field => {
                const key = fieldMap[field];
                if (field === 'tool') {
                    row[key] = u.tool;
                } else if (field === 'version') {
                    row[key] = u.version;
                } else if (field === 'date') {
                    row[key] = u.date;
                } else if (field === 'description') {
                    row[key] = u.description || '';
                } else if (field === 'link') {
                    row[key] = u.link || '';
                }
            });
            return row;
        });

        const filename = `afrika-updates-${new Date().toISOString().split('T')[0]}`;

        if (format === 'csv') {
            ExportUtils.toCSV(data, `${filename}.csv`);
        } else {
            ExportUtils.toJSON(data, `${filename}.json`);
        }

        Toast.success(`Dados exportados como ${format.toUpperCase()}`, 'Exportação');
    },

    // ===== API Documentation =====
    toggleEndpoint(id) {
        const endpoint = document.getElementById(id);
        if (endpoint) {
            endpoint.classList.toggle('open');
            lucide.createIcons();
        }
    },

    async copyApiUrl() {
        const url = document.getElementById('apiBaseUrl')?.textContent;
        
        if (url) {
            const success = await ExportUtils.copyToClipboard(url);
            
            const btn = document.querySelector('.api-copy-btn');
            if (btn && success) {
                btn.classList.add('copied');
                btn.innerHTML = '<i data-lucide="check" style="width: 14px; height: 14px;"></i> Copiado!';
                lucide.createIcons();
                
                setTimeout(() => {
                    btn.classList.remove('copied');
                    btn.innerHTML = '<i data-lucide="copy" style="width: 14px; height: 14px;"></i> Copiar';
                    lucide.createIcons();
                }, 2000);
            }
        }
    },

    tryApiEndpoint(path) {
        window.open(this.config.apiUrl + path, '_blank');
    }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => App.init());

// Make App globally available
globalThis.App = App;
