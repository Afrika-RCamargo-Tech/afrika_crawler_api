# afrika_crawler_api

Crawler para monitorar updates de ferramentas de segurança.

## Instalação

```bash
bun install
```

## Execução

### Modo RSS Híbrido (recomendado)

Usa o feed RSS do Veracode para descobrir categorias automaticamente, depois faz crawling das páginas.
Vantagem: se a Veracode adicionar novas categorias, o sistema pega automaticamente.

```bash
USE_RSS=true bun run src/index.ts
```

### Modo Crawler Original

Usa URLs hardcoded. Mais controle manual, mas precisa atualizar o código se houver novas categorias.

```bash
bun run src/index.ts
```

## Scripts Úteis

```bash
# Testar o fetcher RSS
bun run scripts/test-rss.ts

# Rodar a API
bun run api

# Gerar sumário
bun run scripts/generate-summary.ts
```

## Ferramentas Suportadas

- **Veracode** - Updates de CLI, Dynamic Analysis, EASM, Fix, Integrations, Platform, SCA, Static Analysis, Training, VRM

## Estrutura

```
src/
├── index.ts           # Entry point do crawler
├── api.ts             # API HTTP
├── database.ts        # Conexão MongoDB
├── interfaces/
│   └── IUpdateFetcher.ts
├── models/
│   └── Update.ts
└── strategies/
    ├── VeracodeFetcher.ts      # Crawler original (URLs hardcoded)
    └── VeracodeRssFetcher.ts   # Fetcher híbrido (RSS + crawling)
```
