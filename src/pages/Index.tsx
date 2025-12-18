import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to store as primary landing page
    navigate('/store', { replace: true });
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <div className="animate-pulse">
          <h1 className="text-2xl font-semibold text-foreground">Redirigiendo...</h1>
        </div>
      </div>
    </div>
  );
};

export default Index;
