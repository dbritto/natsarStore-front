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
import { HttpInventoryRepositoryAdapter } from '@modules/inventory/infrastructure/adapters/HttpInventoryRepositoryAdapter';
import { InventoryUseCases } from '@modules/inventory/application/use-cases/InventoryUseCases';
import { HttpLogisticsRepositoryAdapter } from '@modules/logistics/infrastructure/adapters/HttpLogisticsRepositoryAdapter';
import { LogisticsUseCases } from '@modules/logistics/application/use-cases/LogisticsUseCases';
import { HttpCustomerRepositoryAdapter } from '@modules/customers/infrastructure/adapters/HttpCustomerRepositoryAdapter';
import { CustomerUseCases } from '@modules/customers/application/use-cases/CustomerUseCases';
import { HttpRbacRepositoryAdapter } from '@modules/rbac/infrastructure/adapters/HttpRbacRepositoryAdapter';
import { RbacUseCases } from '@modules/rbac/application/use-cases/RbacUseCases';
import { HttpEstablishmentRepositoryAdapter } from '@modules/establishments/infrastructure/adapters/HttpEstablishmentRepositoryAdapter';
import { EstablishmentUseCases } from '@modules/establishments/application/use-cases/EstablishmentUseCases';
import { HttpSettingsRepositoryAdapter } from '@modules/settings/infrastructure/adapters/HttpSettingsRepositoryAdapter';
import { SettingsUseCases } from '@modules/settings/application/use-cases/SettingsUseCases';
import { PosWorkspacePage } from '@modules/pos-workspace/infrastructure/ui/PosWorkspacePage';

/**
 * Raíz de Composición Hexagonal (Dependency Injection Container de NatsarStore)
 * Conecta el 100% de los módulos del Swagger con Puertos, Adaptadores y Casos de Uso.
 */
export const App: React.FC = () => {
  const {
    loginUseCase,
    logoutUseCase,
    analyticsUseCase,
    catalogUseCases,
    inventoryUseCases,
    logisticsUseCases,
    customerUseCases,
    rbacUseCases,
    establishmentUseCases,
    settingsUseCases,
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
    const inventoryRepository = new HttpInventoryRepositoryAdapter(httpClient);
    const logisticsRepository = new HttpLogisticsRepositoryAdapter(httpClient);
    const customerRepository = new HttpCustomerRepositoryAdapter(httpClient);
    const rbacRepository = new HttpRbacRepositoryAdapter(httpClient);
    const establishmentRepository = new HttpEstablishmentRepositoryAdapter(httpClient);
    const settingsRepository = new HttpSettingsRepositoryAdapter(httpClient);

    const restore = new RestoreSessionUseCase(sessionStorage);
    return {
      loginUseCase: new LoginUseCase(authRepository, sessionStorage),
      logoutUseCase: new LogoutUseCase(authRepository, sessionStorage),
      analyticsUseCase: new GetWorkspaceAnalyticsUseCase(workspaceRepository),
      catalogUseCases: new CatalogUseCases(catalogRepository),
      inventoryUseCases: new InventoryUseCases(inventoryRepository),
      logisticsUseCases: new LogisticsUseCases(logisticsRepository),
      customerUseCases: new CustomerUseCases(customerRepository),
      rbacUseCases: new RbacUseCases(rbacRepository),
      establishmentUseCases: new EstablishmentUseCases(establishmentRepository),
      settingsUseCases: new SettingsUseCases(settingsRepository),
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
      inventoryUseCases={inventoryUseCases}
      logisticsUseCases={logisticsUseCases}
      customerUseCases={customerUseCases}
      rbacUseCases={rbacUseCases}
      establishmentUseCases={establishmentUseCases}
      settingsUseCases={settingsUseCases}
      onLogout={handleLogout}
    />
  );
};
