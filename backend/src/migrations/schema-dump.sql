--
-- PostgreSQL database dump
--

-- Dumped from database version 15.13
-- Dumped by pg_dump version 17.5

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

-- *not* creating schema, since initdb creates it


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS '';


--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: assinaturas_contrato_status_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.assinaturas_contrato_status_enum AS ENUM (
    'pendente',
    'assinado',
    'rejeitado',
    'expirado'
);


--
-- Name: assinaturas_contrato_tipo_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.assinaturas_contrato_tipo_enum AS ENUM (
    'digital',
    'eletronica',
    'presencial'
);


--
-- Name: assinaturas_empresas_status_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.assinaturas_empresas_status_enum AS ENUM (
    'ativa',
    'cancelada',
    'suspensa',
    'pendente'
);


--
-- Name: atendimento_canais_status_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.atendimento_canais_status_enum AS ENUM (
    'ativo',
    'inativo',
    'configurando',
    'erro'
);


--
-- Name: atendimento_canais_tipo_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.atendimento_canais_tipo_enum AS ENUM (
    'whatsapp',
    'telegram',
    'email',
    'sms',
    'facebook',
    'instagram',
    'webchat'
);


--
-- Name: atividades_tipo_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.atividades_tipo_enum AS ENUM (
    'call',
    'email',
    'meeting',
    'note',
    'task'
);


--
-- Name: backup_frequencia_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.backup_frequencia_enum AS ENUM (
    'diario',
    'semanal',
    'mensal'
);


--
-- Name: clientes_status_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.clientes_status_enum AS ENUM (
    'lead',
    'prospect',
    'cliente',
    'inativo'
);


--
-- Name: clientes_tipo_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.clientes_tipo_enum AS ENUM (
    'pessoa_fisica',
    'pessoa_juridica'
);


--
-- Name: configuracoes_gateway_pagamento_gateway_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.configuracoes_gateway_pagamento_gateway_enum AS ENUM (
    'mercado_pago',
    'stripe',
    'pagseguro'
);


--
-- Name: configuracoes_gateway_pagamento_modo_operacao_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.configuracoes_gateway_pagamento_modo_operacao_enum AS ENUM (
    'sandbox',
    'producao'
);


--
-- Name: configuracoes_gateway_pagamento_status_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.configuracoes_gateway_pagamento_status_enum AS ENUM (
    'ativo',
    'inativo',
    'erro'
);


--
-- Name: contratos_status_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.contratos_status_enum AS ENUM (
    'aguardando_assinatura',
    'assinado',
    'cancelado',
    'expirado'
);


--
-- Name: contratos_tipo_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.contratos_tipo_enum AS ENUM (
    'servico',
    'produto',
    'misto',
    'manutencao'
);


--
-- Name: cotacoes_origem_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.cotacoes_origem_enum AS ENUM (
    'manual',
    'website',
    'email',
    'telefone',
    'whatsapp',
    'indicacao'
);


--
-- Name: cotacoes_prioridade_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.cotacoes_prioridade_enum AS ENUM (
    'baixa',
    'media',
    'alta',
    'urgente'
);


--
-- Name: cotacoes_status_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.cotacoes_status_enum AS ENUM (
    'rascunho',
    'enviada',
    'pendente',
    'em_analise',
    'aprovada',
    'rejeitada',
    'vencida',
    'convertida',
    'cancelada'
);


--
-- Name: evento_tipo_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.evento_tipo_enum AS ENUM (
    'reuniao',
    'ligacao',
    'apresentacao',
    'visita',
    'follow-up',
    'outro'
);


--
-- Name: faturas_formapagamentopreferida_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.faturas_formapagamentopreferida_enum AS ENUM (
    'pix',
    'cartao_credito',
    'cartao_debito',
    'boleto',
    'transferencia',
    'dinheiro'
);


--
-- Name: faturas_status_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.faturas_status_enum AS ENUM (
    'pendente',
    'enviada',
    'paga',
    'vencida',
    'cancelada',
    'parcialmente_paga'
);


--
-- Name: faturas_tipo_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.faturas_tipo_enum AS ENUM (
    'unica',
    'recorrente',
    'parcela',
    'adicional'
);


--
-- Name: filas_estrategia_distribuicao_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.filas_estrategia_distribuicao_enum AS ENUM (
    'ROUND_ROBIN',
    'MENOR_CARGA',
    'PRIORIDADE'
);


--
-- Name: notifications_type_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.notifications_type_enum AS ENUM (
    'COTACAO_APROVADA',
    'COTACAO_REPROVADA',
    'COTACAO_PENDENTE',
    'SISTEMA'
);


--
-- Name: oportunidades_estagio_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.oportunidades_estagio_enum AS ENUM (
    'leads',
    'qualification',
    'proposal',
    'negotiation',
    'closing',
    'won',
    'lost'
);


--
-- Name: oportunidades_origem_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.oportunidades_origem_enum AS ENUM (
    'website',
    'indicacao',
    'telefone',
    'email',
    'redes_sociais',
    'evento',
    'parceiro',
    'campanha'
);


--
-- Name: oportunidades_prioridade_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.oportunidades_prioridade_enum AS ENUM (
    'low',
    'medium',
    'high'
);


--
-- Name: pagamentos_status_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.pagamentos_status_enum AS ENUM (
    'pendente',
    'processando',
    'aprovado',
    'rejeitado',
    'cancelado',
    'estornado'
);


--
-- Name: pagamentos_tipo_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.pagamentos_tipo_enum AS ENUM (
    'pagamento',
    'estorno',
    'ajuste',
    'desconto'
);


--
-- Name: planos_cobranca_status_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.planos_cobranca_status_enum AS ENUM (
    'ativo',
    'pausado',
    'cancelado',
    'expirado'
);


--
-- Name: planos_cobranca_tiporecorrencia_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.planos_cobranca_tiporecorrencia_enum AS ENUM (
    'mensal',
    'trimestral',
    'semestral',
    'anual',
    'personalizado'
);


--
-- Name: propostas_formapagamento_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.propostas_formapagamento_enum AS ENUM (
    'avista',
    'boleto',
    'cartao',
    'pix',
    'recorrente'
);


--
-- Name: propostas_status_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.propostas_status_enum AS ENUM (
    'rascunho',
    'enviada',
    'visualizada',
    'aprovada',
    'rejeitada',
    'expirada'
);


--
-- Name: push_provider_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.push_provider_enum AS ENUM (
    'fcm',
    'apns',
    'onesignal'
);


--
-- Name: senha_complexidade_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.senha_complexidade_enum AS ENUM (
    'baixa',
    'media',
    'alta'
);


--
-- Name: sms_provider_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.sms_provider_enum AS ENUM (
    'twilio',
    'nexmo',
    'sinch'
);


--
-- Name: transacoes_gateway_pagamento_metodo_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.transacoes_gateway_pagamento_metodo_enum AS ENUM (
    'pix',
    'cartao_credito',
    'cartao_debito',
    'boleto',
    'link_pagamento',
    'transferencia'
);


--
-- Name: transacoes_gateway_pagamento_status_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.transacoes_gateway_pagamento_status_enum AS ENUM (
    'pendente',
    'processando',
    'aprovado',
    'recusado',
    'cancelado',
    'erro'
);


--
-- Name: transacoes_gateway_pagamento_tipo_operacao_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.transacoes_gateway_pagamento_tipo_operacao_enum AS ENUM (
    'cobranca',
    'estorno',
    'webhook',
    'validacao'
);


--
-- Name: users_role_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.users_role_enum AS ENUM (
    'admin',
    'manager',
    'vendedor',
    'user'
);


