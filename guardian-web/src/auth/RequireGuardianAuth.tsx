import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';

type RequireGuardianAuthProps = {
  children: JSX.Element;
};

export const RequireGuardianAuth = ({ children }: RequireGuardianAuthProps) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="screen-center">
        <div className="loader" />
        <p>Validando sessao guardian...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
};
