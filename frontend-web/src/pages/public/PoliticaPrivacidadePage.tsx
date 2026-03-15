import React from 'react';
import { Link } from 'react-router-dom';

const VERSAO = '2026-02-23';

const sectionClass =
  'rounded-2xl border border-[#D8E4E8] bg-white p-5 md:p-6 shadow-[0_8px_24px_rgba(0,35,51,0.05)]';

const PoliticaPrivacidadePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F4FBF9] to-[#F7FAFC] text-[#002333]">
      <div className="mx-auto w-full max-w-4xl px-4 py-8 md:px-6 md:py-10">
        <div className="mb-6 flex items-center justify-between gap-3">
          <Link
            to="/login"
            className="inline-flex items-center rounded-xl border border-[#CFE0E6] bg-white px-3 py-2 text-sm font-medium text-[#335A66] hover:border-[#9FC2CC] hover:text-[#002333]"
          >
            Voltar
          </Link>
          <span className="rounded-full border border-[#CFE8E2] bg-[#EAF7F4] px-3 py-1 text-xs font-semibold text-[#0F6E74]">
            Versão {VERSAO}
          </span>
        </div>

        <header className="mb-6 rounded-3xl border border-[#D8E4E8] bg-white p-6 shadow-[0_14px_40px_rgba(0,35,51,0.06)] md:p-8">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#159A9C]">
            Documento Legal
          </p>
          <h1 className="text-2xl font-bold md:text-3xl">Política de Privacidade - Conect360</h1>
          <p className="mt-3 text-sm leading-6 text-[#4E6B75] md:text-base">
            Esta política descreve como a Conect360 coleta, utiliza, compartilha, armazena e
            protege dados pessoais tratados em seus serviços e canais digitais.
          </p>
          <p className="mt-3 text-xs text-[#6E8790]">
            Última atualização: 23 de fevereiro de 2026
          </p>
        </header>

        <div className="space-y-4">
          <section className={sectionClass}>
            <h2 className="mb-3 text-lg font-semibold">1. Dados coletados</h2>
            <div className="space-y-2 text-sm leading-6 text-[#3D5A64]">
              <p>
                Podemos tratar dados cadastrais, dados de autenticação, dados de uso da plataforma,
                registros operacionais, notificações e dados fornecidos pelos clientes em suas
                rotinas de negócio.
              </p>
              <p>
                O escopo exato depende dos módulos contratados, permissões e funcionalidades
                utilizadas.
              </p>
            </div>
          </section>

          <section className={sectionClass}>
            <h2 className="mb-3 text-lg font-semibold">2. Finalidades de tratamento</h2>
            <div className="space-y-2 text-sm leading-6 text-[#3D5A64]">
              <p>
                Tratamos dados para viabilizar autenticação, gestão de usuários, operação dos
                módulos contratados, segurança, suporte, auditoria, comunicações operacionais e
                cumprimento de obrigações legais/regulatórias.
              </p>
            </div>
          </section>

          <section className={sectionClass}>
            <h2 className="mb-3 text-lg font-semibold">3. Bases legais</h2>
            <div className="space-y-2 text-sm leading-6 text-[#3D5A64]">
              <p>
                As bases legais podem incluir execução de contrato, cumprimento de obrigação legal,
                legítimo interesse e consentimento, conforme o contexto de uso e a natureza do
                tratamento.
              </p>
            </div>
          </section>

          <section className={sectionClass}>
            <h2 className="mb-3 text-lg font-semibold">4. Compartilhamento de dados</h2>
            <div className="space-y-2 text-sm leading-6 text-[#3D5A64]">
              <p>
                Dados podem ser compartilhados com operadores e fornecedores necessários à prestação
                do serviço (infraestrutura, e-mail, mensageria, integrações), observadas medidas de
                segurança e contratos adequados.
              </p>
              <p>
                Também pode haver compartilhamento quando exigido por autoridade competente ou por
                obrigação legal.
              </p>
            </div>
          </section>

          <section className={sectionClass}>
            <h2 className="mb-3 text-lg font-semibold">5. Segurança da informação</h2>
            <p className="text-sm leading-6 text-[#3D5A64]">
              A Conect360 adota medidas técnicas e administrativas razoáveis para proteção dos
              dados, incluindo controles de acesso, autenticação e mecanismos de segurança de
              aplicação. Nenhum ambiente é absolutamente imune a incidentes.
            </p>
          </section>

          <section className={sectionClass}>
            <h2 className="mb-3 text-lg font-semibold">6. Retenção e descarte</h2>
            <p className="text-sm leading-6 text-[#3D5A64]">
              Os dados são mantidos pelo tempo necessário para atendimento das finalidades,
              obrigações legais, prevenção a fraude, auditoria e execução contratual, com descarte
              ou anonimização quando aplicável.
            </p>
          </section>

          <section className={sectionClass}>
            <h2 className="mb-3 text-lg font-semibold">7. Direitos dos titulares</h2>
            <div className="space-y-2 text-sm leading-6 text-[#3D5A64]">
              <p>
                O titular pode solicitar confirmação de tratamento, acesso, correção, anonimização,
                eliminação, portabilidade, informação sobre compartilhamentos e revisão de
                consentimento, observados limites legais e técnicos.
              </p>
            </div>
          </section>

          <section className={sectionClass}>
            <h2 className="mb-3 text-lg font-semibold">8. Contato e atualizações</h2>
            <div className="space-y-2 text-sm leading-6 text-[#3D5A64]">
              <p>
                Esta política pode ser atualizada periodicamente. A versão vigente e a data de
                atualização ficam indicadas neste documento.
              </p>
              <p>
                Solicitações sobre privacidade e proteção de dados devem ser encaminhadas pelos
                canais oficiais da Conect360.
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PoliticaPrivacidadePage;
