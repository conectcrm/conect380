@{
  Profiles = @{
    production = @{
      # Optional. If omitted, scripts use HEAD.
      GitRef = 'HEAD'

      # Global SSH defaults (can be overridden per VM).
      SshUser = 'root'
      SshPort = 22
      # SshKeyPath = 'C:\Users\seu_usuario\.ssh\id_ed25519'

      # Default remote root (can be overridden per VM).
      RemoteRoot = '/opt/conect360'

      # Where runtime env lives locally and remotely.
      RuntimeEnvLocalPath = 'deploy/contabo/.env.app-vm'
      RuntimeEnvRemoteRelativePath = 'shared/.env.app-vm'

      # API VM: backend + redis
      ApiVm = @{
        Host = '147.93.3.190'
        User = 'root'
        Port = 22
        RemoteRoot = '/opt/conect360'
      }

      # APP VM: frontend + guardian-web
      AppVm = @{
        Host = '147.93.3.241'
        User = 'root'
        Port = 22
        RemoteRoot = '/opt/conect360'
      }

      Urls = @{
        Api = 'https://api.conect360.com'
        App = 'https://conect360.com'
        Guardian = 'https://guardian.conect360.com'
      }

      Smoke = @{
        Enabled = $false
        SuperAdminEmail = ''
        SuperAdminPassword = ''
        SuperAdminMfaCode = ''
        ExpectedOwnerEmpresaId = ''
      }
    }
  }
}
