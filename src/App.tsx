import React, { useMemo, useState } from 'react';
import { FetchHttpClientAdapter } from '@shared/infrastructure/http/FetchHttpClientAdapter';
import { LocalStorageSessionAdapter } from '@modules/auth/infrastructure/adapters/LocalStorageSessionAdapter';
import { HttpAuthRepositoryAdapter } from '@modules/auth/infrastructure/adapters/HttpAuthRepositoryAdapter';
import { LoginUseCase } from '@modules/auth/application/use-cases/LoginUseCase';
import { LogoutUseCase } from '@modules/auth/application/use-cases/LogoutUseCase';
import { RestoreSessionUseCase } from '@modules/auth/application/use-cases/RestoreSessionUseCase';
import { UserSession } from '@modules/auth/domain/models/UserSession.model';
import { LoginPage } from '@modules/auth/infrastructure/ui/LoginPage';
import { HttpWorkspaceRepositoryAdapter } from '@modules/pos-workspace/infrastructure/adapters/HttpWorkspaceRepositoryAdapter';
import { GetWorkspaceAnalyticsUseCase } from '@modules/pos-workspace/application/use-cases/GetWorkspaceAnalyticsUseCase';
import { HttpCatalogRepositoryAdapter } from '@modules/catalog/infrastructure/adapters/HttpCatalogRepositoryAdapter';
import { CatalogUseCases } from '@modules/catalog/application/use-cases/CatalogUseCases';
import { PosWorkspacePage } from '@modules/pos-workspace/infrastructure/ui/PosWorkspacePage';

/**
 * Raíz de Composición Hexagonal (Dependency Injection Container de NatsarStore)
 */
export const App: React.FC = () => {
  const {
    loginUseCase,
    logoutUseCase,
    analyticsUseCase,
    catalogUseCases,
    initialData,
  } = useMemo(() => {
    const sessionStorage = new LocalStorageSessionAdapter();
    const apiBaseUrl = (import.meta.env.VITE_API_URL || 'https://sistemapos-dian.onrender.com').replace(/\/+$/, '');
    const httpClient = new FetchHttpClientAdapter(apiBaseUrl, () => {
      const current = sessionStorage.getSession();
      return current?.tokens.accessToken ?? null;
    });
    const authRepository = new HttpAuthRepositoryAdapter(httpClient);
    const workspaceRepository = new HttpWorkspaceRepositoryAdapter(httpClient);
    const catalogRepository = new HttpCatalogRepositoryAdapter(httpClient);

    const restore = new RestoreSessionUseCase(sessionStorage);
    return {
      loginUseCase: new LoginUseCase(authRepository, sessionStorage),
      logoutUseCase: new LogoutUseCase(authRepository, sessionStorage),
      analyticsUseCase: new GetWorkspaceAnalyticsUseCase(workspaceRepository),
      catalogUseCases: new CatalogUseCases(catalogRepository),
      initialData: restore.execute(),
    };
  }, []);

  const [session, setSession] = useState<UserSession | null>(initialData.session);

  const handleLogin = async (
    email: string,
    password: string,
    rememberMe: boolean
  ): Promise<string | null> => {
    const result = await loginUseCase.execute({ email, password, rememberMe });
    if (result.isFailure) {
      return result.error;
    }
    setSession(result.getValue());
    return null;
  };

  const handleLogout = async () => {
    await logoutUseCase.execute();
    setSession(null);
  };

  if (!session) {
    return (
      <LoginPage
        initialEmail={initialData.rememberedEmail}
        onSubmitLogin={handleLogin}
      />
    );
  }

  return (
    <PosWorkspacePage
      session={session}
      analyticsUseCase={analyticsUseCase}
      catalogUseCases={catalogUseCases}
      onLogout={handleLogout}
    />
  );
};
