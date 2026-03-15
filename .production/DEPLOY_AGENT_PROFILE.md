# Deploy com Perfil Local (Agente IA)

## Objetivo
Permitir deploy de producao sem precisar informar `ServerIp`, `SshUser` e `PemPath` em toda execucao.

## Arquivos
- Perfil local (nao versionado): `.production/configs/deploy-profile.local.psd1`
- Exemplo versionado: `.production/configs/deploy-profile.example.psd1`
- Script oficial: `.production/scripts/release-azure-vm.ps1`
- Atalho: `.production/scripts/release-production.ps1`

## Como funciona
1. O script tenta ler o perfil em `.production/configs/deploy-profile.local.psd1`.
2. Se existir, preenche automaticamente os campos de conexao.
3. Opcionalmente, pode carregar configuracao de smoke ADM-303 pela chave `Adm303Smoke`.
4. Parametros passados na linha de comando sempre sobrescrevem o perfil.

## Comandos
```powershell
# Dry-run (mostra comandos remotos, sem executar)
.\.production\scripts\release-production.ps1

# Deploy real
.\.production\scripts\release-production.ps1 -Execute

# Deploy com preflight desativado
.\.production\scripts\release-production.ps1 -SkipPreflight -Execute
```

## Perfis adicionais
Para ambientes extras, adicione no mesmo arquivo:

```powershell
@{
  Profiles = @{
    production = @{ ... }
    staging    = @{ ... }
  }
}
```

E execute:

```powershell
.\.production\scripts\release-production.ps1 -ProfileName staging -Execute
```

## Variavel de ambiente (opcional)
Tambem e possivel apontar um arquivo de perfil customizado:

```powershell
$env:CONNECT360_DEPLOY_PROFILE_PATH = 'C:\caminho\deploy-profile.local.psd1'
```

## Seguranca
- O arquivo `deploy-profile.local.psd1` esta no `.gitignore`.
- Nao salvar conteudo da chave privada no repositorio.
- Apenas referenciar o caminho da chave `.pem`.
- Se usar `Adm303Smoke`, mantenha o arquivo apenas local (nao versionado) para proteger credenciais.
