import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';

type RequireAdminAuthProps = {
  children: JSX.Element;
};

export const RequireAdminAuth = ({ children }: RequireAdminAuthProps) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="screen-center">
        <div className="loader" />
        <p>Validando sessao administrativa...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
};