--
-- Name: users_status_atendente_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.users_status_atendente_enum AS ENUM (
    'DISPONIVEL',
    'OCUPADO',
    'AUSENTE',
    'OFFLINE'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: anexos_cotacao; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.anexos_cotacao (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    cotacao_id uuid NOT NULL,
    nome character varying(255) NOT NULL,
    tipo character varying(100) NOT NULL,
    url character varying(500) NOT NULL,
    tamanho bigint NOT NULL,
    descricao text,
    "mimeType" character varying(100),
    extensao character varying(10),
    data_criacao timestamp without time zone DEFAULT now() NOT NULL,
    criado_por uuid NOT NULL,
    metadados json,
    ativo boolean DEFAULT true NOT NULL,
    downloads integer,
    ultimo_download timestamp without time zone,
    hash character varying(64),
    publico boolean DEFAULT false NOT NULL,
    data_expiracao timestamp without time zone
);


--
-- Name: assinaturas_contrato; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.assinaturas_contrato (
    id integer NOT NULL,
    "contratoId" integer NOT NULL,
    "usuarioId" uuid NOT NULL,
    tipo public.assinaturas_contrato_tipo_enum DEFAULT 'digital'::public.assinaturas_contrato_tipo_enum NOT NULL,
    status public.assinaturas_contrato_status_enum DEFAULT 'pendente'::public.assinaturas_contrato_status_enum NOT NULL,
    "certificadoDigital" text,
    "hashAssinatura" text,
    "ipAssinatura" text,
    "userAgent" text,
    "dataAssinatura" timestamp without time zone,
    "motivoRejeicao" text,
    metadados json,
    "tokenValidacao" text,
    "dataEnvio" timestamp without time zone,
    "dataExpiracao" timestamp without time zone,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: assinaturas_contrato_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.assinaturas_contrato_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: assinaturas_contrato_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.assinaturas_contrato_id_seq OWNED BY public.assinaturas_contrato.id;


--
-- Name: assinaturas_empresas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.assinaturas_empresas (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    empresa_id character varying NOT NULL,
    status public.assinaturas_empresas_status_enum DEFAULT 'ativa'::public.assinaturas_empresas_status_enum NOT NULL,
    "dataInicio" date NOT NULL,
    "dataFim" date,
    "proximoVencimento" date NOT NULL,
    "valorMensal" numeric(10,2) NOT NULL,
    "usuariosAtivos" integer DEFAULT 0 NOT NULL,
    "clientesCadastrados" integer DEFAULT 0 NOT NULL,
    "storageUtilizado" bigint DEFAULT '0'::bigint NOT NULL,
    "apiCallsHoje" integer DEFAULT 0 NOT NULL,
    "ultimaContabilizacaoApi" date DEFAULT ('now'::text)::date NOT NULL,
    "renovacaoAutomatica" boolean DEFAULT true NOT NULL,
    observacoes text,
    "criadoEm" timestamp without time zone DEFAULT now() NOT NULL,
    "atualizadoEm" timestamp without time zone DEFAULT now() NOT NULL,
    plano_id uuid
);


--
-- Name: atendente_atribuicoes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.atendente_atribuicoes (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    atendente_id uuid NOT NULL,
    nucleo_id uuid,
    departamento_id uuid,
    prioridade integer DEFAULT 0 NOT NULL,
    ativo boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: atendente_equipes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.atendente_equipes (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    atendente_id uuid NOT NULL,
    equipe_id uuid NOT NULL,
    funcao character varying(50) DEFAULT 'membro'::character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: atendente_skills; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.atendente_skills (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "atendenteId" uuid NOT NULL,
    skill character varying(100) NOT NULL,
    nivel integer DEFAULT 1 NOT NULL,
    ativo boolean DEFAULT true NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: atendentes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.atendentes (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    nome character varying(100) NOT NULL,
    email character varying(100) NOT NULL,
    "usuarioId" uuid,
    "empresaId" uuid NOT NULL,
    status character varying(20) DEFAULT 'DISPONIVEL'::character varying NOT NULL,
    "capacidadeMaxima" integer DEFAULT 5 NOT NULL,
    "ticketsAtivos" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL,
    "deletedAt" timestamp without time zone
);


--
-- Name: atendimento_canais; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.atendimento_canais (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    empresa_id uuid NOT NULL,
    nome character varying(50) NOT NULL,
    tipo public.atendimento_canais_tipo_enum NOT NULL,
    provedor character varying(50) NOT NULL,
    status public.atendimento_canais_status_enum DEFAULT 'configurando'::public.atendimento_canais_status_enum NOT NULL,
    config jsonb,
    ativo boolean DEFAULT false NOT NULL,
    horario_atendimento jsonb,
    mensagem_ausencia text,
    auto_resposta_ativa boolean DEFAULT false NOT NULL,
    ultima_sincronizacao timestamp without time zone,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: COLUMN atendimento_canais.provedor; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.atendimento_canais.provedor IS 'whatsapp_business_api, twilio, telegram_bot_api, sendgrid, meta_graph_api';


--
-- Name: COLUMN atendimento_canais.config; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.atendimento_canais.config IS 'Configurações específicas do provider (tokens, credenciais, etc)';


--
-- Name: atendimento_configuracao_inatividade; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.atendimento_configuracao_inatividade (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    empresa_id uuid NOT NULL,
    departamento_id uuid,
    timeout_minutos integer DEFAULT 1440 NOT NULL,
    enviar_aviso boolean DEFAULT true NOT NULL,
    aviso_minutos_antes integer DEFAULT 60 NOT NULL,
    mensagem_aviso text,
    mensagem_fechamento text,
    ativo boolean DEFAULT true NOT NULL,
    status_aplicaveis jsonb,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: COLUMN atendimento_configuracao_inatividade.timeout_minutos; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.atendimento_configuracao_inatividade.timeout_minutos IS 'Tempo em minutos sem interação do cliente para fechar automaticamente';


--
-- Name: COLUMN atendimento_configuracao_inatividade.enviar_aviso; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.atendimento_configuracao_inatividade.enviar_aviso IS 'Enviar mensagem avisando que ticket será fechado por inatividade';


--
-- Name: COLUMN atendimento_configuracao_inatividade.aviso_minutos_antes; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.atendimento_configuracao_inatividade.aviso_minutos_antes IS 'Quantos minutos antes do fechamento enviar o aviso';


--
-- Name: COLUMN atendimento_configuracao_inatividade.mensagem_aviso; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.atendimento_configuracao_inatividade.mensagem_aviso IS 'Mensagem enviada como aviso de fechamento iminente';


--
-- Name: COLUMN atendimento_configuracao_inatividade.mensagem_fechamento; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.atendimento_configuracao_inatividade.mensagem_fechamento IS 'Mensagem enviada ao fechar por inatividade';


--
-- Name: COLUMN atendimento_configuracao_inatividade.ativo; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.atendimento_configuracao_inatividade.ativo IS 'Se o fechamento automático está ativo';


--
-- Name: COLUMN atendimento_configuracao_inatividade.status_aplicaveis; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.atendimento_configuracao_inatividade.status_aplicaveis IS 'Lista de status onde aplicar fechamento automático. Null = todos';


--
-- Name: atendimento_demandas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.atendimento_demandas (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    cliente_id uuid,
    ticket_id uuid,
    contato_telefone character varying(20),
    empresa_id uuid NOT NULL,
    titulo character varying(200) NOT NULL,
    descricao text,
    tipo character varying(50) DEFAULT 'outros'::character varying NOT NULL,
    prioridade character varying(20) DEFAULT 'media'::character varying NOT NULL,
    status character varying(30) DEFAULT 'aberta'::character varying NOT NULL,
    data_vencimento timestamp without time zone,
    data_conclusao timestamp without time zone,
    responsavel_id uuid,
    autor_id uuid NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: COLUMN atendimento_demandas.tipo; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.atendimento_demandas.tipo IS 'Tipo da demanda: tecnica, comercial, financeira, suporte, reclamacao, solicitacao, outros';


--
-- Name: COLUMN atendimento_demandas.prioridade; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.atendimento_demandas.prioridade IS 'Prioridade: baixa, media, alta, urgente';


--
-- Name: COLUMN atendimento_demandas.status; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.atendimento_demandas.status IS 'Status: aberta, em_andamento, aguardando, concluida, cancelada';


--
-- Name: atendimento_integracoes_config; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.atendimento_integracoes_config (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    empresa_id uuid NOT NULL,
    tipo character varying(50) NOT NULL,
    ativo boolean DEFAULT false NOT NULL,
    credenciais jsonb,
    webhook_secret character varying(255),
    whatsapp_api_token character varying(500),
    whatsapp_phone_number_id character varying(100),
    whatsapp_business_account_id character varying(100),
    whatsapp_webhook_verify_token character varying(255),
    whatsapp_ativo boolean DEFAULT false,
    criado_em timestamp without time zone DEFAULT now() NOT NULL,
    atualizado_em timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: atendimento_mensagens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.atendimento_mensagens (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    ticket_id uuid NOT NULL,
    tipo character varying(20) NOT NULL,
    conteudo text NOT NULL,
    remetente_tipo character varying(20) NOT NULL,
    anexos jsonb,
    identificador_externo character varying(255),
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: atendimento_notas_cliente; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.atendimento_notas_cliente (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    cliente_id uuid,
    ticket_id uuid,
    contato_telefone character varying(20),
    empresa_id uuid NOT NULL,
    conteudo text NOT NULL,
    importante boolean DEFAULT false NOT NULL,
    autor_id uuid NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: atendimento_tickets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.atendimento_tickets (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    numero integer,
    assunto character varying(255),
    status character varying(20) DEFAULT 'ABERTO'::character varying NOT NULL,
    prioridade character varying(20) DEFAULT 'MEDIA'::character varying NOT NULL,
    canal_id uuid,
    fila_id uuid,
    atendente_id uuid,
    empresa_id uuid NOT NULL,
    departamento_id uuid,
    contato_telefone character varying(20),
    contato_nome character varying(255),
    contato_email character varying(255),
    contato_foto character varying(512),
    data_abertura timestamp without time zone,
    data_primeira_resposta timestamp without time zone,
    data_resolucao timestamp without time zone,
    data_fechamento timestamp without time zone,
    ultima_mensagem_em timestamp without time zone,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: atividades; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.atividades (
    id integer NOT NULL,
    tipo public.atividades_tipo_enum DEFAULT 'note'::public.atividades_tipo_enum NOT NULL,
    descricao text NOT NULL,
    "dataAtividade" timestamp without time zone DEFAULT now() NOT NULL,
    oportunidade_id integer NOT NULL,
    empresa_id uuid NOT NULL,
    criado_por_id uuid NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: atividades_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.atividades_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: atividades_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.atividades_id_seq OWNED BY public.atividades.id;


--
-- Name: clientes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.clientes (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    nome character varying(100) NOT NULL,
    email character varying(100) NOT NULL,
    telefone character varying(20),
    tipo public.clientes_tipo_enum NOT NULL,
    documento character varying(20),
    status public.clientes_status_enum DEFAULT 'lead'::public.clientes_status_enum NOT NULL,
    endereco text,
    cidade character varying(100),
    estado character varying(2),
    cep character varying(10),
    empresa character varying(100),
    cargo character varying(100),
    origem character varying(100),
    tags text,
    observacoes text,
    empresa_id uuid NOT NULL,
    responsavel_id uuid,
    valor_estimado numeric(10,2) DEFAULT '0'::numeric NOT NULL,
    ultimo_contato timestamp without time zone,
    proximo_contato timestamp without time zone,
    ativo boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: configuracoes_gateway_pagamento; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.configuracoes_gateway_pagamento (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    empresa_id uuid NOT NULL,
    nome character varying(120) NOT NULL,
    gateway public.configuracoes_gateway_pagamento_gateway_enum NOT NULL,
    modo_operacao public.configuracoes_gateway_pagamento_modo_operacao_enum DEFAULT 'sandbox'::public.configuracoes_gateway_pagamento_modo_operacao_enum NOT NULL,
    status public.configuracoes_gateway_pagamento_status_enum DEFAULT 'inativo'::public.configuracoes_gateway_pagamento_status_enum NOT NULL,
    credenciais jsonb DEFAULT '{}'::jsonb,
    webhook_url character varying(255),
    webhook_secret character varying(255),
    metodos_permitidos jsonb DEFAULT '[]'::jsonb NOT NULL,
    config_adicional jsonb,
    ultimo_erro text,
    ultimo_evento_em timestamp without time zone,
    criado_por uuid,
    atualizado_por uuid,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: contatos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.contatos (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    nome character varying(255) NOT NULL,
    email character varying(255),
    telefone character varying(50) NOT NULL,
    cargo character varying(100),
    ativo boolean DEFAULT true NOT NULL,
    principal boolean DEFAULT false NOT NULL,
    "clienteId" uuid NOT NULL,
    observacoes text,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: contratos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.contratos (
    id integer NOT NULL,
    numero character varying NOT NULL,
    "propostaId" uuid,
    "clienteId" uuid NOT NULL,
    empresa_id uuid NOT NULL,
    "usuarioResponsavelId" uuid NOT NULL,
    tipo public.contratos_tipo_enum DEFAULT 'servico'::public.contratos_tipo_enum NOT NULL,
    status public.contratos_status_enum DEFAULT 'aguardando_assinatura'::public.contratos_status_enum NOT NULL,
    objeto text NOT NULL,
    "valorTotal" numeric(10,2) NOT NULL,
    "dataInicio" date NOT NULL,
    "dataFim" date NOT NULL,
    "dataAssinatura" date,
    "dataVencimento" date NOT NULL,
    observacoes text,
    "clausulasEspeciais" text,
    "condicoesPagamento" json,
    "caminhoArquivoPDF" text,
    "hashDocumento" text,
    ativo boolean DEFAULT true NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: contratos_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.contratos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: contratos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.contratos_id_seq OWNED BY public.contratos.id;


--
-- Name: cotacoes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cotacoes (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    numero character varying(20) NOT NULL,
    titulo character varying(200) NOT NULL,
    descricao text,
    status public.cotacoes_status_enum DEFAULT 'rascunho'::public.cotacoes_status_enum NOT NULL,
    prioridade public.cotacoes_prioridade_enum DEFAULT 'media'::public.cotacoes_prioridade_enum NOT NULL,
    origem public.cotacoes_origem_enum DEFAULT 'manual'::public.cotacoes_origem_enum NOT NULL,
    "valorTotal" numeric(15,2) DEFAULT '0'::numeric NOT NULL,
    "prazoResposta" date,
    observacoes text,
    "condicoesPagamento" text,
    "prazoEntrega" character varying(100),
    "localEntrega" character varying(200),
    "validadeOrcamento" integer DEFAULT 30,
    fornecedor_id uuid NOT NULL,
    responsavel_id uuid NOT NULL,
    aprovador_id uuid,
    data_aprovacao timestamp without time zone,
    status_aprovacao character varying(20),
    justificativa_aprovacao text,
    data_criacao timestamp without time zone DEFAULT now() NOT NULL,
    data_atualizacao timestamp without time zone DEFAULT now() NOT NULL,
    deletado_em timestamp without time zone,
    criado_por uuid NOT NULL,
    atualizado_por uuid NOT NULL,
    deletado_por character varying,
    data_envio timestamp without time zone,
    data_rejeicao timestamp without time zone,
    data_conversao timestamp without time zone,
    metadados json,
    desconto numeric(5,2) DEFAULT '0'::numeric,
    "valorDesconto" numeric(15,2) DEFAULT '0'::numeric,
    "valorImposto" numeric(15,2) DEFAULT '0'::numeric,
    "valorFrete" numeric(15,2) DEFAULT '0'::numeric,
    "valorLiquido" numeric(15,2) DEFAULT '0'::numeric,
    moeda character varying(100),
    "taxaCambio" numeric(10,4) DEFAULT '1'::numeric,
    versao integer DEFAULT 1 NOT NULL,
    ultima_visualizacao timestamp without time zone,
    visualizado_por character varying,
    id_externo character varying(100),
    sistema_origem character varying(100),
    dados_sincronizacao json
);


--
-- Name: departamentos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.departamentos (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    empresa_id uuid NOT NULL,
    nucleo_id uuid NOT NULL,
    nome character varying(100) NOT NULL,
    descricao text,
    codigo character varying(50),
    cor character varying(7) DEFAULT '#6366F1'::character varying NOT NULL,
    icone character varying(50) DEFAULT 'briefcase'::character varying NOT NULL,
    ativo boolean DEFAULT true NOT NULL,
    visivel_no_bot boolean DEFAULT true NOT NULL,
    ordem integer DEFAULT 0 NOT NULL,
    atendentes_ids uuid[] DEFAULT '{}'::uuid[] NOT NULL,
    supervisor_id uuid,
    horario_funcionamento jsonb,
    sla_resposta_minutos integer,
    sla_resolucao_horas integer,
    mensagem_boas_vindas text,
    mensagem_transferencia text,
    tipo_distribuicao character varying(30) DEFAULT 'round_robin'::character varying NOT NULL,
    capacidade_maxima_tickets integer DEFAULT 30 NOT NULL,
    skills jsonb,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    created_by uuid
);


--
-- Name: distribuicao_config; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.distribuicao_config (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "filaId" uuid NOT NULL,
    algoritmo character varying(50) DEFAULT 'round-robin'::character varying NOT NULL,
    ativo boolean DEFAULT true NOT NULL,
    "capacidadeMaxima" integer DEFAULT 10 NOT NULL,
    "priorizarOnline" boolean DEFAULT true NOT NULL,
    "considerarSkills" boolean DEFAULT false NOT NULL,
    "tempoTimeoutMin" integer DEFAULT 30 NOT NULL,
    "permitirOverflow" boolean DEFAULT false NOT NULL,
    "filaBackupId" uuid,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: distribuicao_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.distribuicao_log (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "ticketId" uuid NOT NULL,
    "atendenteId" uuid NOT NULL,
    "filaId" uuid NOT NULL,
    algoritmo character varying(50) NOT NULL,
    motivo text,
    "cargaAtendente" integer DEFAULT 0 NOT NULL,
    realocacao boolean DEFAULT false NOT NULL,
    "motivoRealocacao" text,
    "timestamp" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: empresa_configuracoes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.empresa_configuracoes (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    empresa_id uuid NOT NULL,
    descricao character varying,
    site character varying,
    logo_url character varying,
    cor_primaria character varying DEFAULT '#159A9C'::character varying NOT NULL,
    cor_secundaria character varying DEFAULT '#002333'::character varying NOT NULL,
    autenticacao_2fa boolean DEFAULT false NOT NULL,
    sessao_expiracao_minutos integer DEFAULT 30 NOT NULL,
    senha_complexidade public.senha_complexidade_enum DEFAULT 'media'::public.senha_complexidade_enum NOT NULL,
    auditoria boolean DEFAULT true NOT NULL,
    force_ssl boolean DEFAULT false NOT NULL,
    ip_whitelist text,
    limite_usuarios integer DEFAULT 10 NOT NULL,
    aprovacao_novo_usuario boolean DEFAULT false NOT NULL,
    convite_expiracao_horas integer DEFAULT 48 NOT NULL,
    emails_habilitados boolean DEFAULT true NOT NULL,
    servidor_smtp character varying,
    porta_smtp integer DEFAULT 587 NOT NULL,
    smtp_usuario character varying,
    smtp_senha character varying,
    whatsapp_habilitado boolean DEFAULT false NOT NULL,
    whatsapp_numero character varying,
    whatsapp_api_token character varying,
    sms_habilitado boolean DEFAULT false NOT NULL,
    sms_provider public.sms_provider_enum,
    sms_api_key character varying,
    push_habilitado boolean DEFAULT false NOT NULL,
    push_provider public.push_provider_enum,
    push_api_key character varying,
    api_habilitada boolean DEFAULT false NOT NULL,
    webhooks_ativos integer DEFAULT 0 NOT NULL,
    backup_automatico boolean DEFAULT true NOT NULL,
    backup_frequencia public.backup_frequencia_enum DEFAULT 'diario'::public.backup_frequencia_enum NOT NULL,
    backup_retencao_dias integer DEFAULT 30 NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: empresa_modulos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.empresa_modulos (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    empresa_id uuid NOT NULL,
    modulo character varying(50) NOT NULL,
    ativo boolean DEFAULT true NOT NULL,
    data_ativacao timestamp without time zone DEFAULT now() NOT NULL,
    data_expiracao timestamp without time zone,
    plano character varying(50),
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: COLUMN empresa_modulos.modulo; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.empresa_modulos.modulo IS 'ATENDIMENTO, CRM, VENDAS, FINANCEIRO, BILLING, ADMINISTRACAO';


--
-- Name: COLUMN empresa_modulos.plano; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.empresa_modulos.plano IS 'STARTER, BUSINESS, ENTERPRISE';


--
-- Name: empresas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.empresas (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    nome character varying NOT NULL,
    slug character varying(100) NOT NULL,
    cnpj character varying NOT NULL,
    email character varying NOT NULL,
    telefone character varying NOT NULL,
    endereco character varying NOT NULL,
    cidade character varying NOT NULL,
    estado character varying(2) NOT NULL,
    cep character varying NOT NULL,
    subdominio character varying NOT NULL,
    ativo boolean DEFAULT true NOT NULL,
    plano character varying DEFAULT 'starter'::character varying NOT NULL,
    logo_url text,
    data_expiracao timestamp without time zone,
    email_verificado boolean DEFAULT false NOT NULL,
    token_verificacao character varying,
    configuracoes json,
    limites json,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: equipe_atribuicoes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.equipe_atribuicoes (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    equipe_id uuid NOT NULL,
    nucleo_id uuid,
    departamento_id uuid,
    prioridade integer DEFAULT 0 NOT NULL,
    ativo boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: equipes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.equipes (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    empresa_id uuid NOT NULL,
    nome character varying(100) NOT NULL,
    descricao text,
    cor character varying(7) DEFAULT '#3B82F6'::character varying NOT NULL,
    icone character varying(50) DEFAULT 'users'::character varying NOT NULL,
    ativo boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: evento; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.evento (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    titulo character varying(255) NOT NULL,
    descricao text,
    "dataInicio" timestamp with time zone NOT NULL,
    "dataFim" timestamp with time zone,
    "diaInteiro" boolean DEFAULT false NOT NULL,
    local character varying(255),
    tipo public.evento_tipo_enum DEFAULT 'reuniao'::public.evento_tipo_enum NOT NULL,
    cor character varying(7) DEFAULT '#3B82F6'::character varying NOT NULL,
    "clienteId" uuid,
    "usuarioId" uuid NOT NULL,
    "empresaId" uuid NOT NULL,
    "criadoEm" timestamp with time zone DEFAULT now() NOT NULL,
    "atualizadoEm" timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: faturas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.faturas (
    id integer NOT NULL,
    numero character varying NOT NULL,
    "contratoId" integer NOT NULL,
    "clienteId" uuid NOT NULL,
    empresa_id uuid NOT NULL,
    "usuarioResponsavelId" uuid NOT NULL,
    tipo public.faturas_tipo_enum DEFAULT 'unica'::public.faturas_tipo_enum NOT NULL,
    status public.faturas_status_enum DEFAULT 'pendente'::public.faturas_status_enum NOT NULL,
    "formaPagamentoPreferida" public.faturas_formapagamentopreferida_enum,
    descricao text NOT NULL,
    "valorTotal" numeric(10,2) NOT NULL,
    "valorPago" numeric(10,2) DEFAULT '0'::numeric NOT NULL,
    "valorDesconto" numeric(10,2) DEFAULT '0'::numeric NOT NULL,
    "valorJuros" numeric(10,2) DEFAULT '0'::numeric NOT NULL,
    "valorMulta" numeric(10,2) DEFAULT '0'::numeric NOT NULL,
    "dataEmissao" date NOT NULL,
    "dataVencimento" date NOT NULL,
    "dataPagamento" date,
    observacoes text,
    "linkPagamento" text,
    "qrCodePix" text,
    "codigoBoleto" text,
    metadados json,
    ativo boolean DEFAULT true NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: faturas_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.faturas_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: faturas_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.faturas_id_seq OWNED BY public.faturas.id;


--
-- Name: filas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.filas (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "empresaId" uuid NOT NULL,
    nome character varying(100) NOT NULL,
    descricao text,
    cor character varying(7),
    icone character varying(50),
    "nucleoId" uuid,
    "departamentoId" uuid,
    ativo boolean DEFAULT true NOT NULL,
    ordem integer DEFAULT 0 NOT NULL,
    "horarioAtendimento" jsonb,
    estrategia_distribuicao public.filas_estrategia_distribuicao_enum DEFAULT 'ROUND_ROBIN'::public.filas_estrategia_distribuicao_enum NOT NULL,
    capacidade_maxima integer DEFAULT 10 NOT NULL,
    distribuicao_automatica boolean DEFAULT false NOT NULL,
    configuracoes jsonb,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL,
    "deletedAt" timestamp without time zone
);


--
-- Name: filas_atendentes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.filas_atendentes (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "filaId" uuid NOT NULL,
    "atendenteId" uuid NOT NULL,
    capacidade integer DEFAULT 10 NOT NULL,
    prioridade integer DEFAULT 5 NOT NULL,
    ativo boolean DEFAULT true NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: COLUMN filas_atendentes.capacidade; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.filas_atendentes.capacidade IS 'Tickets simultâneos que este atendente pode ter nesta fila';


--
-- Name: COLUMN filas_atendentes.prioridade; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.filas_atendentes.prioridade IS '1=alta prioridade, 10=baixa prioridade';


--
-- Name: fluxos_triagem; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fluxos_triagem (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    empresa_id uuid NOT NULL,
    nome character varying(100) NOT NULL,
    descricao text,
    codigo character varying(50),
    tipo character varying(50) DEFAULT 'menu_opcoes'::character varying NOT NULL,
    ativo boolean DEFAULT true NOT NULL,
    versao integer DEFAULT 1 NOT NULL,
    publicado boolean DEFAULT false NOT NULL,
    canais character varying[] DEFAULT '{whatsapp}'::character varying[] NOT NULL,
    palavras_gatilho character varying[] DEFAULT '{}'::character varying[] NOT NULL,
    horario_ativo jsonb,
    prioridade integer DEFAULT 0 NOT NULL,
    estrutura jsonb NOT NULL,
    historico_versoes jsonb DEFAULT '[]'::jsonb NOT NULL,
    versao_atual integer DEFAULT 1 NOT NULL,
    permite_voltar boolean DEFAULT true NOT NULL,
    permite_sair boolean DEFAULT true NOT NULL,
    salvar_historico boolean DEFAULT true NOT NULL,
    tentar_entender_texto_livre boolean DEFAULT false NOT NULL,
    total_execucoes integer DEFAULT 0 NOT NULL,
    total_conclusoes integer DEFAULT 0 NOT NULL,
    total_abandonos integer DEFAULT 0 NOT NULL,
    taxa_conclusao numeric(5,2) DEFAULT '0'::numeric NOT NULL,
    tempo_medio_conclusao_segundos integer DEFAULT 0 NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    created_by uuid,
    published_at timestamp without time zone
);


--
-- Name: fornecedores; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fornecedores (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    nome character varying(255) NOT NULL,
    cnpj_cpf character varying(20) NOT NULL,
    email character varying(255),
    telefone character varying(20),
    endereco character varying(500),
    cidade character varying(100),
    estado character varying(2),
    cep character varying(10),
    contato character varying(255),
    cargo character varying(100),
    observacoes text,
    ativo boolean DEFAULT true NOT NULL,
    empresa_id uuid NOT NULL,
    criado_em timestamp without time zone DEFAULT now() NOT NULL,
    atualizado_em timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: itens_cotacao; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.itens_cotacao (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    cotacao_id uuid NOT NULL,
    ordem integer DEFAULT 1 NOT NULL,
    descricao character varying(500) NOT NULL,
    quantidade numeric(10,3) NOT NULL,
    unidade character varying(20) NOT NULL,
    "valorUnitario" numeric(15,2) NOT NULL,
    "valorTotal" numeric(15,2) DEFAULT '0'::numeric NOT NULL,
    observacoes text,
    codigo character varying(100),
    categoria character varying(200),
    desconto numeric(5,2) DEFAULT '0'::numeric,
    "valorDesconto" numeric(15,2) DEFAULT '0'::numeric,
    "aliquotaImposto" numeric(5,2) DEFAULT '0'::numeric,
    "valorImposto" numeric(15,2) DEFAULT '0'::numeric,
    "valorLiquido" numeric(15,2) DEFAULT '0'::numeric,
    "prazoEntregaDias" integer,
    especificacoes json,
    metadados json,
    data_criacao timestamp without time zone DEFAULT now() NOT NULL,
    data_atualizacao timestamp without time zone DEFAULT now() NOT NULL,
    criado_por character varying NOT NULL,
    atualizado_por character varying NOT NULL,
    id_produto_externo character varying(100),
    sku character varying(100),
    ncm character varying(100)
);


--
-- Name: itens_fatura; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.itens_fatura (
    id integer NOT NULL,
    "faturaId" integer NOT NULL,
    descricao text NOT NULL,
    quantidade numeric(10,4) NOT NULL,
    "valorUnitario" numeric(10,2) NOT NULL,
    "valorTotal" numeric(10,2) NOT NULL,
    unidade text,
    "codigoProduto" text,
    "percentualDesconto" numeric(5,2) DEFAULT '0'::numeric NOT NULL,
    "valorDesconto" numeric(10,2) DEFAULT '0'::numeric NOT NULL
);


--
-- Name: itens_fatura_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.itens_fatura_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: itens_fatura_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.itens_fatura_id_seq OWNED BY public.itens_fatura.id;


--
-- Name: leads; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.leads (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    nome character varying(255) NOT NULL,
    email character varying(255),
    telefone character varying(50),
    empresa_nome character varying(255),
    status character varying DEFAULT 'novo'::character varying NOT NULL,
    score integer DEFAULT 0 NOT NULL,
    origem character varying,
    observacoes text,
    campos_customizados jsonb,
    responsavel_id uuid,
    empresa_id uuid NOT NULL,
    oportunidade_id integer,
    convertido_em timestamp without time zone,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: message_templates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.message_templates (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    nome character varying(200) NOT NULL,
    conteudo text NOT NULL,
    categoria character varying(100),
    atalho character varying(50),
    variaveis text,
    ativo boolean DEFAULT true NOT NULL,
    "empresaId" character varying(36) NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: modulos_sistema; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.modulos_sistema (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    nome character varying(100) NOT NULL,
    codigo character varying(50) NOT NULL,
    descricao text,
    icone character varying(100),
    cor character varying(50),
    ativo boolean DEFAULT true NOT NULL,
    essencial boolean DEFAULT false NOT NULL,
    ordem integer DEFAULT 0 NOT NULL,
    "criadoEm" timestamp without time zone DEFAULT now() NOT NULL,
    "atualizadoEm" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notifications (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    type public.notifications_type_enum DEFAULT 'SISTEMA'::public.notifications_type_enum NOT NULL,
    title character varying(255) NOT NULL,
    message text NOT NULL,
    read boolean DEFAULT false NOT NULL,
    data jsonb,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    read_at timestamp without time zone
);


--
-- Name: nucleos_atendimento; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.nucleos_atendimento (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    empresa_id uuid NOT NULL,
    nome character varying(100) NOT NULL,
    descricao text,
    codigo character varying(50),
    cor character varying(7) DEFAULT '#3B82F6'::character varying NOT NULL,
    icone character varying(50) DEFAULT 'headset'::character varying NOT NULL,
    ativo boolean DEFAULT true NOT NULL,
    visivel_no_bot boolean DEFAULT true NOT NULL,
    prioridade integer DEFAULT 0 NOT NULL,
    horario_funcionamento jsonb,
    timezone character varying(50) DEFAULT 'America/Sao_Paulo'::character varying NOT NULL,
    sla_resposta_minutos integer DEFAULT 60 NOT NULL,
    sla_resolucao_horas integer DEFAULT 24 NOT NULL,
    tempo_medio_atendimento_minutos integer DEFAULT 0 NOT NULL,
    atendentes_ids uuid[] DEFAULT '{}'::uuid[] NOT NULL,
    supervisor_id uuid,
    capacidade_maxima_tickets integer DEFAULT 50 NOT NULL,
    tipo_distribuicao character varying(30) DEFAULT 'round_robin'::character varying NOT NULL,
    mensagem_boas_vindas text,
    mensagem_fora_horario text,
    mensagem_transferencia text,
    mensagem_aguarde text,
    total_tickets_abertos integer DEFAULT 0 NOT NULL,
    total_tickets_resolvidos integer DEFAULT 0 NOT NULL,
    taxa_satisfacao numeric(5,2) DEFAULT '0'::numeric NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    created_by uuid
);


--
-- Name: oportunidades; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.oportunidades (
    id integer NOT NULL,
    titulo character varying(255) NOT NULL,
    descricao text,
    valor numeric(12,2) DEFAULT '0'::numeric NOT NULL,
    probabilidade integer DEFAULT 0 NOT NULL,
    estagio public.oportunidades_estagio_enum DEFAULT 'leads'::public.oportunidades_estagio_enum NOT NULL,
    prioridade public.oportunidades_prioridade_enum DEFAULT 'medium'::public.oportunidades_prioridade_enum NOT NULL,
    origem public.oportunidades_origem_enum DEFAULT 'website'::public.oportunidades_origem_enum NOT NULL,
    tags text,
    "dataFechamentoEsperado" date,
    "dataFechamentoReal" date,
    responsavel_id uuid NOT NULL,
    cliente_id uuid,
    "nomeContato" character varying(255),
    "emailContato" character varying(255),
    "telefoneContato" character varying(20),
    "empresaContato" character varying(255),
    empresa_id uuid NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: COLUMN oportunidades.probabilidade; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.oportunidades.probabilidade IS 'Probabilidade de fechamento (0-100)';


--
-- Name: COLUMN oportunidades.tags; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.oportunidades.tags IS 'Tags separadas por vírgula';


--
-- Name: oportunidades_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.oportunidades_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: oportunidades_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.oportunidades_id_seq OWNED BY public.oportunidades.id;


--
-- Name: pagamentos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pagamentos (
    id integer NOT NULL,
    "faturaId" integer NOT NULL,
    empresa_id uuid NOT NULL,
    "transacaoId" character varying NOT NULL,
    tipo public.pagamentos_tipo_enum DEFAULT 'pagamento'::public.pagamentos_tipo_enum NOT NULL,
    status public.pagamentos_status_enum DEFAULT 'pendente'::public.pagamentos_status_enum NOT NULL,
    valor numeric(10,2) NOT NULL,
    taxa numeric(10,2) DEFAULT '0'::numeric NOT NULL,
    "valorLiquido" numeric(10,2) NOT NULL,
    "metodoPagamento" text NOT NULL,
    gateway text,
    "gatewayTransacaoId" text,
    "gatewayStatusRaw" text,
    "dadosCompletos" json,
    "dataProcessamento" timestamp without time zone,
    "dataAprovacao" timestamp without time zone,
    "motivoRejeicao" text,
    observacoes text,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: pagamentos_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.pagamentos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: pagamentos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.pagamentos_id_seq OWNED BY public.pagamentos.id;


--
-- Name: password_reset_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.password_reset_tokens (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    token_hash character varying(128) NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    used_at timestamp without time zone,
    requested_ip character varying(45),
    user_agent text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: planos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.planos (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    nome character varying(100) NOT NULL,
    codigo character varying(50) NOT NULL,
    descricao text,
    preco numeric(10,2) NOT NULL,
    "limiteUsuarios" integer DEFAULT 1 NOT NULL,
    "limiteClientes" integer DEFAULT 1000 NOT NULL,
    "limiteStorage" bigint DEFAULT '5368709120'::bigint NOT NULL,
    "limiteApiCalls" integer DEFAULT 1000 NOT NULL,
    "whiteLabel" boolean DEFAULT false NOT NULL,
    "suportePrioritario" boolean DEFAULT false NOT NULL,
    ativo boolean DEFAULT true NOT NULL,
    ordem integer DEFAULT 0 NOT NULL,
    "criadoEm" timestamp without time zone DEFAULT now() NOT NULL,
    "atualizadoEm" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: planos_cobranca; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.planos_cobranca (
    id integer NOT NULL,
    codigo character varying NOT NULL,
    "contratoId" integer NOT NULL,
    "clienteId" uuid NOT NULL,
    "usuarioResponsavelId" uuid NOT NULL,
    nome text NOT NULL,
    descricao text,
    "tipoRecorrencia" public.planos_cobranca_tiporecorrencia_enum DEFAULT 'mensal'::public.planos_cobranca_tiporecorrencia_enum NOT NULL,
    "intervaloRecorrencia" integer DEFAULT 1 NOT NULL,
    status public.planos_cobranca_status_enum DEFAULT 'ativo'::public.planos_cobranca_status_enum NOT NULL,
    "valorRecorrente" numeric(10,2) NOT NULL,
    "diaVencimento" integer DEFAULT 5 NOT NULL,
    "dataInicio" date NOT NULL,
    "dataFim" date,
    "proximaCobranca" date,
    "limiteCiclos" integer,
    "ciclosExecutados" integer DEFAULT 0 NOT NULL,
    "jurosAtraso" numeric(5,2) DEFAULT '2'::numeric NOT NULL,
    "multaAtraso" numeric(5,2) DEFAULT '10'::numeric NOT NULL,
    "diasTolerancia" integer DEFAULT 5 NOT NULL,
    "enviarLembrete" boolean DEFAULT true NOT NULL,
    "diasAntesLembrete" integer DEFAULT 3 NOT NULL,
    configuracoes json,
    ativo boolean DEFAULT true NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: planos_cobranca_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.planos_cobranca_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: planos_cobranca_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.planos_cobranca_id_seq OWNED BY public.planos_cobranca.id;


--
-- Name: planos_modulos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.planos_modulos (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "criadoEm" timestamp without time zone DEFAULT now() NOT NULL,
    plano_id uuid,
    modulo_id uuid
);


--
-- Name: produtos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.produtos (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    nome character varying(255) NOT NULL,
    categoria character varying(50) NOT NULL,
    preco numeric(10,2) NOT NULL,
    "custoUnitario" numeric(10,2) DEFAULT '0'::numeric NOT NULL,
    "tipoItem" character varying(50) DEFAULT 'produto'::character varying NOT NULL,
    frequencia character varying(50) DEFAULT 'unico'::character varying NOT NULL,
    "unidadeMedida" character varying(50) DEFAULT 'unidade'::character varying NOT NULL,
    status character varying(20) DEFAULT 'ativo'::character varying NOT NULL,
    descricao text,
    sku character varying(100) NOT NULL,
    fornecedor character varying(255) DEFAULT 'Interno'::character varying NOT NULL,
    "estoqueAtual" integer DEFAULT 0 NOT NULL,
    "estoqueMinimo" integer DEFAULT 0 NOT NULL,
    "estoqueMaximo" integer DEFAULT 0 NOT NULL,
    "vendasMes" integer DEFAULT 0 NOT NULL,
    "vendasTotal" integer DEFAULT 0 NOT NULL,
    tags json,
    variacoes json,
    empresa_id uuid NOT NULL,
    "criadoEm" timestamp without time zone DEFAULT now() NOT NULL,
    "atualizadoEm" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: propostas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.propostas (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    numero character varying NOT NULL,
    titulo character varying,
    cliente jsonb NOT NULL,
    produtos jsonb DEFAULT '[]'::jsonb NOT NULL,
    subtotal numeric(10,2) DEFAULT '0'::numeric NOT NULL,
    "descontoGlobal" numeric(10,2) DEFAULT '0'::numeric NOT NULL,
    impostos numeric(10,2) DEFAULT '0'::numeric NOT NULL,
    total numeric(10,2) DEFAULT '0'::numeric NOT NULL,
    valor numeric(10,2) DEFAULT '0'::numeric NOT NULL,
    "formaPagamento" public.propostas_formapagamento_enum DEFAULT 'avista'::public.propostas_formapagamento_enum NOT NULL,
    "validadeDias" integer DEFAULT 30 NOT NULL,
    observacoes text,
    "incluirImpostosPDF" boolean DEFAULT false NOT NULL,
    status public.propostas_status_enum DEFAULT 'rascunho'::public.propostas_status_enum NOT NULL,
    "dataVencimento" timestamp without time zone,
    source character varying,
    vendedor_id uuid,
    empresa_id character varying,
    "portalAccess" jsonb,
    "emailDetails" jsonb,
    "criadaEm" timestamp without time zone DEFAULT now() NOT NULL,
    "atualizadaEm" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: sessoes_triagem; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sessoes_triagem (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    empresa_id uuid NOT NULL,
    fluxo_id uuid NOT NULL,
    contato_telefone character varying(20) NOT NULL,
    contato_nome character varying(100),
    contato_email character varying(100),
    canal character varying(50) DEFAULT 'whatsapp'::character varying NOT NULL,
    ticket_id uuid,
    atendente_id uuid,
    nucleo_destino_id uuid,
    etapa_atual character varying(100),
    etapa_anterior character varying(100),
    contexto jsonb DEFAULT '{}'::jsonb NOT NULL,
    historico jsonb DEFAULT '[]'::jsonb NOT NULL,
    status character varying(50) DEFAULT 'em_andamento'::character varying NOT NULL,
    iniciado_em timestamp without time zone DEFAULT now() NOT NULL,
    concluido_em timestamp without time zone,
    tempo_total_segundos integer,
    total_mensagens_enviadas integer DEFAULT 0 NOT NULL,
    total_mensagens_recebidas integer DEFAULT 0 NOT NULL,
    resultado character varying(50),
    satisfacao_nota integer,
    satisfacao_comentario text,
    ip_address character varying(45),
    user_agent text,
    dispositivo character varying(50),
    navegador character varying(50),
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: sla_configs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sla_configs (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    nome character varying(100) NOT NULL,
    descricao text,
    prioridade character varying(20) NOT NULL,
    canal character varying(50),
    "tempoRespostaMinutos" integer NOT NULL,
    "tempoResolucaoMinutos" integer NOT NULL,
    "horariosFuncionamento" jsonb,
    "alertaPercentual" integer DEFAULT 80 NOT NULL,
    "notificarEmail" boolean DEFAULT true NOT NULL,
    "notificarSistema" boolean DEFAULT true NOT NULL,
    ativo boolean DEFAULT true NOT NULL,
    "empresaId" uuid NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: sla_event_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sla_event_logs (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "ticketId" uuid NOT NULL,
    "slaConfigId" uuid,
    "tipoEvento" character varying(50) NOT NULL,
    status character varying(30) NOT NULL,
    "tempoRespostaMinutos" integer,
    "tempoResolucaoMinutos" integer,
    "tempoLimiteMinutos" integer,
    "percentualUsado" integer,
    detalhes text,
    "empresaId" uuid NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: tags; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tags (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    nome character varying(100) NOT NULL,
    cor character varying(7) NOT NULL,
    descricao text,
    ativo boolean DEFAULT true NOT NULL,
    "empresaId" character varying(36),
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: ticket_tags; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ticket_tags (
    "ticketId" uuid NOT NULL,
    "tagId" uuid NOT NULL
);


--
-- Name: transacoes_gateway_pagamento; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.transacoes_gateway_pagamento (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    empresa_id uuid NOT NULL,
    configuracao_id uuid NOT NULL,
    fatura_id integer,
    pagamento_id integer,
    referencia_gateway character varying(140) NOT NULL,
    status public.transacoes_gateway_pagamento_status_enum DEFAULT 'pendente'::public.transacoes_gateway_pagamento_status_enum NOT NULL,
    tipo_operacao public.transacoes_gateway_pagamento_tipo_operacao_enum DEFAULT 'cobranca'::public.transacoes_gateway_pagamento_tipo_operacao_enum NOT NULL,
    metodo public.transacoes_gateway_pagamento_metodo_enum DEFAULT 'pix'::public.transacoes_gateway_pagamento_metodo_enum NOT NULL,
    origem character varying(60) DEFAULT 'api'::character varying NOT NULL,
    valor_bruto numeric(12,2) DEFAULT '0'::numeric NOT NULL,
    valor_liquido numeric(12,2) DEFAULT '0'::numeric NOT NULL,
    taxa numeric(12,2) DEFAULT '0'::numeric NOT NULL,
    payload_envio jsonb DEFAULT '{}'::jsonb NOT NULL,
    payload_resposta jsonb DEFAULT '{}'::jsonb,
    mensagem_erro text,
    processado_em timestamp without time zone,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: triagem_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.triagem_logs (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    empresa_id uuid NOT NULL,
    sessao_id uuid,
    fluxo_id uuid,
    etapa character varying(120),
    direcao character varying(20) NOT NULL,
    canal character varying(30) DEFAULT 'whatsapp'::character varying NOT NULL,
    tipo character varying(50),
    mensagem_id character varying(160),
    mensagem text,
    payload jsonb,
    contexto_snapshot jsonb,
    metadata jsonb,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    nome character varying(100) NOT NULL,
    email character varying(100) NOT NULL,
    senha character varying NOT NULL,
    telefone character varying(20),
    role public.users_role_enum DEFAULT 'user'::public.users_role_enum NOT NULL,
    permissoes text,
    empresa_id uuid NOT NULL,
    avatar_url text,
    idioma_preferido character varying(10) DEFAULT 'pt-BR'::character varying NOT NULL,
    configuracoes json,
    ativo boolean DEFAULT true NOT NULL,
    deve_trocar_senha boolean DEFAULT false NOT NULL,
    status_atendente public.users_status_atendente_enum,
    capacidade_maxima integer DEFAULT 5,
    tickets_ativos integer DEFAULT 0,
    ultimo_login timestamp without time zone,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: assinaturas_contrato id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assinaturas_contrato ALTER COLUMN id SET DEFAULT nextval('public.assinaturas_contrato_id_seq'::regclass);


--
-- Name: atividades id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.atividades ALTER COLUMN id SET DEFAULT nextval('public.atividades_id_seq'::regclass);


--
-- Name: contratos id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contratos ALTER COLUMN id SET DEFAULT nextval('public.contratos_id_seq'::regclass);


--
-- Name: faturas id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.faturas ALTER COLUMN id SET DEFAULT nextval('public.faturas_id_seq'::regclass);


--
-- Name: itens_fatura id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.itens_fatura ALTER COLUMN id SET DEFAULT nextval('public.itens_fatura_id_seq'::regclass);


--
-- Name: oportunidades id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.oportunidades ALTER COLUMN id SET DEFAULT nextval('public.oportunidades_id_seq'::regclass);


--
-- Name: pagamentos id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pagamentos ALTER COLUMN id SET DEFAULT nextval('public.pagamentos_id_seq'::regclass);


--
-- Name: planos_cobranca id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.planos_cobranca ALTER COLUMN id SET DEFAULT nextval('public.planos_cobranca_id_seq'::regclass);


--
-- Name: pagamentos PK_0127f8bc8386b0e522c7cc5a9fc; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pagamentos
    ADD CONSTRAINT "PK_0127f8bc8386b0e522c7cc5a9fc" PRIMARY KEY (id);


--
-- Name: assinaturas_empresas PK_0318f805892e36eac83afb6251d; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assinaturas_empresas
    ADD CONSTRAINT "PK_0318f805892e36eac83afb6251d" PRIMARY KEY (id);


--
-- Name: atendimento_canais PK_0567c52b5b0b2df7bc99667157c; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.atendimento_canais
    ADD CONSTRAINT "PK_0567c52b5b0b2df7bc99667157c" PRIMARY KEY (id);


--
-- Name: atendimento_mensagens PK_0c1c0023dd7d75856fbc3510ebe; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.atendimento_mensagens
    ADD CONSTRAINT "PK_0c1c0023dd7d75856fbc3510ebe" PRIMARY KEY (id);


--
-- Name: sla_configs PK_16daa3214fe1464a0d554a20157; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sla_configs
    ADD CONSTRAINT "PK_16daa3214fe1464a0d554a20157" PRIMARY KEY (id);


--
-- Name: transacoes_gateway_pagamento PK_1bf14ce7fac52f316a2793b153c; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transacoes_gateway_pagamento
    ADD CONSTRAINT "PK_1bf14ce7fac52f316a2793b153c" PRIMARY KEY (id);


--
-- Name: faturas PK_200eac30ec4a93df763293cf768; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.faturas
    ADD CONSTRAINT "PK_200eac30ec4a93df763293cf768" PRIMARY KEY (id);


--
-- Name: empresa_configuracoes PK_2844f1ff024c808097a812fde9d; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.empresa_configuracoes
    ADD CONSTRAINT "PK_2844f1ff024c808097a812fde9d" PRIMARY KEY (id);


--
-- Name: atendente_equipes PK_298921e69f1a5860ac5d51e6543; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.atendente_equipes
    ADD CONSTRAINT "PK_298921e69f1a5860ac5d51e6543" PRIMARY KEY (id);


--
-- Name: nucleos_atendimento PK_2b1ed0ee0e29353a4833f932444; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.nucleos_atendimento
    ADD CONSTRAINT "PK_2b1ed0ee0e29353a4833f932444" PRIMARY KEY (id);


--
-- Name: triagem_logs PK_2c7de3a599c9debc82c211bcbf1; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.triagem_logs
    ADD CONSTRAINT "PK_2c7de3a599c9debc82c211bcbf1" PRIMARY KEY (id);


--
-- Name: atendimento_tickets PK_2d848804d836ccda705bc328b2e; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.atendimento_tickets
    ADD CONSTRAINT "PK_2d848804d836ccda705bc328b2e" PRIMARY KEY (id);


--
-- Name: atendimento_demandas PK_2e803b8bd11c7a105b902436677; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.atendimento_demandas
    ADD CONSTRAINT "PK_2e803b8bd11c7a105b902436677" PRIMARY KEY (id);


--
-- Name: empresa_modulos PK_3bee06f56dd6a296e9a655f3112; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.empresa_modulos
    ADD CONSTRAINT "PK_3bee06f56dd6a296e9a655f3112" PRIMARY KEY (id);


--
-- Name: atendimento_configuracao_inatividade PK_49f32da77f557fb0ce74d414ee8; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.atendimento_configuracao_inatividade
    ADD CONSTRAINT "PK_49f32da77f557fb0ce74d414ee8" PRIMARY KEY (id);


--
-- Name: propostas PK_4dc5b20fe1167ca318d1fc9751a; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.propostas
    ADD CONSTRAINT "PK_4dc5b20fe1167ca318d1fc9751a" PRIMARY KEY (id);


--
-- Name: atendimento_integracoes_config PK_5203f84366c39d9f0374fe35ee5; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.atendimento_integracoes_config
    ADD CONSTRAINT "PK_5203f84366c39d9f0374fe35ee5" PRIMARY KEY (id);


--
-- Name: planos_modulos PK_545693929fa28474ee2b050ac7c; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.planos_modulos
    ADD CONSTRAINT "PK_545693929fa28474ee2b050ac7c" PRIMARY KEY (id);


--
-- Name: cotacoes PK_5bf611a523f8c37582a65a767c0; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cotacoes
    ADD CONSTRAINT "PK_5bf611a523f8c37582a65a767c0" PRIMARY KEY (id);


--
-- Name: itens_cotacao PK_5d497caf66dd6761c953ce8a40c; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.itens_cotacao
    ADD CONSTRAINT "PK_5d497caf66dd6761c953ce8a40c" PRIMARY KEY (id);


--
-- Name: planos PK_683c959790c0f44669997e1a558; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.planos
    ADD CONSTRAINT "PK_683c959790c0f44669997e1a558" PRIMARY KEY (id);


--
-- Name: notifications PK_6a72c3c0f683f6462415e653c3a; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT "PK_6a72c3c0f683f6462415e653c3a" PRIMARY KEY (id);


--
-- Name: fornecedores PK_6ba3f90e4a18a597d11b763fc02; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fornecedores
    ADD CONSTRAINT "PK_6ba3f90e4a18a597d11b763fc02" PRIMARY KEY (id);


--
-- Name: departamentos PK_6d34dc0415358a018818c683c1e; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.departamentos
    ADD CONSTRAINT "PK_6d34dc0415358a018818c683c1e" PRIMARY KEY (id);


--
-- Name: planos_cobranca PK_701b3c93f0c885abac88f856f5d; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.planos_cobranca
    ADD CONSTRAINT "PK_701b3c93f0c885abac88f856f5d" PRIMARY KEY (id);


--
-- Name: distribuicao_config PK_7705070ccdcb92a81303d6e0f6a; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.distribuicao_config
    ADD CONSTRAINT "PK_7705070ccdcb92a81303d6e0f6a" PRIMARY KEY (id);


--
-- Name: sla_event_logs PK_7b67780e5f7b3bcb66c9b4383a8; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sla_event_logs
    ADD CONSTRAINT "PK_7b67780e5f7b3bcb66c9b4383a8" PRIMARY KEY (id);


--
-- Name: filas_atendentes PK_8246cbeaea8d70ab912f8ab6b97; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.filas_atendentes
    ADD CONSTRAINT "PK_8246cbeaea8d70ab912f8ab6b97" PRIMARY KEY (id);


--
-- Name: ticket_tags PK_9246d495298c288369d3d3e5e98; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ticket_tags
    ADD CONSTRAINT "PK_9246d495298c288369d3d3e5e98" PRIMARY KEY ("ticketId", "tagId");


--
-- Name: assinaturas_contrato PK_95d00342a5061709eac02dc3276; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assinaturas_contrato
    ADD CONSTRAINT "PK_95d00342a5061709eac02dc3276" PRIMARY KEY (id);


--
-- Name: contatos PK_994cdcb2c56dfb5b66217c854cc; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contatos
    ADD CONSTRAINT "PK_994cdcb2c56dfb5b66217c854cc" PRIMARY KEY (id);


--
-- Name: message_templates PK_9ac2bd9635be662d183f314947d; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.message_templates
    ADD CONSTRAINT "PK_9ac2bd9635be662d183f314947d" PRIMARY KEY (id);


--
-- Name: oportunidades PK_9cc49a8d41b2a5acf30d752b2bb; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.oportunidades
    ADD CONSTRAINT "PK_9cc49a8d41b2a5acf30d752b2bb" PRIMARY KEY (id);


--
-- Name: atendente_atribuicoes PK_9cdc722239fc5d102671488638d; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.atendente_atribuicoes
    ADD CONSTRAINT "PK_9cdc722239fc5d102671488638d" PRIMARY KEY (id);


--
-- Name: equipes PK_9f0bfc492ee9542b0c0f42eb21d; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.equipes
    ADD CONSTRAINT "PK_9f0bfc492ee9542b0c0f42eb21d" PRIMARY KEY (id);


--
-- Name: users PK_a3ffb1c0c8416b9fc6f907b7433; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY (id);


--
-- Name: produtos PK_a5d976312809192261ed96174f3; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.produtos
    ADD CONSTRAINT "PK_a5d976312809192261ed96174f3" PRIMARY KEY (id);


--
-- Name: atividades PK_a6aaafbd59aa3ed64c5fa2b196b; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.atividades
    ADD CONSTRAINT "PK_a6aaafbd59aa3ed64c5fa2b196b" PRIMARY KEY (id);


--
-- Name: fluxos_triagem PK_ab3e0ecc373f6c2e7cbece7d7a5; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fluxos_triagem
    ADD CONSTRAINT "PK_ab3e0ecc373f6c2e7cbece7d7a5" PRIMARY KEY (id);


--
-- Name: atendentes PK_b471a2fb0779220da74fe70888b; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.atendentes
    ADD CONSTRAINT "PK_b471a2fb0779220da74fe70888b" PRIMARY KEY (id);


--
-- Name: distribuicao_log PK_bd8e938a38aa1965f938db8fa40; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.distribuicao_log
    ADD CONSTRAINT "PK_bd8e938a38aa1965f938db8fa40" PRIMARY KEY (id);


--
-- Name: modulos_sistema PK_bed8a40a6f972f73dfd174ec3b6; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.modulos_sistema
    ADD CONSTRAINT "PK_bed8a40a6f972f73dfd174ec3b6" PRIMARY KEY (id);


--
-- Name: filas PK_c84f7dbf1727f39c1cabe1d3a06; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.filas
    ADD CONSTRAINT "PK_c84f7dbf1727f39c1cabe1d3a06" PRIMARY KEY (id);


--
-- Name: leads PK_cd102ed7a9a4ca7d4d8bfeba406; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leads
    ADD CONSTRAINT "PK_cd102ed7a9a4ca7d4d8bfeba406" PRIMARY KEY (id);


--
-- Name: configuracoes_gateway_pagamento PK_cd4511ec7c851db06df313983b1; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.configuracoes_gateway_pagamento
    ADD CONSTRAINT "PK_cd4511ec7c851db06df313983b1" PRIMARY KEY (id);


--
-- Name: empresas PK_ce7b122b37c6499bfd6520873e1; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.empresas
    ADD CONSTRAINT "PK_ce7b122b37c6499bfd6520873e1" PRIMARY KEY (id);


--
-- Name: evento PK_ceb2e9607555230aee6aff546b0; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.evento
    ADD CONSTRAINT "PK_ceb2e9607555230aee6aff546b0" PRIMARY KEY (id);


--
-- Name: contratos PK_cfae35069d6f59da899c17ed397; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contratos
    ADD CONSTRAINT "PK_cfae35069d6f59da899c17ed397" PRIMARY KEY (id);


--
-- Name: password_reset_tokens PK_d16bebd73e844c48bca50ff8d3d; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT "PK_d16bebd73e844c48bca50ff8d3d" PRIMARY KEY (id);


--
-- Name: clientes PK_d76bf3571d906e4e86470482c08; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clientes
    ADD CONSTRAINT "PK_d76bf3571d906e4e86470482c08" PRIMARY KEY (id);


--
-- Name: sessoes_triagem PK_dbfa9e565c0316f1ede89b21841; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sessoes_triagem
    ADD CONSTRAINT "PK_dbfa9e565c0316f1ede89b21841" PRIMARY KEY (id);


--
-- Name: atendente_skills PK_dcc3b7d61f80a53dc07137b51e3; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.atendente_skills
    ADD CONSTRAINT "PK_dcc3b7d61f80a53dc07137b51e3" PRIMARY KEY (id);


--
-- Name: itens_fatura PK_dd2b16e04c4cd47963848d5052a; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.itens_fatura
    ADD CONSTRAINT "PK_dd2b16e04c4cd47963848d5052a" PRIMARY KEY (id);


--
-- Name: tags PK_e7dc17249a1148a1970748eda99; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tags
    ADD CONSTRAINT "PK_e7dc17249a1148a1970748eda99" PRIMARY KEY (id);


--
-- Name: atendimento_notas_cliente PK_f11fd31cd49155518b26ad498db; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.atendimento_notas_cliente
    ADD CONSTRAINT "PK_f11fd31cd49155518b26ad498db" PRIMARY KEY (id);


--
-- Name: anexos_cotacao PK_fb30e82c701583b424977f36316; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.anexos_cotacao
    ADD CONSTRAINT "PK_fb30e82c701583b424977f36316" PRIMARY KEY (id);


--
-- Name: equipe_atribuicoes PK_feff7a3ca4116b573219b984939; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.equipe_atribuicoes
    ADD CONSTRAINT "PK_feff7a3ca4116b573219b984939" PRIMARY KEY (id);


--
-- Name: contratos UQ_118d425b390cd16aa23be3d675c; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contratos
    ADD CONSTRAINT "UQ_118d425b390cd16aa23be3d675c" UNIQUE (numero);


--
-- Name: fornecedores UQ_36915b17f08ccc3ce20a2f1d37a; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fornecedores
    ADD CONSTRAINT "UQ_36915b17f08ccc3ce20a2f1d37a" UNIQUE (cnpj_cpf);


--
-- Name: modulos_sistema UQ_5c3bbf0478d5f0f852f953f14e4; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.modulos_sistema
    ADD CONSTRAINT "UQ_5c3bbf0478d5f0f852f953f14e4" UNIQUE (codigo);


--
-- Name: pagamentos UQ_5d279ef3473727e4aff37de8333; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pagamentos
    ADD CONSTRAINT "UQ_5d279ef3473727e4aff37de8333" UNIQUE ("transacaoId");


--
-- Name: empresa_modulos UQ_77259e6fdc8105e25f82ac00bb6; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.empresa_modulos
    ADD CONSTRAINT "UQ_77259e6fdc8105e25f82ac00bb6" UNIQUE (empresa_id, modulo);


--
-- Name: users UQ_97672ac88f789774dd47f7c8be3; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE (email);


--
-- Name: faturas UQ_a4c04e78810691f77a6c4dd8e64; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.faturas
    ADD CONSTRAINT "UQ_a4c04e78810691f77a6c4dd8e64" UNIQUE (numero);


--
-- Name: cotacoes UQ_a8cc61433ad56cc7353f281841c; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cotacoes
    ADD CONSTRAINT "UQ_a8cc61433ad56cc7353f281841c" UNIQUE (numero);


--
-- Name: empresas UQ_b358e930f7a4be79beb05c2cf82; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.empresas
    ADD CONSTRAINT "UQ_b358e930f7a4be79beb05c2cf82" UNIQUE (slug);


--
-- Name: empresas UQ_cff0cc4766f86362353c4199c1f; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.empresas
    ADD CONSTRAINT "UQ_cff0cc4766f86362353c4199c1f" UNIQUE (subdominio);


--
-- Name: produtos UQ_db3b880c8fe2b20926cd40b9c01; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.produtos
    ADD CONSTRAINT "UQ_db3b880c8fe2b20926cd40b9c01" UNIQUE (sku);


--
-- Name: empresas UQ_f5ed71aeb4ef47f95df5f8830b8; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.empresas
    ADD CONSTRAINT "UQ_f5ed71aeb4ef47f95df5f8830b8" UNIQUE (cnpj);


--
-- Name: propostas UQ_fadb1db471abf7f28454effcb15; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.propostas
    ADD CONSTRAINT "UQ_fadb1db471abf7f28454effcb15" UNIQUE (numero);


--
-- Name: planos_cobranca UQ_fbf6f251734e26df72e77cc29f4; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.planos_cobranca
    ADD CONSTRAINT "UQ_fbf6f251734e26df72e77cc29f4" UNIQUE (codigo);


--
-- Name: planos UQ_fe40c257ac140e05e8c0ce1a1f0; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.planos
    ADD CONSTRAINT "UQ_fe40c257ac140e05e8c0ce1a1f0" UNIQUE (codigo);


--
-- Name: empresas UQ_fe5e0374ec6d7d7dfbe04446903; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.empresas
    ADD CONSTRAINT "UQ_fe5e0374ec6d7d7dfbe04446903" UNIQUE (email);


--
-- Name: IDX_02d7405f867a53d9ec501c686d; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_02d7405f867a53d9ec501c686d" ON public.cotacoes USING btree ("prazoResposta");


--
-- Name: IDX_27128d55374ddcb811478fe161; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_27128d55374ddcb811478fe161" ON public.atendimento_canais USING btree (empresa_id, status);


--
-- Name: IDX_4abce30d9cb740a703be515d80; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_4abce30d9cb740a703be515d80" ON public.itens_cotacao USING btree (ordem);


--
-- Name: IDX_4c0c28c88a8ad89b2c1ba6c661; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_4c0c28c88a8ad89b2c1ba6c661" ON public.ticket_tags USING btree ("tagId");


--
-- Name: IDX_4d7b70fba91aea5d9439fcee01; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_4d7b70fba91aea5d9439fcee01" ON public.filas_atendentes USING btree ("filaId");


--
-- Name: IDX_51444df940548e9dda1be15423; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_51444df940548e9dda1be15423" ON public.atendimento_tickets USING btree (atendente_id);


--
-- Name: IDX_563dad1f6cbd1478ca0ae34845; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "IDX_563dad1f6cbd1478ca0ae34845" ON public.atendimento_configuracao_inatividade USING btree (empresa_id, departamento_id);


--
-- Name: IDX_56a142c6411aa1d5209d1d31a8; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_56a142c6411aa1d5209d1d31a8" ON public.atendentes USING btree ("empresaId");


--
-- Name: IDX_6aac38dbd9295ab00b90483b0b; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_6aac38dbd9295ab00b90483b0b" ON public.cotacoes USING btree (data_criacao);


--
-- Name: IDX_70fe58d85050b98f06a61c9f77; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_70fe58d85050b98f06a61c9f77" ON public.anexos_cotacao USING btree (cotacao_id);


--
-- Name: IDX_73a50683a9099014dfc1ae5f54; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_73a50683a9099014dfc1ae5f54" ON public.cotacoes USING btree (responsavel_id);


--
-- Name: IDX_8e40da9649c6e14b9178f68b01; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_8e40da9649c6e14b9178f68b01" ON public.anexos_cotacao USING btree (tipo);


--
-- Name: IDX_9d106ad882650c79cf22ce0ccd; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_9d106ad882650c79cf22ce0ccd" ON public.filas USING btree ("empresaId");


--
-- Name: IDX_a8cc61433ad56cc7353f281841; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "IDX_a8cc61433ad56cc7353f281841" ON public.cotacoes USING btree (numero);


--
-- Name: IDX_b4bbaa2f40bf189614a186b4cc; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_b4bbaa2f40bf189614a186b4cc" ON public.atendimento_tickets USING btree (empresa_id);


--
-- Name: IDX_b67b9648e4c0f0752cc559044c; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_b67b9648e4c0f0752cc559044c" ON public.cotacoes USING btree (fornecedor_id);


--
-- Name: IDX_bd3c69926bfff8721e010e77bc; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_bd3c69926bfff8721e010e77bc" ON public.ticket_tags USING btree ("ticketId");


--
-- Name: IDX_bf14ca2583d1c90e8ea75ffd8a; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_bf14ca2583d1c90e8ea75ffd8a" ON public.cotacoes USING btree (status);


--
-- Name: IDX_c2c7135bba968bf7a704f83571; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_c2c7135bba968bf7a704f83571" ON public.itens_cotacao USING btree (cotacao_id);


--
-- Name: IDX_cdcb1da9877f92375cff9b2812; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "IDX_cdcb1da9877f92375cff9b2812" ON public.filas_atendentes USING btree ("filaId", "atendenteId");


--
-- Name: IDX_ce731265611e11951800e954e6; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_ce731265611e11951800e954e6" ON public.atendimento_mensagens USING btree (ticket_id);


--
-- Name: IDX_configuracoes_gateway_empresa; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_configuracoes_gateway_empresa" ON public.configuracoes_gateway_pagamento USING btree (empresa_id);


--
-- Name: IDX_dced2c6050cacb6b2f6a5c2bb5; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_dced2c6050cacb6b2f6a5c2bb5" ON public.filas_atendentes USING btree ("atendenteId");


--
-- Name: IDX_de0189e9fc08cd5284c0a461b7; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_de0189e9fc08cd5284c0a461b7" ON public.atendimento_tickets USING btree (status);


--
-- Name: IDX_ea7b378b4f541113c0d2f82144; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_ea7b378b4f541113c0d2f82144" ON public.atendimento_canais USING btree (empresa_id, tipo);


--
-- Name: IDX_transacoes_gateway_empresa; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_transacoes_gateway_empresa" ON public.transacoes_gateway_pagamento USING btree (empresa_id);


--
-- Name: UQ_config_gateway_empresa_tipo_modo; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "UQ_config_gateway_empresa_tipo_modo" ON public.configuracoes_gateway_pagamento USING btree (empresa_id, gateway, modo_operacao);


--
-- Name: UQ_transacoes_gateway_referencia; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "UQ_transacoes_gateway_referencia" ON public.transacoes_gateway_pagamento USING btree (empresa_id, referencia_gateway);


--
-- Name: idx_pagamentos_empresa_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pagamentos_empresa_id ON public.pagamentos USING btree (empresa_id);


--
-- Name: idx_triagem_logs_empresa; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_triagem_logs_empresa ON public.triagem_logs USING btree (empresa_id);


--
-- Name: idx_triagem_logs_fluxo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_triagem_logs_fluxo ON public.triagem_logs USING btree (fluxo_id);


--
-- Name: idx_triagem_logs_sessao; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_triagem_logs_sessao ON public.triagem_logs USING btree (sessao_id);


--
-- Name: equipe_atribuicoes FK_0468dc456954a358670b7d876bd; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.equipe_atribuicoes
    ADD CONSTRAINT "FK_0468dc456954a358670b7d876bd" FOREIGN KEY (departamento_id) REFERENCES public.departamentos(id) ON DELETE CASCADE;


--
-- Name: cotacoes FK_07efe975a2015dacee8008aed9e; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cotacoes
    ADD CONSTRAINT "FK_07efe975a2015dacee8008aed9e" FOREIGN KEY (criado_por) REFERENCES public.users(id);


--
-- Name: sessoes_triagem FK_09bedc37fe0a7e7848505e44bbc; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sessoes_triagem
    ADD CONSTRAINT "FK_09bedc37fe0a7e7848505e44bbc" FOREIGN KEY (ticket_id) REFERENCES public.atendimento_tickets(id);


--
-- Name: triagem_logs FK_0a356ee00ac545a9274ca367a70; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.triagem_logs
    ADD CONSTRAINT "FK_0a356ee00ac545a9274ca367a70" FOREIGN KEY (sessao_id) REFERENCES public.sessoes_triagem(id) ON DELETE SET NULL;


--
-- Name: fornecedores FK_0fb8f907c40978d0f3b198adabc; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fornecedores
    ADD CONSTRAINT "FK_0fb8f907c40978d0f3b198adabc" FOREIGN KEY (empresa_id) REFERENCES public.empresas(id);


--
-- Name: atendente_atribuicoes FK_1b47cb3f693f95a3a067dc8640a; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.atendente_atribuicoes
    ADD CONSTRAINT "FK_1b47cb3f693f95a3a067dc8640a" FOREIGN KEY (atendente_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: assinaturas_empresas FK_1c45b5a33dce135a28b4242ab6e; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assinaturas_empresas
    ADD CONSTRAINT "FK_1c45b5a33dce135a28b4242ab6e" FOREIGN KEY (plano_id) REFERENCES public.planos(id) ON DELETE RESTRICT;


--
-- Name: planos_cobranca FK_2153bcc7f78cf5433578e7870ea; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.planos_cobranca
    ADD CONSTRAINT "FK_2153bcc7f78cf5433578e7870ea" FOREIGN KEY ("usuarioResponsavelId") REFERENCES public.users(id);


--
-- Name: oportunidades FK_21bbf91bef3ac34a19858316c17; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.oportunidades
    ADD CONSTRAINT "FK_21bbf91bef3ac34a19858316c17" FOREIGN KEY (cliente_id) REFERENCES public.clientes(id);


--
-- Name: atendente_equipes FK_21c3c8d3eb43ba80af89e860b59; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.atendente_equipes
    ADD CONSTRAINT "FK_21c3c8d3eb43ba80af89e860b59" FOREIGN KEY (equipe_id) REFERENCES public.equipes(id) ON DELETE CASCADE;


--
-- Name: atendimento_demandas FK_2691f1d5df7e1c8cdb076a55e83; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.atendimento_demandas
    ADD CONSTRAINT "FK_2691f1d5df7e1c8cdb076a55e83" FOREIGN KEY (responsavel_id) REFERENCES public.users(id);


--
-- Name: transacoes_gateway_pagamento FK_29a8272fafddb18246eb0ea7625; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transacoes_gateway_pagamento
    ADD CONSTRAINT "FK_29a8272fafddb18246eb0ea7625" FOREIGN KEY (fatura_id) REFERENCES public.faturas(id);


--
-- Name: anexos_cotacao FK_30bf115d427f4f75a8795db81d0; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.anexos_cotacao
    ADD CONSTRAINT "FK_30bf115d427f4f75a8795db81d0" FOREIGN KEY (criado_por) REFERENCES public.users(id);


--
-- Name: distribuicao_log FK_380a8c5c105b3cc1b6018baee94; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.distribuicao_log
    ADD CONSTRAINT "FK_380a8c5c105b3cc1b6018baee94" FOREIGN KEY ("filaId") REFERENCES public.filas(id);


--
-- Name: atividades FK_3b899073a5ad6b54236b10b0d9f; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.atividades
    ADD CONSTRAINT "FK_3b899073a5ad6b54236b10b0d9f" FOREIGN KEY (oportunidade_id) REFERENCES public.oportunidades(id) ON DELETE CASCADE;


--
-- Name: clientes FK_3ce809993f778f2137901b80169; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clientes
    ADD CONSTRAINT "FK_3ce809993f778f2137901b80169" FOREIGN KEY (empresa_id) REFERENCES public.empresas(id);


--
-- Name: contatos FK_4239f05a745fb2f8ff77569c52f; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contatos
    ADD CONSTRAINT "FK_4239f05a745fb2f8ff77569c52f" FOREIGN KEY ("clienteId") REFERENCES public.clientes(id) ON DELETE CASCADE;


--
-- Name: triagem_logs FK_46125a5e80b2058ff72922f1ed4; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.triagem_logs
    ADD CONSTRAINT "FK_46125a5e80b2058ff72922f1ed4" FOREIGN KEY (fluxo_id) REFERENCES public.fluxos_triagem(id) ON DELETE SET NULL;


--
-- Name: sessoes_triagem FK_4669abc8bd535917354ef7a6482; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sessoes_triagem
    ADD CONSTRAINT "FK_4669abc8bd535917354ef7a6482" FOREIGN KEY (fluxo_id) REFERENCES public.fluxos_triagem(id) ON DELETE CASCADE;


--
-- Name: empresa_modulos FK_46edc34189c9fc0365aa377b4f6; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.empresa_modulos
    ADD CONSTRAINT "FK_46edc34189c9fc0365aa377b4f6" FOREIGN KEY (empresa_id) REFERENCES public.empresas(id) ON DELETE CASCADE;


--
-- Name: users FK_47392add05643b67732b121fd13; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT "FK_47392add05643b67732b121fd13" FOREIGN KEY (empresa_id) REFERENCES public.empresas(id);


--
-- Name: atendimento_tickets FK_49ba5247c171bb23921c171a545; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.atendimento_tickets
    ADD CONSTRAINT "FK_49ba5247c171bb23921c171a545" FOREIGN KEY (fila_id) REFERENCES public.filas(id);


--
-- Name: ticket_tags FK_4c0c28c88a8ad89b2c1ba6c6619; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ticket_tags
    ADD CONSTRAINT "FK_4c0c28c88a8ad89b2c1ba6c6619" FOREIGN KEY ("tagId") REFERENCES public.tags(id);


--
-- Name: filas_atendentes FK_4d7b70fba91aea5d9439fcee014; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.filas_atendentes
    ADD CONSTRAINT "FK_4d7b70fba91aea5d9439fcee014" FOREIGN KEY ("filaId") REFERENCES public.filas(id) ON DELETE CASCADE;


--
-- Name: leads FK_502b5e6facd74f522ca707b359b; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leads
    ADD CONSTRAINT "FK_502b5e6facd74f522ca707b359b" FOREIGN KEY (oportunidade_id) REFERENCES public.oportunidades(id);


--
-- Name: transacoes_gateway_pagamento FK_510e9e87265c905d9d084b40f5f; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transacoes_gateway_pagamento
    ADD CONSTRAINT "FK_510e9e87265c905d9d084b40f5f" FOREIGN KEY (pagamento_id) REFERENCES public.pagamentos(id);


--
-- Name: password_reset_tokens FK_52ac39dd8a28730c63aeb428c9c; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT "FK_52ac39dd8a28730c63aeb428c9c" FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: nucleos_atendimento FK_547d4917d8ad9ae00b0565290de; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.nucleos_atendimento
    ADD CONSTRAINT "FK_547d4917d8ad9ae00b0565290de" FOREIGN KEY (supervisor_id) REFERENCES public.users(id);


--
-- Name: atendente_skills FK_564a92661c866d90c40249ec028; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.atendente_skills
    ADD CONSTRAINT "FK_564a92661c866d90c40249ec028" FOREIGN KEY ("atendenteId") REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: distribuicao_log FK_57d5b54e0567e026aa37be37b03; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.distribuicao_log
    ADD CONSTRAINT "FK_57d5b54e0567e026aa37be37b03" FOREIGN KEY ("ticketId") REFERENCES public.atendimento_tickets(id) ON DELETE CASCADE;


--
-- Name: oportunidades FK_5a29d725e26c0fa6aa7fa5b7881; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.oportunidades
    ADD CONSTRAINT "FK_5a29d725e26c0fa6aa7fa5b7881" FOREIGN KEY (empresa_id) REFERENCES public.empresas(id);


--
-- Name: faturas FK_5a418769af0f3afc6d27318a97e; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.faturas
    ADD CONSTRAINT "FK_5a418769af0f3afc6d27318a97e" FOREIGN KEY ("usuarioResponsavelId") REFERENCES public.users(id);


--
-- Name: sessoes_triagem FK_6207d9e297dac9b4d96099310fa; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sessoes_triagem
    ADD CONSTRAINT "FK_6207d9e297dac9b4d96099310fa" FOREIGN KEY (empresa_id) REFERENCES public.empresas(id) ON DELETE CASCADE;


--
-- Name: planos_cobranca FK_62e13ecdcccfbf97a7e84354b62; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.planos_cobranca
    ADD CONSTRAINT "FK_62e13ecdcccfbf97a7e84354b62" FOREIGN KEY ("contratoId") REFERENCES public.contratos(id);


--
-- Name: faturas FK_644bf709a39af5c760b98e56a06; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.faturas
    ADD CONSTRAINT "FK_644bf709a39af5c760b98e56a06" FOREIGN KEY (empresa_id) REFERENCES public.empresas(id);


--
-- Name: leads FK_6618ae5771955eefeb3c5605a28; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leads
    ADD CONSTRAINT "FK_6618ae5771955eefeb3c5605a28" FOREIGN KEY (responsavel_id) REFERENCES public.users(id);


--
-- Name: transacoes_gateway_pagamento FK_670ed2eaaceb73e9115cfa1776b; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transacoes_gateway_pagamento
    ADD CONSTRAINT "FK_670ed2eaaceb73e9115cfa1776b" FOREIGN KEY (configuracao_id) REFERENCES public.configuracoes_gateway_pagamento(id) ON DELETE CASCADE;


--
-- Name: faturas FK_67862e1af92d16dfa50f4e9d18b; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.faturas
    ADD CONSTRAINT "FK_67862e1af92d16dfa50f4e9d18b" FOREIGN KEY ("clienteId") REFERENCES public.clientes(id);


--
-- Name: assinaturas_contrato FK_6888c39ba396119569bdfc395d7; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assinaturas_contrato
    ADD CONSTRAINT "FK_6888c39ba396119569bdfc395d7" FOREIGN KEY ("contratoId") REFERENCES public.contratos(id);


--
-- Name: atividades FK_6f6cda5daa94cbf4831213f29b6; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.atividades
    ADD CONSTRAINT "FK_6f6cda5daa94cbf4831213f29b6" FOREIGN KEY (empresa_id) REFERENCES public.empresas(id);


--
-- Name: pagamentos FK_70ac296be6d09bee54e7281b9be; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pagamentos
    ADD CONSTRAINT "FK_70ac296be6d09bee54e7281b9be" FOREIGN KEY ("faturaId") REFERENCES public.faturas(id);


--
-- Name: anexos_cotacao FK_70fe58d85050b98f06a61c9f77c; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.anexos_cotacao
    ADD CONSTRAINT "FK_70fe58d85050b98f06a61c9f77c" FOREIGN KEY (cotacao_id) REFERENCES public.cotacoes(id) ON DELETE CASCADE;


--
-- Name: propostas FK_727439d981c9c290d5a6f7b6c48; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.propostas
    ADD CONSTRAINT "FK_727439d981c9c290d5a6f7b6c48" FOREIGN KEY (vendedor_id) REFERENCES public.users(id);


--
-- Name: cotacoes FK_73a50683a9099014dfc1ae5f54b; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cotacoes
    ADD CONSTRAINT "FK_73a50683a9099014dfc1ae5f54b" FOREIGN KEY (responsavel_id) REFERENCES public.users(id);


--
-- Name: equipes FK_807928ca2ddc53142f024894d1a; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.equipes
    ADD CONSTRAINT "FK_807928ca2ddc53142f024894d1a" FOREIGN KEY (empresa_id) REFERENCES public.empresas(id) ON DELETE CASCADE;


--
-- Name: filas FK_882c24ce0a8aad3fe5bab5c0971; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.filas
    ADD CONSTRAINT "FK_882c24ce0a8aad3fe5bab5c0971" FOREIGN KEY ("departamentoId") REFERENCES public.departamentos(id) ON DELETE SET NULL;


--
-- Name: atendimento_demandas FK_8941088e9191d7c1c826a8c4084; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.atendimento_demandas
    ADD CONSTRAINT "FK_8941088e9191d7c1c826a8c4084" FOREIGN KEY (autor_id) REFERENCES public.users(id);


--
-- Name: planos_modulos FK_8a49518d310510874e143109709; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.planos_modulos
    ADD CONSTRAINT "FK_8a49518d310510874e143109709" FOREIGN KEY (plano_id) REFERENCES public.planos(id) ON DELETE CASCADE;


--
-- Name: itens_fatura FK_932b3f8c92967639f60371e0933; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.itens_fatura
    ADD CONSTRAINT "FK_932b3f8c92967639f60371e0933" FOREIGN KEY ("faturaId") REFERENCES public.faturas(id);


--
-- Name: sessoes_triagem FK_9742e924c633a82330c135b6f09; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sessoes_triagem
    ADD CONSTRAINT "FK_9742e924c633a82330c135b6f09" FOREIGN KEY (nucleo_destino_id) REFERENCES public.nucleos_atendimento(id);


--
-- Name: distribuicao_config FK_97bf8b1c1f2ebd7726ccf1460fb; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.distribuicao_config
    ADD CONSTRAINT "FK_97bf8b1c1f2ebd7726ccf1460fb" FOREIGN KEY ("filaId") REFERENCES public.filas(id) ON DELETE CASCADE;


--
-- Name: assinaturas_contrato FK_982337179049cf74ed56082a947; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assinaturas_contrato
    ADD CONSTRAINT "FK_982337179049cf74ed56082a947" FOREIGN KEY ("usuarioId") REFERENCES public.users(id);


--
-- Name: atividades FK_996ab90829426b37f5dbb7568b9; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.atividades
    ADD CONSTRAINT "FK_996ab90829426b37f5dbb7568b9" FOREIGN KEY (criado_por_id) REFERENCES public.users(id);


--
-- Name: notifications FK_9a8a82462cab47c73d25f49261f; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT "FK_9a8a82462cab47c73d25f49261f" FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: faturas FK_9b8490bce74e62adb498b5ccbb6; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.faturas
    ADD CONSTRAINT "FK_9b8490bce74e62adb498b5ccbb6" FOREIGN KEY ("contratoId") REFERENCES public.contratos(id);


--
-- Name: equipe_atribuicoes FK_ad01e06883cc2096416adaabc30; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.equipe_atribuicoes
    ADD CONSTRAINT "FK_ad01e06883cc2096416adaabc30" FOREIGN KEY (equipe_id) REFERENCES public.equipes(id) ON DELETE CASCADE;


--
-- Name: departamentos FK_adf5ac13288ba0e8b9a2ef272a1; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.departamentos
    ADD CONSTRAINT "FK_adf5ac13288ba0e8b9a2ef272a1" FOREIGN KEY (nucleo_id) REFERENCES public.nucleos_atendimento(id) ON DELETE CASCADE;


--
-- Name: produtos FK_afe3324a3eebac3e0cdc0c3d6ff; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.produtos
    ADD CONSTRAINT "FK_afe3324a3eebac3e0cdc0c3d6ff" FOREIGN KEY (empresa_id) REFERENCES public.empresas(id);


--
-- Name: departamentos FK_b66dbedc1b7354ea37e3931551f; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.departamentos
    ADD CONSTRAINT "FK_b66dbedc1b7354ea37e3931551f" FOREIGN KEY (empresa_id) REFERENCES public.empresas(id) ON DELETE CASCADE;


--
-- Name: cotacoes FK_b67b9648e4c0f0752cc559044cf; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cotacoes
    ADD CONSTRAINT "FK_b67b9648e4c0f0752cc559044cf" FOREIGN KEY (fornecedor_id) REFERENCES public.fornecedores(id);


--
-- Name: planos_modulos FK_ba0080755e6cfd5e3ed11c8b5e1; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.planos_modulos
    ADD CONSTRAINT "FK_ba0080755e6cfd5e3ed11c8b5e1" FOREIGN KEY (modulo_id) REFERENCES public.modulos_sistema(id) ON DELETE CASCADE;


--
-- Name: oportunidades FK_bd266e55d0034b861f2c7e2ae53; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.oportunidades
    ADD CONSTRAINT "FK_bd266e55d0034b861f2c7e2ae53" FOREIGN KEY (responsavel_id) REFERENCES public.users(id);


--
-- Name: ticket_tags FK_bd3c69926bfff8721e010e77bcc; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ticket_tags
    ADD CONSTRAINT "FK_bd3c69926bfff8721e010e77bcc" FOREIGN KEY ("ticketId") REFERENCES public.atendimento_tickets(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: leads FK_c1bd083a5d03538d2e23015c255; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leads
    ADD CONSTRAINT "FK_c1bd083a5d03538d2e23015c255" FOREIGN KEY (empresa_id) REFERENCES public.empresas(id);


--
-- Name: itens_cotacao FK_c2c7135bba968bf7a704f835711; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.itens_cotacao
    ADD CONSTRAINT "FK_c2c7135bba968bf7a704f835711" FOREIGN KEY (cotacao_id) REFERENCES public.cotacoes(id) ON DELETE CASCADE;


--
-- Name: atendimento_notas_cliente FK_c60fc0dc807287e6f8d11594469; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.atendimento_notas_cliente
    ADD CONSTRAINT "FK_c60fc0dc807287e6f8d11594469" FOREIGN KEY (autor_id) REFERENCES public.users(id);


--
-- Name: cotacoes FK_c6877b6157ba08b668c85b5ac97; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cotacoes
    ADD CONSTRAINT "FK_c6877b6157ba08b668c85b5ac97" FOREIGN KEY (aprovador_id) REFERENCES public.users(id);


--
-- Name: atendente_atribuicoes FK_cdc9f5acf590fb9e8760d92ba1e; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.atendente_atribuicoes
    ADD CONSTRAINT "FK_cdc9f5acf590fb9e8760d92ba1e" FOREIGN KEY (departamento_id) REFERENCES public.departamentos(id) ON DELETE CASCADE;


--
-- Name: nucleos_atendimento FK_d2a8671cf567caef7aeda8352b3; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.nucleos_atendimento
    ADD CONSTRAINT "FK_d2a8671cf567caef7aeda8352b3" FOREIGN KEY (empresa_id) REFERENCES public.empresas(id) ON DELETE CASCADE;


--
-- Name: fluxos_triagem FK_d39ec337e1301c5f517fa7ebbdb; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fluxos_triagem
    ADD CONSTRAINT "FK_d39ec337e1301c5f517fa7ebbdb" FOREIGN KEY (empresa_id) REFERENCES public.empresas(id) ON DELETE CASCADE;


--
-- Name: atendente_atribuicoes FK_d6ec4d35674ff06994bd1197e40; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.atendente_atribuicoes
    ADD CONSTRAINT "FK_d6ec4d35674ff06994bd1197e40" FOREIGN KEY (nucleo_id) REFERENCES public.nucleos_atendimento(id) ON DELETE CASCADE;


--
-- Name: cotacoes FK_da821dfa7a5a1c4b8f25bf331b3; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cotacoes
    ADD CONSTRAINT "FK_da821dfa7a5a1c4b8f25bf331b3" FOREIGN KEY (atualizado_por) REFERENCES public.users(id);


--
-- Name: transacoes_gateway_pagamento FK_dab1b20ebbbce0172feaedcf1c6; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transacoes_gateway_pagamento
    ADD CONSTRAINT "FK_dab1b20ebbbce0172feaedcf1c6" FOREIGN KEY (empresa_id) REFERENCES public.empresas(id);


--
-- Name: departamentos FK_db00064f5ca1cf26f1d6776011c; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.departamentos
    ADD CONSTRAINT "FK_db00064f5ca1cf26f1d6776011c" FOREIGN KEY (supervisor_id) REFERENCES public.users(id);


--
-- Name: filas_atendentes FK_dced2c6050cacb6b2f6a5c2bb5d; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.filas_atendentes
    ADD CONSTRAINT "FK_dced2c6050cacb6b2f6a5c2bb5d" FOREIGN KEY ("atendenteId") REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: pagamentos FK_e87c3a5a1e8b1c047ebbe0adda0; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pagamentos
    ADD CONSTRAINT "FK_e87c3a5a1e8b1c047ebbe0adda0" FOREIGN KEY (empresa_id) REFERENCES public.empresas(id);


--
-- Name: equipe_atribuicoes FK_e95f80150da73629f28591e2423; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.equipe_atribuicoes
    ADD CONSTRAINT "FK_e95f80150da73629f28591e2423" FOREIGN KEY (nucleo_id) REFERENCES public.nucleos_atendimento(id) ON DELETE CASCADE;


--
-- Name: atendimento_configuracao_inatividade FK_eb5c423596a1b4426136371d5d6; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.atendimento_configuracao_inatividade
    ADD CONSTRAINT "FK_eb5c423596a1b4426136371d5d6" FOREIGN KEY (departamento_id) REFERENCES public.departamentos(id) ON DELETE CASCADE;


--
-- Name: contratos FK_f2926f09e28397467be35b35f8c; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contratos
    ADD CONSTRAINT "FK_f2926f09e28397467be35b35f8c" FOREIGN KEY ("usuarioResponsavelId") REFERENCES public.users(id);


--
-- Name: atendente_equipes FK_f2dfc074738e5b2afcfc72cf1be; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.atendente_equipes
    ADD CONSTRAINT "FK_f2dfc074738e5b2afcfc72cf1be" FOREIGN KEY (atendente_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: filas FK_f4c11751cb292dd663b107ec15f; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.filas
    ADD CONSTRAINT "FK_f4c11751cb292dd663b107ec15f" FOREIGN KEY ("nucleoId") REFERENCES public.nucleos_atendimento(id) ON DELETE SET NULL;


--
-- Name: contratos FK_f4c48faad5e870abd0b4eac069e; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contratos
    ADD CONSTRAINT "FK_f4c48faad5e870abd0b4eac069e" FOREIGN KEY (empresa_id) REFERENCES public.empresas(id);


--
-- Name: configuracoes_gateway_pagamento FK_f53ca59a1c05ea4d8f6f851927a; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.configuracoes_gateway_pagamento
    ADD CONSTRAINT "FK_f53ca59a1c05ea4d8f6f851927a" FOREIGN KEY (empresa_id) REFERENCES public.empresas(id);


--
-- Name: distribuicao_log FK_f9e61fcb5a74c76ddb93e2d04c5; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.distribuicao_log
    ADD CONSTRAINT "FK_f9e61fcb5a74c76ddb93e2d04c5" FOREIGN KEY ("atendenteId") REFERENCES public.users(id);


--
-- Name: contratos FK_fba798764f6836ea6d314959532; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contratos
    ADD CONSTRAINT "FK_fba798764f6836ea6d314959532" FOREIGN KEY ("propostaId") REFERENCES public.propostas(id);


--
-- PostgreSQL database dump complete
--

