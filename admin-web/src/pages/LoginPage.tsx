import { FormEvent, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ShieldCheck, KeyRound, RefreshCcw } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';

const maskEmail = (email: string) => {
  const [local, domain] = email.split('@');
  if (!local || !domain) {
    return email;
  }
  if (local.length <= 2) {
    return `${local[0]}***@${domain}`;
  }
  return `${local.slice(0, 2)}***@${domain}`;
};

export const LoginPage = () => {
  const { login, verifyMfa, resendMfa, mfaChallenge } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const redirectTo = useMemo(() => {
    const state = location.state as { from?: { pathname?: string } } | undefined;
    return state?.from?.pathname || '/';
  }, [location.state]);

  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [codigo, setCodigo] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email.trim(), senha);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao autenticar.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyMfa = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!mfaChallenge) {
      return;
    }

    setError(null);
    setLoading(true);
    try {
      await verifyMfa(mfaChallenge.challengeId, codigo.trim());
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao validar codigo MFA.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!mfaChallenge) {
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await resendMfa(mfaChallenge.challengeId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao reenviar codigo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-shell">
      <section className="login-card">
        <header>
          <span className="pill">Conect360 Admin Web</span>
          <h1>Acesso administrativo</h1>
          <p>
            Ambiente dedicado para governanca e operacoes criticas. Perfis permitidos:
            superadmin, admin e gerente.
          </p>
        </header>

        {!mfaChallenge ? (
          <form onSubmit={handleLogin} className="form-grid">
            <label>
              Email
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="admin@empresa.com"
                required
                autoComplete="email"
              />
            </label>
            <label>
              Senha
              <input
                type="password"
                value={senha}
                onChange={(event) => setSenha(event.target.value)}
                placeholder="Digite sua senha"
                required
                autoComplete="current-password"
              />
            </label>
            <button type="submit" className="button primary" disabled={loading}>
              <ShieldCheck size={16} />
              {loading ? 'Entrando...' : 'Entrar no admin-web'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyMfa} className="form-grid">
            <div className="mfa-info">
              <KeyRound size={18} />
              <div>
                <p>
                  Codigo MFA enviado para <strong>{maskEmail(mfaChallenge.email)}</strong>.
                </p>
                {mfaChallenge.deliveryChannel === 'dev_fallback' && mfaChallenge.devCode ? (
                  <p>
                    Ambiente de desenvolvimento sem SMTP: use o codigo{' '}
                    <strong>{mfaChallenge.devCode}</strong>.
                  </p>
                ) : null}
              </div>
            </div>
            <label>
              Codigo MFA
              <input
                type="text"
                value={codigo}
                onChange={(event) => setCodigo(event.target.value)}
                placeholder="000000"
                required
                maxLength={6}
                inputMode="numeric"
              />
            </label>
            <div className="row-gap">
              <button type="submit" className="button primary" disabled={loading}>
                <ShieldCheck size={16} />
                {loading ? 'Validando...' : 'Validar codigo'}
              </button>
              <button type="button" className="button secondary" disabled={loading} onClick={handleResend}>
                <RefreshCcw size={16} />
                Reenviar codigo
              </button>
            </div>
          </form>
        )}

        {error ? <p className="error-text">{error}</p> : null}
      </section>
    </div>
  );
};
