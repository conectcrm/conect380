# Guardian endpoint discovery report

- RunId: 20260308-165603
- GeneratedAt: 2026-03-08 16:56:08
- Status: PASS

| BaseUrl | LoginStatus | MfaStep | MfaVerifyStatus | /guardian/bff/overview | /api/guardian/bff/overview | GuardianAvailable |
| --- | ---: | --- | ---: | ---: | ---: | --- |
| http://localhost:3001 | 201 | verified_with_dev_code | 201 | 200 | 404 | yes |
| http://192.168.200.44:3000 | 201 | verified_with_dev_code | 201 | 404 | 200 | yes |
| http://192.168.200.44:3001 | 201 | verified_with_dev_code | 201 | 200 | 404 | yes |

## Resultado
- Ao menos um endpoint Guardian encontrado com sucesso.
