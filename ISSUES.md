# 📋 Issues & Melhorias

## 🐛 Bugs - Abertos

(Nenhum bug aberto no momento)

## 🚀 Melhorias - Abertos

(Nenhuma melhoria pendente no momento)

## ⏳ Em Andamento

(Nenhum item no momento)

## ✅ Resolvidos

- [x] **Bug #1 - Seletor de Views não respeita Local Storage** ✓
  - Descrição: O seletor de views não respeita o que foi armazenado no Local Storage, então quando carrega a página, vai para a view que ficou salva mas o seletor fica como `Cards`.
  - Solução: 
    - Adicionado método `syncViewToggle()` em [public/js/app.js](public/js/app.js#L57-L67)
    - Método sincroniza os botões `.view-btn` com a preferência salva
    - Atualiza classes `active` e atributo `aria-selected` corretamente
    - Chamado automaticamente em `loadPreferences()`
  - Resultado: O seletor de views agora reflete corretamente a view salva no Local Storage

- [x] **Melhoria #1 - Navbar API Docs à Direita** ✓
  - Descrição: Mover API Docs para a direita na navbar com seta indicando direção
  - Solução:
    - Reordenado botões em [public/index.html](public/index.html#L66-L83)
    - Adicionado `header-divider` como separador visual
    - API Docs agora aparece à direita com seta `arrow-right` (→)
    - CSS do divisor em [public/css/layout.css](public/css/layout.css#L73-L78)
    - Consistente com api-docs.html que tem seta `arrow-left` (←) para voltar
  - Resultado: Navegação intuitiva entre Dashboard e API Docs

- [x] **Melhoria #2 - Toast não sobrepõe Navbar** ✓
  - Descrição: Notificações toast ficavam sobrepondo a navbar, escondendo botões
  - Solução:
    - Ajustado `.toast-container` em [public/css/components.css](public/css/components.css#L388-L397)
    - Desktop: `top: calc(70px + var(--space-4))` - abaixo do header
    - Mobile: `top: calc(60px + var(--space-3))` - ajustado para header menor
  - Resultado: Toasts aparecem abaixo da navbar sem sobrepor elementos

- [x] **Melhoria #3 - Documentação da API Completa** ✓
  - Descrição: Criar página dedicada com documentação completa e interativa da API
  - Solução Implementada:
    - **Página dedicada** [public/api-docs.html](public/api-docs.html) completamente reformulada
    - **CDNs integrados:**
      - Google Fonts (Inter, JetBrains Mono)
      - Highlight.js 11.9.0 com suporte a JSON, JavaScript, Python e Bash
      - Lucide Icons
      - AOS (Animate on Scroll) para animações elegantes
      - Tippy.js + Popper.js para tooltips interativos
    - **Layout profissional:**
      - Sidebar com Table of Contents (navegação fixa com scroll tracking)
      - Grid de info cards com ícones (Base URL, Autenticação, Formato, Rate Limit)
      - Status indicator real-time da API com latência
    - **2 Endpoints documentados:**
      - `GET /` - Health check
      - `GET /updates` - Lista updates com parâmetros (tool, limit)
    - **Cada endpoint possui:**
      - Descrição detalhada
      - Query parameters com badges (optional/required)
      - Exemplos de código em 3 linguagens: cURL, JavaScript, Python
      - Playground interativo com teste ao vivo
      - Botão de copiar código/resposta
      - Status HTTP e tempo de resposta
    - **Sistema de Toast:** Notificações elegantes para feedback de ações
    - **Accordion toggle:** Endpoints expandem/colapsam com animação suave
    - **Acessibilidade:** role="button", tabindex, keyboard handlers (Enter/Space)
    - **Footer** com links úteis (Dashboard, GitHub)
    - **Responsivo completo:** Mobile-first com sidebar oculta em mobile
    - **Tema claro/escuro:** Integração perfeita com ThemeManager
  - Resultado: Documentação interativa de nível profissional que facilita testes e integração da API

- [x] **Melhoria #2 - Modal de Configuração de Exportação** ✓
  - Descrição: Adicionar modal para configurar o relatório antes de exportar
  - Funcionalidade: Permitir ao usuário personalizar o que será incluído no relatório
  - Solução:
    - Criado novo modal de exportação ([public/index.html](public/index.html#L482-L527)) com interface intuitiva
    - Seleção de formato: CSV ou JSON
    - Checkboxes para incluir/excluir campos: Ferramenta, Versão, Data, Descrição, Link
    - Adicionados métodos em [public/js/app.js](public/js/app.js#L564-L596): `openExportModal()`, `closeExportModal()`, `performExport()`
    - Função `exportData()` modificada para aceitar array de campos customizáveis
    - Botão "Exportar" no header agora abre modal em vez de fazer exportação direta
    - Modal fecha ao clicar no overlay ou no botão X
  - Resultado: Usuários podem personalizar completamente o que será exportado antes de fazer o download

- [x] **Melhoria #1 - Remover Notificação de Troca de Tema** ✓
  - Descrição: Não faz sentido notificar ao trocar tema, o próprio site já fornece feedback visual
  - Solução: Remover toast/notificação quando tema é alterado
  - Resultado: Removido o toast de notificação do método `toggle()` em [public/js/theme.js](public/js/theme.js#L72-L76). A alternância de tema agora funciona silenciosamente, fornecendo feedback visual através da mudança imediata de cores sem notificação intrusiva.

- [x] **Bug #4 - Responsividade Mobile First** ✓
  - Descrição: Garantir responsividade completa da aplicação pensando em mobile first
  - Escopo: Todos os componentes e views
  - Solução:
    - Implementado abordagem **mobile-first** com 4 breakpoints:
      - **Mobile (< 480px)**: Otimizações extremas para smartphones pequenos
      - **Small (480px - 767px)**: Adaptação para dispositivos médios
      - **Medium (768px - 1023px)**: Tablets em orientação portrait
      - **Large (1024px+)**: Desktop e tablets landscape
    - Melhorias em `public/css/variables.css`: Ajuste de espaçamento e tipografia por breakpoint
    - Melhorias em `public/css/layout.css`: 
      - Header responsivo com ocultação de logo text e ícones em mobile
      - Stats bar em 1 coluna (mobile) → 2 colunas (tablet) → 4 colunas (desktop)
      - Toolbar com itens empilhados em mobile, flexível em tablet+
      - View toggle com ícones only em mobile, com labels em desktop
    - Melhorias em `public/css/views.css`:
      - Cards grid: 1 coluna (mobile) → 2 (tablet) → 3 (desktop)
      - Tabela com scroll horizontal touch-friendly em mobile
      - Timeline com padding ajustado para mobile
      - Charts grid: 1 coluna (mobile) → 2 (desktop)
    - Melhorias em `public/css/components.css`:
      - **Touch targets >= 44x44px** para todos os botões e inputs em mobile
      - Fonte mínima 16px em inputs para evitar zoom automático do iOS
      - Modais fullscreen em mobile, centrados em tablet+
      - Toast notifications adaptativas com full-width em mobile
      - Pagination com flex-wrap em mobile
    - Melhorias em `public/css/api-docs.css`: Layouts responsive para documentação
    - Melhorias em `public/css/base.css`: 
      - Smooth scrolling (-webkit-overflow-scrolling: touch)
      - Prevenção de zoom ao focar inputs
      - User-select otimizado para mobile
    - Viewport meta tag confirmado como presente no HTML
  - Resultado: Aplicação completamente responsiva com experiência otimizada em todos os tamanhos de tela

- [x] **Bug #3 - Paginação em Views Incompatíveis** ✓
  - Descrição: Paginação aparece em todas as visões, mas só faz sentido em `Cards`, `Tabela` e `Timeline`
  - Problema: `Calendário` já estava correto (sem paginação), mas `Analytics` ainda tinha
  - Solução:
    - Modificado condicional em `renderCurrentView()` para ocultar paginação em `calendar` E `charts` (Analytics)
    - Mudança em [public/js/app.js](public/js/app.js#L298-L302): Adicionada condição `|| currentView === 'charts'`
    - Paginação agora aparece apenas em `cards`, `table` e `timeline`, conforme esperado

- [x] **Bug #2 - Layout Inconsistente em Cards sem Descrição** ✓
  - Descrição: Na visão de `Card`, quando um update não tem descrição, o "Ver detalhes" e botão info sobem
  - Problema: Essas ações deveriam ser sempre o footer do card, fixadas embaixo, mantendo consistência visual
  - Solução:
    - Adicionado placeholder amigável com ícone quando não há descrição: "Sem descrição disponível"
    - Alterado `margin-top` para `margin-top: auto` no footer para fixar ao final do card
    - Adicionado `flex-grow: 1` na descrição para ocupar espaço disponível
    - CSS `.update-card-description-empty` com estilo diferenciado (itálico, opacity reduzida)
    - Layout agora mantém consistência visual com e sem descrição

- [x] **Bug #1 - Ordenação de Tabela Quebrada** ✓
  - Descrição: A ordenação na tabela na visão de `Tabela` só funciona através dos dropdowns
  - Problema: Antes funcionava ao clicar no header da tabela. Esperado: clicar em `Ferramenta` ordena por ferramenta, clicar novamente inverte a ordem (crescente/decrescente). A mudança deveria refletir tanto no header quanto nos dropdowns.
  - Solução: 
    - Implementado método `handleSort()` que permite clicar nos headers para ordenar
    - Ícone `arrow-up-down` sutil (opacity 0.25) em todos os headers indicando que são ordenáveis
    - Ao ordenar: ícone padrão desaparece, mostra `arrow-up` (asc) ou `arrow-down` (desc) com cor primária
    - Animação fluida com efeito "bounce" profissional (0.6s cubic-bezier)
    - Sincronização automática com dropdowns de ordenação

---

## 📝 Instruções

**Para adicionar um novo issue:**
```
- [ ] **[Tipo] #N - Título Descritivo**
  - Descrição: Explicação clara do problema/melhoria
  - [Detalhes adicionais conforme necessário]
```

**Tipos:** Bug, Melhoria, Refatoração, Performance, etc.
