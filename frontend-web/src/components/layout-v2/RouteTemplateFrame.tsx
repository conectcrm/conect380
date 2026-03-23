import React, { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import PageTemplate, { type PageTypology } from './templates/PageTemplates';

type RouteTemplateRule = {
  pattern: RegExp;
  type: PageTypology;
  fullBleed?: boolean;
};

const routeRules: RouteTemplateRule[] = [
  {
    pattern:
      /^\/(dashboard|atendimento\/analytics|atendimento\/distribuicao\/dashboard|nuclei\/crm|nuclei\/financeiro|nuclei\/vendas|relatorios\/analytics)$/,
    type: 'DASHBOARD',
  },
  {
    pattern: /^\/(atendimento\/tickets\/novo|gestao\/fluxos\/(novo|[^/]+)\/builder)$/,
    type: 'FORM',
  },
  {
    pattern:
      /^\/(atendimento\/tickets\/[^/]+|empresas\/[^/]+\/(configuracoes|relatorios|permissoes|backup)|contratos\/[^/]+|clientes\/[^/]+|crm\/clientes\/[^/]+|propostas\/[^/]+|vendas\/propostas\/[^/]+)$/,
    type: 'DETAIL',
  },
  {
    pattern: /^\/((crm\/)?agenda\/eventos\/[^/]+)$/,
    type: 'DETAIL',
  },
  {
    pattern: /^\/(configuracoes\/usuarios)$/,
    type: 'LIST',
  },
  {
    pattern: /^\/(configuracoes\/metas)$/,
    type: 'LIST',
  },
  {
    pattern: /^\/(configuracoes\/empresa)$/,
    type: 'LIST',
  },
  {
    // Meu Perfil usa layout mais denso (sidebar + cards de formulario/seguranca/atividade)
    // e segue melhor a largura de LIST do que SETTINGS.
    pattern: /^\/(perfil)$/,
    type: 'LIST',
  },
  {
    pattern:
      /^\/(configuracoes(\/.*)?|atendimento\/configuracoes|atendimento\/equipe|atendimento\/distribuicao|empresas\/minhas|gestao\/permissoes)$/,
    type: 'SETTINGS',
  },
  {
    pattern: /^\/(atendimento\/inbox)$/,
    type: 'LIST',
    fullBleed: true,
  },
  {
    pattern:
      /^\/(clientes|contatos|pipeline|propostas|vendas\/propostas|produtos(\/categorias)?|vendas\/produtos|veiculos|vendas\/veiculos|atendimento\/tickets|financeiro(\/.*)?|agenda|crm\/agenda|crm\/clientes|crm\/contatos|crm\/leads|crm\/interacoes|crm\/pipeline|leads|interacoes|cotacoes|vendas\/cotacoes|orcamentos|aprovacoes\/pendentes|vendas\/aprovacoes|portal|billing(\/.*)?|assinaturas|faturamento|notifications|atendimento|atendimento\/automacoes)$/,
    type: 'LIST',
  },
  {
    pattern: /^\/(403|404|under-construction|nuclei\/.*)$/,
    type: 'UTILITY',
  },
];

const resolveTemplateForPath = (pathname: string): RouteTemplateRule => {
  const matchedRule = routeRules.find((rule) => rule.pattern.test(pathname));
  return matchedRule || { pattern: /.*/, type: 'LIST' };
};

type RouteTemplateFrameProps = {
  children: React.ReactNode;
};

const RouteTemplateFrame: React.FC<RouteTemplateFrameProps> = ({ children }) => {
  const location = useLocation();

  const selectedTemplate = useMemo(
    () => resolveTemplateForPath(location.pathname),
    [location.pathname],
  );

  return (
    <PageTemplate type={selectedTemplate.type} fullBleed={selectedTemplate.fullBleed}>
      {children}
    </PageTemplate>
  );
};

export default React.memo(RouteTemplateFrame);
export { resolveTemplateForPath };
