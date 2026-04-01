#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');

const copyChecks = [
  {
    file: path.join(projectRoot, 'src', 'features', 'auth', 'LoginPage.tsx'),
    requiredFragments: [
      'Bem-vindo',
      'Faça login para acessar sua conta.',
      'Ainda não tem conta?',
      'Teste grátis por 30 dias',
      'Sem cartão de crédito',
      'Ativação em poucos minutos',
      'histórico único por cliente',
      'cobrança e recorrência',
      'Automações com IA para triagem e produtividade',
      'decisões rápidas',
      'Pipeline e conversões',
      'Receitas e cobranças',
      'uma única plataforma',
      'código enviado para concluir seu acesso com segurança',
      'use o código exibido na tela.',
    ],
    forbiddenFragments: [
      'Acesse o Conect360',
      'Bem-vindo de volta!',
      'Faca login para continuar sua operacao.',
      'No primeiro acesso, use sua senha temporaria.',
      'Faça login para continuar sua operação.',
      'No primeiro acesso, use sua senha temporária.',
      'Ainda nao tem conta?',
      'Teste gratis por 30 dias',
      'Sem cartao de credito',
      'Ativacao em poucos minutos',
      'historico unico por cliente',
      'cobranca e recorrencia',
      'Automacoes com IA para triagem e produtividade',
      'decisoes rapidas',
      'Pipeline e conversoes',
      'Receitas e cobrancas',
      'uma unica plataforma',
      'codigo enviado para concluir seu acesso com seguranca',
      'use o codigo exibido na tela.',
    ],
  },
  {
    file: path.join(projectRoot, 'src', 'features', 'auth', 'ForgotPasswordPage.tsx'),
    requiredFragments: [
      'Recuperar acesso',
      'Não foi possível processar sua solicitação. Tente novamente em instantes.',
      'Verifique sua caixa de entrada ou a pasta de spam.',
      'Enviar link de recuperação',
      'Informe um e-mail válido para continuar',
    ],
    forbiddenFragments: [
      'Nao foi possivel processar sua solicitacao. Tente novamente em instantes.',
      'Enviar link de recuperacao',
      'Informe um e-mail valido para continuar',
    ],
  },
  {
    file: path.join(projectRoot, 'src', 'features', 'auth', 'ResetPasswordPage.tsx'),
    requiredFragments: [
      'Defina uma nova senha',
      'Não encontramos um token válido de recuperação. Solicite um novo link e tente novamente.',
      'Mínimo de 6 caracteres.',
      'As senhas informadas não conferem.',
      'Token inválido ou expirado. Solicite uma nova recuperação de senha.',
    ],
    forbiddenFragments: [
      'Nao encontramos um token valido de recuperacao. Solicite um novo link e tente novamente.',
      'Minimo de 6 caracteres.',
      'As senhas informadas nao conferem.',
      'Token invalido ou expirado. Solicite uma nova recuperacao de senha.',
    ],
  },
  {
    file: path.join(projectRoot, 'src', 'features', 'auth', 'RegistroEmpresaPage.tsx'),
    requiredFragments: [
      'Vamos começar com as informações da sua empresa',
      'Preencha os campos obrigatórios antes de continuar.',
      'Próximo',
      'Já tem uma conta?',
      'Política de Privacidade',
    ],
    forbiddenFragments: [
      'Vamos comecar com as informacoes da sua empresa',
      'Preencha os campos obrigatorios antes de continuar.',
      'Proximo',
      'Ja tem uma conta?',
      'Politica de Privacidade',
    ],
  },
  {
    file: path.join(projectRoot, 'src', 'pages', 'TrocarSenhaPage.tsx'),
    requiredFragments: [
      'Dados de sessão inválidos. Faça login novamente.',
      'Sessão inválida',
      'Não foi possível identificar sua sessão. Por favor, faça login novamente.',
      'Por segurança, troque sua senha temporária.',
      'Senha Temporária',
      'Senhas não conferem',
    ],
    forbiddenFragments: [
      'Dados de sessao invalidos. Faca login novamente.',
      'Sessao invalida',
      'Nao foi possivel identificar sua sessao. Por favor, faca login novamente.',
      'Por seguranca, troque sua senha temporaria.',
      'Senha Temporaria',
      'Senhas nao conferem',
    ],
  },
  {
    file: path.join(projectRoot, 'src', 'features', 'auth', 'VerificacaoEmailPage.tsx'),
    requiredFragments: [
      'Token de verificação não encontrado',
      'Conta ativada com sucesso! Faça login para continuar.',
      'O link de verificação expirou',
      'Você será redirecionado para o login em alguns segundos...',
      'Precisa de ajuda?',
    ],
    forbiddenFragments: [
      'Token de verificacao nao encontrado',
      'Conta ativada com sucesso! Faca login para continuar.',
      'O link de verificacao expirou',
      'Voce sera redirecionado para o login em alguns segundos...',
    ],
  },
  {
    file: path.join(projectRoot, 'src', 'config', 'menuConfig.ts'),
    requiredFragments: [
      'Cotações de Compras',
      'Cotações',
      'Aprovações de Compras',
      'Aprovações',
    ],
    forbiddenFragments: [
      'Cotacoes de Compras',
      'Cotacoes',
      'Aprovacoes de Compras',
      'Aprovacoes',
    ],
  },
];

const normalize = (value) =>
  value
    .normalize('NFC')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n');

function main() {
  const findings = [];
  for (const target of copyChecks) {
    if (!fs.existsSync(target.file)) {
      findings.push({
        type: 'missing_file',
        file: target.file,
      });
      continue;
    }

    const content = normalize(fs.readFileSync(target.file, 'utf8'));

    for (const fragment of target.forbiddenFragments) {
      if (content.includes(fragment)) {
        findings.push({
          type: 'forbidden',
          file: target.file,
          fragment,
        });
      }
    }

    for (const fragment of target.requiredFragments) {
      if (!content.includes(fragment)) {
        findings.push({
          type: 'missing',
          file: target.file,
          fragment,
        });
      }
    }
  }

  if (findings.length > 0) {
    console.error('\n[copy-check] Regressao de acentuacao detectada em textos criticos:\n');
    for (const finding of findings) {
      const relativeFile =
        finding.file && path.relative(projectRoot, finding.file).replace(/\\/g, '/');

      if (finding.type === 'missing_file') {
        console.error(`- Arquivo nao encontrado: ${relativeFile || finding.file}`);
      } else if (finding.type === 'forbidden') {
        console.error(`- ${relativeFile}: texto sem acento detectado: "${finding.fragment}"`);
      } else {
        console.error(
          `- ${relativeFile}: texto acentuado esperado nao encontrado: "${finding.fragment}"`,
        );
      }
    }
    console.error('\n[copy-check] Corrija os textos antes de continuar.\n');
    process.exit(1);
  }

  console.log('[copy-check] OK: copy de telas/menus criticos com acentuacao validada.');
}

main();
