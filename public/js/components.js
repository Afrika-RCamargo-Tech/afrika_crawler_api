/**
 * Afrika Crawler - Component Renderers
 * Reusable UI component rendering functions
 */

const Components = {
    /**
     * Render an update card
     */
    updateCard(update, options = {}) {
        const { showDetails = true, animate = true } = options;
        const date = DateUtils.format(update.date);
        const relativeDate = DateUtils.getRelative(update.date);
        const detailsLink = StringUtils.generateDetailsLink(update);

        return `
            <article class="update-card${animate ? ' animate-card' : ''}" data-update-id="${update._id || ''}">
                <div class="update-card-header">
                    <span class="update-card-badge">
                        <i data-lucide="package" style="width: 14px; height: 14px;"></i>
                        ${StringUtils.escapeHtml(update.tool)}
                    </span>
                    <time class="update-card-date" datetime="${update.date}" title="${date}">
                        <i data-lucide="clock" style="width: 12px; height: 12px;"></i>
                        ${relativeDate}
                    </time>
                </div>
                <h3 class="update-card-version">${StringUtils.escapeHtml(update.version)}</h3>
                ${update.description ? `
                    <p class="update-card-description">
                        ${StringUtils.escapeHtml(StringUtils.truncate(update.description, 150))}
                    </p>
                ` : `
                    <p class="update-card-description update-card-description-empty">
                        <i data-lucide="file-text" style="width: 14px; height: 14px;"></i>
                        Sem descrição disponível
                    </p>
                `}
                <footer class="update-card-footer">
                    ${detailsLink ? `
                        <a href="${detailsLink}" target="_blank" rel="noopener noreferrer" class="update-card-link">
                            Ver detalhes
                            <i data-lucide="external-link" style="width: 14px; height: 14px;"></i>
                        </a>
                    ` : '<span></span>'}
                    ${showDetails ? `
                        <button class="btn btn-sm btn-ghost" onclick="App.showUpdateDetail(${JSON.stringify(update).replace(/"/g, '&quot;')})" aria-label="Ver informações">
                            <i data-lucide="info" style="width: 16px; height: 16px;"></i>
                        </button>
                    ` : ''}
                </footer>
            </article>
        `;
    },

    /**
     * Render a table row
     */
    tableRow(update) {
        const date = DateUtils.format(update.date);
        const detailsLink = StringUtils.generateDetailsLink(update);

        return `
            <tr>
                <td>
                    <span class="tool-badge">
                        <i data-lucide="package" style="width: 12px; height: 12px;"></i>
                        ${StringUtils.escapeHtml(update.tool)}
                    </span>
                </td>
                <td class="table-version">${StringUtils.escapeHtml(update.version)}</td>
                <td>
                    <time datetime="${update.date}">${date}</time>
                </td>
                <td class="table-description">
                    ${StringUtils.escapeHtml(StringUtils.truncate(update.description || '-', 80))}
                </td>
                <td>
                    <div class="table-actions">
                        ${detailsLink ? `
                            <a href="${detailsLink}" target="_blank" rel="noopener noreferrer" class="btn btn-sm btn-ghost" aria-label="Abrir link externo">
                                <i data-lucide="external-link" style="width: 14px; height: 14px;"></i>
                            </a>
                        ` : ''}
                        <button class="btn btn-sm btn-ghost" onclick="App.showUpdateDetail(${JSON.stringify(update).replace(/"/g, '&quot;')})" aria-label="Ver detalhes">
                            <i data-lucide="info" style="width: 14px; height: 14px;"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    },

    /**
     * Render a timeline item
     */
    timelineItem(update, index = 0) {
        const date = DateUtils.format(update.date);
        const detailsLink = StringUtils.generateDetailsLink(update);

        return `
            <article class="timeline-item" style="animation-delay: ${index * 0.05}s">
                <div class="timeline-dot"></div>
                <time class="timeline-date" datetime="${update.date}">${date}</time>
                <div class="timeline-content">
                    <h4 class="timeline-title">${StringUtils.escapeHtml(update.version)}</h4>
                    <span class="timeline-tool">${StringUtils.escapeHtml(update.tool)}</span>
                    ${update.description ? `
                        <p class="timeline-description">
                            ${StringUtils.escapeHtml(StringUtils.truncate(update.description, 200))}
                        </p>
                    ` : ''}
                    ${detailsLink ? `
                        <a href="${detailsLink}" target="_blank" rel="noopener noreferrer" class="timeline-link">
                            Ver detalhes
                            <i data-lucide="external-link" style="width: 14px; height: 14px;"></i>
                        </a>
                    ` : ''}
                </div>
            </article>
        `;
    },

    /**
     * Render empty state
     */
    emptyState(options = {}) {
        const { 
            icon = 'inbox', 
            title = 'Nenhum resultado encontrado',
            message = 'Tente ajustar os filtros de busca'
        } = options;

        return `
            <div class="empty-state">
                <div class="empty-state-icon">
                    <i data-lucide="${icon}" style="width: 40px; height: 40px;"></i>
                </div>
                <h3>${title}</h3>
                <p>${message}</p>
            </div>
        `;
    },

    /**
     * Render stat card
     */
    statCard(options) {
        const { icon, color, value, label, trend } = options;

        return `
            <div class="stat-card">
                <div class="stat-icon ${color}">
                    <i data-lucide="${icon}" style="width: 24px; height: 24px;"></i>
                </div>
                <div class="stat-info">
                    <span class="stat-value" data-count="${value}">${value}</span>
                    <span class="stat-label">${label}</span>
                    ${trend ? `
                        <span class="stat-trend ${trend.direction}">
                            <i data-lucide="${trend.direction === 'up' ? 'trending-up' : 'trending-down'}" style="width: 12px; height: 12px;"></i>
                            ${trend.value}
                        </span>
                    ` : ''}
                </div>
            </div>
        `;
    },

    /**
     * Render pagination
     */
    pagination(currentPage, totalPages, options = {}) {
        const { maxVisible = 5 } = options;

        if (totalPages <= 1) return '';

        let pages = [];
        
        // Previous button
        pages.push(`
            <button class="page-btn" onclick="App.goToPage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''} aria-label="Página anterior">
                <i data-lucide="chevron-left" style="width: 16px; height: 16px;"></i>
            </button>
        `);

        // Calculate visible pages
        let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
        let endPage = Math.min(totalPages, startPage + maxVisible - 1);
        
        if (endPage - startPage < maxVisible - 1) {
            startPage = Math.max(1, endPage - maxVisible + 1);
        }

        // First page
        if (startPage > 1) {
            pages.push(`<button class="page-btn" onclick="App.goToPage(1)">1</button>`);
            if (startPage > 2) {
                pages.push(`<span class="pagination-ellipsis">...</span>`);
            }
        }

        // Page numbers
        for (let i = startPage; i <= endPage; i++) {
            pages.push(`
                <button class="page-btn ${i === currentPage ? 'active' : ''}" onclick="App.goToPage(${i})" ${i === currentPage ? 'aria-current="page"' : ''}>
                    ${i}
                </button>
            `);
        }

        // Last page
        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                pages.push(`<span class="pagination-ellipsis">...</span>`);
            }
            pages.push(`<button class="page-btn" onclick="App.goToPage(${totalPages})">${totalPages}</button>`);
        }

        // Next button
        pages.push(`
            <button class="page-btn" onclick="App.goToPage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''} aria-label="Próxima página">
                <i data-lucide="chevron-right" style="width: 16px; height: 16px;"></i>
            </button>
        `);

        return pages.join('');
    },

    /**
     * Render modal content for update detail
     */
    updateDetailModal(update) {
        const date = DateUtils.format(update.date);
        const relativeDate = DateUtils.getRelative(update.date);
        const detailsLink = StringUtils.generateDetailsLink(update);

        return `
            <div class="detail-hero">
                <div class="detail-hero-badge">
                    <span class="tool-badge tool-badge-lg">${StringUtils.escapeHtml(update.tool)}</span>
                </div>
                <div class="detail-hero-version">
                    <span class="version-label">Versão</span>
                    <span class="version-number">${StringUtils.escapeHtml(update.version)}</span>
                </div>
            </div>
            
            <div class="detail-grid">
                <div class="detail-item">
                    <span class="detail-label">
                        <i data-lucide="calendar" style="width: 14px; height: 14px;"></i>
                        Data de Lançamento
                    </span>
                    <span class="detail-value">
                        ${date}
                        <span class="detail-relative-date">${relativeDate}</span>
                    </span>
                </div>
                ${update.description ? `
                    <div class="detail-item detail-full">
                        <span class="detail-label">
                            <i data-lucide="file-text" style="width: 14px; height: 14px;"></i>
                            Notas da Versão
                        </span>
                        <p class="detail-description">
                            ${StringUtils.escapeHtml(update.description)}
                        </p>
                    </div>
                ` : ''}
            </div>
            ${detailsLink ? `
                <div class="modal-action">
                    <a href="${detailsLink}" target="_blank" rel="noopener noreferrer" class="btn btn-primary btn-glow">
                        <i data-lucide="external-link" style="width: 18px; height: 18px;"></i>
                        Ver documentação oficial
                    </a>
                </div>
            ` : ''}
        `;
    },

    /**
     * Render skeleton loading cards
     */
    skeletonCards(count = 6) {
        let cards = '';
        for (let i = 0; i < count; i++) {
            cards += `
                <div class="update-card skeleton-card">
                    <div class="skeleton-header">
                        <div class="skeleton skeleton-badge" style="width: 100px; height: 28px;"></div>
                        <div class="skeleton skeleton-date" style="width: 80px; height: 16px;"></div>
                    </div>
                    <div class="skeleton skeleton-title" style="width: 80%; height: 24px; margin: 16px 0 8px;"></div>
                    <div class="skeleton skeleton-text" style="width: 100%; height: 16px; margin-bottom: 8px;"></div>
                    <div class="skeleton skeleton-text" style="width: 60%; height: 16px;"></div>
                </div>
            `;
        }
        return cards;
    }
};

// Add extra styles for components
const componentStyles = document.createElement('style');
componentStyles.textContent = `
    .animate-card {
        animation: card-enter 0.4s ease backwards;
    }
    
    @keyframes card-enter {
        from {
            opacity: 0;
            transform: translateY(20px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    
    .pagination-ellipsis {
        padding: 0 8px;
        color: var(--text-muted);
    }
    
    .detail-hero {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 32px 20px;
        margin: -20px -24px 24px -24px;
        background: linear-gradient(135deg, var(--color-primary-alpha) 0%, transparent 100%);
        border-bottom: 1px solid var(--border-color);
        border-radius: var(--border-radius-lg) var(--border-radius-lg) 0 0;
        text-align: center;
    }
    
    .detail-hero-badge {
        margin-bottom: 16px;
    }
    
    .tool-badge-lg {
        font-size: 0.9375rem;
        padding: 10px 20px;
        border-radius: 999px;
    }
    
    .detail-hero-version {
        display: flex;
        flex-direction: column;
        gap: 4px;
    }
    
    .version-label {
        font-size: 0.6875rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        color: var(--text-muted);
    }
    
    .version-number {
        font-size: 1.75rem;
        font-weight: 700;
        color: var(--text-primary);
        letter-spacing: -0.02em;
    }
    
    .detail-grid {
        display: grid;
        gap: 20px;
    }
    
    .detail-item {
        display: flex;
        flex-direction: column;
        gap: 8px;
        padding: 16px;
        background: var(--bg-tertiary);
        border-radius: var(--border-radius-md);
        border: 1px solid var(--border-color);
        transition: all var(--transition-fast);
    }
    
    .detail-item:hover {
        border-color: var(--border-hover);
    }
    
    .detail-full {
        grid-column: 1 / -1;
    }
    
    .detail-label {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 0.6875rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: var(--color-primary);
    }
    
    .detail-value {
        font-size: 1rem;
        font-weight: 500;
        color: var(--text-primary);
        line-height: 1.5;
    }
    
    .detail-relative-date {
        display: inline-block;
        margin-left: 8px;
        padding: 2px 8px;
        font-size: 0.75rem;
        font-weight: 500;
        color: var(--text-muted);
        background: var(--bg-secondary);
        border-radius: var(--border-radius-sm);
    }
    
    .detail-description {
        font-size: 0.9375rem;
        line-height: 1.8;
        color: var(--text-secondary);
        white-space: pre-wrap;
        margin: 0;
    }
    
    .modal-action {
        margin-top: 24px;
    }
    
    .modal-action .btn {
        width: 100%;
        padding: 14px 24px;
        font-size: 0.9375rem;
        font-weight: 600;
        justify-content: center;
    }
    
    .btn-glow {
        box-shadow: 0 4px 14px -3px var(--color-primary-alpha);
        transition: all var(--transition-normal);
    }
    
    .btn-glow:hover {
        box-shadow: 0 6px 20px -3px var(--color-primary-alpha);
        transform: translateY(-1px);
    }
    
    .skeleton-card {
        min-height: 200px;
    }
    
    .skeleton-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
`;
document.head.appendChild(componentStyles);

// Make Components globally available
window.Components = Components;
