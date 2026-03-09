# Fluxo de Workspace Runtime

## Objetivo

Separar:

1. o checkout usado para Git, ajustes e PRs
2. o checkout usado para executar e validar o sistema

Essa separacao evita regressao visual causada por `switch`, `checkout` ou tentativa de limpeza da branch ativa no mesmo diretorio em que o sistema esta rodando.

## Diretorios

1. Workspace principal Git: `c:\Projetos\conect360`
2. Clone runtime dedicado: `c:\Projetos\conect360-runtime`

## Comandos

Preparar o clone runtime:

```powershell
npm run runtime:prepare
```

Instalar dependencias do clone runtime:

```powershell
npm run runtime:deps:install
```

Sincronizar o clone runtime com o `HEAD` atual do workspace principal:

```powershell
npm run runtime:sync
```

Esse comando usa `npm ci` na raiz, `backend`, `frontend-web`, `admin-web` e `guardian-web`.

Subir o sistema a partir do clone runtime:

```powershell
npm run runtime:start:all
```

Subir apenas backend:

```powershell
npm run runtime:start:backend
```

Subir apenas frontend:

```powershell
npm run runtime:start:frontend
```

Subir o Guardian:

```powershell
npm run runtime:start:guardian-web
```

## Regra operacional

1. Git e mudancas de branch ficam em `c:\Projetos\conect360`.
2. Execucao do sistema para validacao fica em `c:\Projetos\conect360-runtime`.
3. Antes de subir o sistema, rode `npm run runtime:sync`.
4. Se ainda nao houver dependencias, rode `npm run runtime:deps:install`.
5. Instale dependencias com `npm ci`, nao com `npm install`.
6. Nao fazer desenvolvimento direto no clone runtime.

## Observacoes

1. O clone runtime fica em `detached HEAD` por design. Isso reduz risco de commits acidentais.
2. O clone runtime sincroniza com o commit atual do workspace principal, nao com mudancas nao commitadas.
3. Se o clone runtime estiver com alteracoes locais, a sincronizacao e bloqueada para evitar sobrescrita silenciosa.
4. Se `npm install` alterar arquivos rastreados no clone runtime, guarde isso com `git stash` e refaca a instalacao com `npm ci`.
