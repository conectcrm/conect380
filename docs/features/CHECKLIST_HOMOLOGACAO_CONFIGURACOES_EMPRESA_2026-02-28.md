# Checklist de Homologação - Configurações da Empresa

Data: 2026-02-28  
Escopo: tela `Configurações da Empresa` (`/gestao/empresa/configuracoes`), APIs `/empresas/config` e `PUT /empresas/:id`.

## 1. Pré-condições

- Usuário `admin` ativo e vinculado a uma empresa.
- Usuário `gerente` ativo e vinculado à mesma empresa.
- Ambiente com backend e frontend atualizados.

## 2. Fluxos de Admin (deve funcionar)

1. Abrir a tela e validar carregamento sem erro.
2. Alterar dados gerais (ex.: descrição, cores) e salvar.
3. Alterar dados básicos da empresa (ex.: telefone) e salvar.
4. Configurar SMTP (host/porta/usuário/senha) e executar `Testar Conexão SMTP`.
5. Executar `Backup Agora` e validar mensagem de sucesso.
6. Abrir `Ver Histórico` e validar presença do snapshot recém-gerado.
7. Executar `Restaurar Padrões` e validar retorno aos defaults.

## 3. Fluxos de Somente Leitura (gerente)

1. Abrir a tela e validar banner de somente leitura.
2. Validar botões de escrita desabilitados:
- `Salvar Alterações`
- `Restaurar Padrões`
- `Executar Backup Agora`
- upload/remoção de logo
3. Validar tentativa de escrita bloqueada no backend:
- `PUT /empresas/config` => `403`
- `POST /empresas/config/backup/execute` => `403`
- `PUT /empresas/:id` => `403`

## 4. Validações de Backend

1. `POST /empresas/config/smtp/test` sem credenciais obrigatórias retorna `400`.
2. `GET /empresas/config/backup/history` retorna lista (vazia ou com snapshots) sem erro.
3. Segredos mascarados no retorno (`__CONFIGURED_SECRET__` quando configurados).

## 5. Critérios de Aceite

- Fluxos de admin completos e persistidos.
- Usuário sem permissão de update não consegue alterar dados.
- Backup e histórico funcionais.
- Tela sem erros de carregamento/salvamento.
- Sem regressão na suíte e2e backend.

## 6. Evidências mínimas

- Captura da tela em modo admin (antes/depois de salvar).
- Captura da tela em modo gerente (somente leitura).
- Log/response de:
- `POST /empresas/config/smtp/test`
- `POST /empresas/config/backup/execute`
- `GET /empresas/config/backup/history`
