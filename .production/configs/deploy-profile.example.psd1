@{
  Profiles = @{
    production = @{
      ServerIp   = 'SEU_IP_AQUI'
      SshUser    = 'SEU_USUARIO_SSH'
      PemPath    = 'C:\caminho\para\sua-chave.pem'
      RemoteRoot = '/home/azureuser/conect360'
      Adm303Smoke = @{
        Run = $false
        BaseUrl = 'https://api.conect360.com'
        RequesterEmail = 'requester@empresa.com'
        RequesterPassword = '<SENHA_REQUESTER>'
        RequesterMfaCode = ''
        ApproverEmail = 'approver@empresa.com'
        ApproverPassword = '<SENHA_APPROVER>'
        ApproverMfaCode = ''
        TargetEmail = 'target@empresa.com'
        TargetPassword = '<SENHA_TARGET>'
        TargetMfaCode = ''
        SkipTargetAccessCheck = $false
      }
    }

    # Exemplo de perfil adicional (opcional)
    staging = @{
      ServerIp   = 'SEU_IP_STAGING'
      SshUser    = 'SEU_USUARIO_STAGING'
      PemPath    = 'C:\caminho\para\sua-chave-staging.pem'
      RemoteRoot = '/home/azureuser/conect360-staging'
      Adm303Smoke = @{
        Run = $false
        BaseUrl = 'https://api.staging.conect360.com'
        RequesterEmail = 'requester@empresa.com'
        RequesterPassword = '<SENHA_REQUESTER>'
        RequesterMfaCode = ''
        ApproverEmail = 'approver@empresa.com'
        ApproverPassword = '<SENHA_APPROVER>'
        ApproverMfaCode = ''
        TargetEmail = 'target@empresa.com'
        TargetPassword = '<SENHA_TARGET>'
        TargetMfaCode = ''
        SkipTargetAccessCheck = $false
      }
    }
  }
}
