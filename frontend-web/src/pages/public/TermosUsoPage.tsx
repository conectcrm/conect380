import React from 'react';
import { Link } from 'react-router-dom';

const VERSAO = '2026-02-23';

const sectionClass =
  'rounded-2xl border border-[#D8E4E8] bg-white p-5 md:p-6 shadow-[0_8px_24px_rgba(0,35,51,0.05)]';

const TermosUsoPage: React.FC = () => {
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
          <h1 className="text-2xl font-bold md:text-3xl">Termos de Uso - Conect360</h1>
          <p className="mt-3 text-sm leading-6 text-[#4E6B75] md:text-base">
            Estes termos regulam o uso da plataforma Conect360. Ao utilizar o sistema, o usuário
            declara ciência das regras operacionais, responsabilidades e limitações descritas neste
            documento.
          </p>
          <p className="mt-3 text-xs text-[#6E8790]">
            Última atualização: 23 de fevereiro de 2026
          </p>
        </header>

        <div className="space-y-4">
          <section className={sectionClass}>
            <h2 className="mb-3 text-lg font-semibold">1. Objeto</h2>
            <p className="text-sm leading-6 text-[#3D5A64]">
              A Conect360 disponibiliza uma plataforma SaaS para gestão comercial, atendimento,
              agenda, usuários e demais recursos contratados pelo cliente, conforme plano ativo.
            </p>
          </section>

          <section className={sectionClass}>
            <h2 className="mb-3 text-lg font-semibold">2. Cadastro e acesso</h2>
            <div className="space-y-2 text-sm leading-6 text-[#3D5A64]">
              <p>O cliente deve fornecer dados verdadeiros, completos e atualizados no cadastro.</p>
              <p>
                O usuário administrador é responsável pela gestão de acessos, permissões e uso das
                credenciais da empresa.
              </p>
              <p>
                O compartilhamento indevido de senhas ou acessos é de responsabilidade do cliente.
              </p>
            </div>
          </section>

          <section className={sectionClass}>
            <h2 className="mb-3 text-lg font-semibold">3. Uso permitido e restrições</h2>
            <div className="space-y-2 text-sm leading-6 text-[#3D5A64]">
              <p>
                É vedado utilizar a plataforma para atividades ilícitas, envio de conteúdo abusivo,
                violação de direitos de terceiros ou tentativa de acesso não autorizado.
              </p>
              <p>
                O cliente não pode realizar engenharia reversa, exploração de vulnerabilidades ou
                automações não autorizadas que comprometam a estabilidade do serviço.
              </p>
            </div>
          </section>

          <section className={sectionClass}>
            <h2 className="mb-3 text-lg font-semibold">4. Dados e responsabilidades do cliente</h2>
            <div className="space-y-2 text-sm leading-6 text-[#3D5A64]">
              <p>
                O cliente é responsável pela licitude dos dados inseridos na plataforma e pelo
                cumprimento das obrigações legais aplicáveis, incluindo LGPD perante seus titulares.
              </p>
              <p>
                A Conect360 atua como operadora/controladora conforme a finalidade de cada fluxo e
                os instrumentos contratuais aplicáveis.
              </p>
            </div>
          </section>

          <section className={sectionClass}>
            <h2 className="mb-3 text-lg font-semibold">5. Disponibilidade e suporte</h2>
            <div className="space-y-2 text-sm leading-6 text-[#3D5A64]">
              <p>
                A Conect360 adota medidas técnicas e organizacionais para operação do serviço, mas
                não garante indisponibilidade zero, especialmente em manutenções programadas,
                falhas de terceiros ou eventos fora de controle razoável.
              </p>
              <p>
                O suporte seguirá os canais e níveis previstos no plano contratado e/ou contrato
                comercial aplicável.
              </p>
            </div>
          </section>

          <section className={sectionClass}>
            <h2 className="mb-3 text-lg font-semibold">6. Propriedade intelectual</h2>
            <p className="text-sm leading-6 text-[#3D5A64]">
              O software, marca, interfaces e materiais da plataforma pertencem à Conect360, salvo
              conteúdos e dados inseridos pelo cliente. O uso do serviço não transfere titularidade
              do sistema ao cliente.
            </p>
          </section>

          <section className={sectionClass}>
            <h2 className="mb-3 text-lg font-semibold">7. Cancelamento e encerramento</h2>
            <p className="text-sm leading-6 text-[#3D5A64]">
              O cancelamento do serviço e as condições de retenção/exportação de dados seguirão as
              regras contratuais e políticas vigentes. Obrigações legais e registros obrigatórios
              podem ser mantidos pelo prazo necessário.
            </p>
          </section>

          <section className={sectionClass}>
            <h2 className="mb-3 text-lg font-semibold">8. Contato</h2>
            <p className="text-sm leading-6 text-[#3D5A64]">
              Dúvidas sobre estes Termos de Uso podem ser encaminhadas pelos canais oficiais de
              atendimento da Conect360.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default TermosUsoPage;
