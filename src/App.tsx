import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FriendlyNotice } from '@shared/domain/FriendlyErrorMapper';
import { FetchHttpClientAdapter } from '@shared/infrastructure/http/FetchHttpClientAdapter';
import { LocalStorageSessionAdapter } from '@modules/auth/infrastructure/adapters/LocalStorageSessionAdapter';
import { HttpAuthRepositoryAdapter } from '@modules/auth/infrastructure/adapters/HttpAuthRepositoryAdapter';
import { LoginUseCase } from '@modules/auth/application/use-cases/LoginUseCase';
import { LogoutUseCase } from '@modules/auth/application/use-cases/LogoutUseCase';
import { RefreshTokenUseCase } from '@modules/auth/application/use-cases/RefreshTokenUseCase';
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
import { HttpPosTerminalRepositoryAdapter } from '@modules/pos-terminal/infrastructure/adapters/HttpPosTerminalRepositoryAdapter';
import { PosTerminalUseCases } from '@modules/pos-terminal/application/use-cases/PosTerminalUseCases';
import { PosWorkspacePage } from '@modules/pos-workspace/infrastructure/ui/PosWorkspacePage';
import { EcommerceStorefrontPage } from '@modules/storefront';
import { CustomerFacingDisplayPage } from '@modules/pos-terminal/infrastructure/ui/CustomerFacingDisplayPage';

const SESSION_EXPIRED_NOTICE: FriendlyNotice = {
  title: 'Tu sesión ha finalizado por tiempo',
  message:
    'El tiempo de vigencia de tu sesión ha concluido por seguridad y dejó de estar activa. Por favor inicia sesión nuevamente para continuar.',
  tone: 'warning',
  actionLabel: 'Iniciar sesión',
};

/**
 * Raíz de Composición Hexagonal (Dependency Injection Container de NatsarStore)
 * Conecta todos los módulos DDD con Puertos, Adaptadores, Refresh Token y control de expiración.
 */
export const App: React.FC = () => {
  const {
    sessionStorage,
    httpClient,
    loginUseCase,
    logoutUseCase,
    refreshTokenUseCase,
    analyticsUseCase,
    catalogUseCases,
    inventoryUseCases,
    logisticsUseCases,
    customerUseCases,
    rbacUseCases,
    establishmentUseCases,
    settingsUseCases,
    posTerminalUseCases,
    initialData,
  } = useMemo(() => {
    const sessionStorage = new LocalStorageSessionAdapter();
    const apiBaseUrl = (
      import.meta.env.VITE_API_URL || 'https://sistemapos-dian.onrender.com'
    ).replace(/\/+$/, '');
    const httpClient = new FetchHttpClientAdapter(apiBaseUrl, () => {
      const current = sessionStorage.getSession();
      if (!current || current.isExpired()) {
        return null;
      }
      return current.tokens.accessToken;
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
    const posTerminalRepository = new HttpPosTerminalRepositoryAdapter(inventoryRepository);

    const restore = new RestoreSessionUseCase(sessionStorage);
    return {
      sessionStorage,
      httpClient,
      loginUseCase: new LoginUseCase(authRepository, sessionStorage),
      logoutUseCase: new LogoutUseCase(authRepository, sessionStorage),
      refreshTokenUseCase: new RefreshTokenUseCase(authRepository, sessionStorage),
      analyticsUseCase: new GetWorkspaceAnalyticsUseCase(workspaceRepository),
      catalogUseCases: new CatalogUseCases(catalogRepository),
      inventoryUseCases: new InventoryUseCases(inventoryRepository),
      logisticsUseCases: new LogisticsUseCases(logisticsRepository),
      customerUseCases: new CustomerUseCases(customerRepository),
      rbacUseCases: new RbacUseCases(rbacRepository),
      establishmentUseCases: new EstablishmentUseCases(establishmentRepository),
      settingsUseCases: new SettingsUseCases(settingsRepository),
      posTerminalUseCases: new PosTerminalUseCases(posTerminalRepository),
      initialData: restore.execute(),
    };
  }, []);

  const [session, setSession] = useState<UserSession | null>(initialData.session);
  const [currentView, setCurrentView] = useState<'store' | 'workspace' | 'login'>('store');
  const [sessionRemainingSeconds, setSessionRemainingSeconds] = useState<number>(() =>
    initialData.session ? initialData.session.getRemainingSeconds() : 0
  );
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState<boolean>(false);
  const [isRefreshingToken, setIsRefreshingToken] = useState<boolean>(false);
  const [expiredNotice, setExpiredNotice] = useState<FriendlyNotice | null>(null);

  const sessionRef = useRef<UserSession | null>(session);
  sessionRef.current = session;
  const autoRefreshAttemptedForTokenRef = useRef<string | null>(null);

  const handleSessionExpired = useCallback(() => {
    sessionStorage.clearSession();
    setSession(null);
    setSessionRemainingSeconds(0);
    setExpiredNotice(SESSION_EXPIRED_NOTICE);
    setCurrentView('store');
  }, [sessionStorage]);

  const handleRefreshSessionToken = useCallback(async (): Promise<boolean> => {
    const current = sessionRef.current;
    if (!current) return false;
    setIsRefreshingToken(true);
    const res = await refreshTokenUseCase.execute(current);
    setIsRefreshingToken(false);
    if (res.isSuccess) {
      const updated = res.getValue();
      setSession(updated);
      setSessionRemainingSeconds(updated.getRemainingSeconds());
      autoRefreshAttemptedForTokenRef.current = null;
      return true;
    }
    return false;
  }, [refreshTokenUseCase]);

  // Conectar interceptor HTTP 401 -> Refresh Token -> Si falla o expiró, cerrar sesión
  useEffect(() => {
    httpClient.configureSessionLifecycle({
      onUnauthorizedRefresh: async () => {
        const current = sessionRef.current;
        if (!current || current.isExpired()) {
          return null;
        }
        const res = await refreshTokenUseCase.execute(current);
        if (res.isSuccess) {
          const updated = res.getValue();
          setSession(updated);
          setSessionRemainingSeconds(updated.getRemainingSeconds());
          return updated.tokens.accessToken;
        }
        return null;
      },
      onSessionExpired: handleSessionExpired,
    });
  }, [httpClient, refreshTokenUseCase, handleSessionExpired]);

  // Reloj guardián de vigencia de sesión (1 segundo):
  // Cuando el tiempo pasa y llega a 0, la sesión deja de funcionar inmediatamente.
  useEffect(() => {
    if (!session) return;

    const tick = () => {
      const active = sessionRef.current;
      if (!active) return;

      const remaining = active.getRemainingSeconds();
      setSessionRemainingSeconds(remaining);

      if (remaining <= 0 || active.isExpired()) {
        handleSessionExpired();
        return;
      }

      if (
        autoRefreshEnabled &&
        remaining <= 35 &&
        autoRefreshAttemptedForTokenRef.current !== active.tokens.accessToken
      ) {
        autoRefreshAttemptedForTokenRef.current = active.tokens.accessToken;
        void handleRefreshSessionToken();
      }
    };

    tick();
    const intervalId = window.setInterval(tick, 1000);
    return () => window.clearInterval(intervalId);
  }, [session, autoRefreshEnabled, handleSessionExpired, handleRefreshSessionToken]);

  const handleLogin = async (
    email: string,
    password: string,
    rememberMe: boolean
  ): Promise<string | null> => {
    const result = await loginUseCase.execute({ email, password, rememberMe });
    if (result.isFailure) {
      return result.error;
    }
    const newSession = result.getValue();
    setExpiredNotice(null);
    setSession(newSession);
    setSessionRemainingSeconds(newSession.getRemainingSeconds());
    return null;
  };

  const handleLogout = async () => {
    await logoutUseCase.execute();
    setSession(null);
    setSessionRemainingSeconds(0);
    setCurrentView('store');
  };

  const handleUpdateSession = (updatedSession: UserSession) => {
    sessionStorage.saveSession(updatedSession);
    setSession(updatedSession);
    setSessionRemainingSeconds(updatedSession.getRemainingSeconds());
  };

  const handleSimulateExpirationCountdown = (seconds: number) => {
    if (!session) return;
    setAutoRefreshEnabled(false);
    const simulated = session.withForcedRemainingSeconds(seconds);
    handleUpdateSession(simulated);
  };

  // 0. Pantalla Secundaria Orientada al Cliente (Customer Facing Display)
  // Accesible en pestaña o monitor secundario y sincronizada en tiempo real con el POS
  const isCustomerDisplay =
    typeof window !== 'undefined' &&
    (window.location.search.toLowerCase().includes('customer-display') ||
      window.location.search.toLowerCase().includes('pantalla-cliente') ||
      window.location.pathname.toLowerCase().includes('customer-display') ||
      window.location.pathname.toLowerCase().includes('pantalla-cliente') ||
      window.location.hash.toLowerCase().includes('customer-display') ||
      window.location.hash.toLowerCase().includes('pantalla-cliente'));

  if (isCustomerDisplay) {
    return <CustomerFacingDisplayPage />;
  }

  // 1. Vista de Portal de Login Completo
  if (currentView === 'login') {
    return (
      <LoginPage
        initialEmail={initialData.rememberedEmail}
        initialNotice={expiredNotice}
        onClearInitialNotice={() => setExpiredNotice(null)}
        onSubmitLogin={async (email, password, rememberMe) => {
          const err = await handleLogin(email, password, rememberMe);
          if (!err) {
            setCurrentView('workspace');
          }
          return err;
        }}
        onBackToStore={() => setCurrentView('store')}
      />
    );
  }

  // 2. Vista de Panel Administrativo POS Workspace (solo para usuarios autenticados)
  if (currentView === 'workspace' && session) {
    return (
      <PosWorkspacePage
        session={session}
        sessionRemainingSeconds={sessionRemainingSeconds}
        autoRefreshEnabled={autoRefreshEnabled}
        isRefreshingToken={isRefreshingToken}
        analyticsUseCase={analyticsUseCase}
        catalogUseCases={catalogUseCases}
        inventoryUseCases={inventoryUseCases}
        logisticsUseCases={logisticsUseCases}
        customerUseCases={customerUseCases}
        rbacUseCases={rbacUseCases}
        establishmentUseCases={establishmentUseCases}
        settingsUseCases={settingsUseCases}
        posTerminalUseCases={posTerminalUseCases}
        onToggleAutoRefresh={setAutoRefreshEnabled}
        onRefreshSessionToken={handleRefreshSessionToken}
        onSimulateExpirationCountdown={handleSimulateExpirationCountdown}
        onUpdateSession={handleUpdateSession}
        onLogout={handleLogout}
        onGoToStore={() => setCurrentView('store')}
      />
    );
  }

  // 3. Vista Principal por Defecto: Tienda E-Commerce (Pública y accesible sin login previo)
  return (
    <EcommerceStorefrontPage
      catalogUseCases={catalogUseCases}
      session={session}
      onOpenFullLogin={() => setCurrentView('login')}
      onSubmitLogin={async (email, password, rememberMe) => {
        const err = await handleLogin(email, password, rememberMe);
        return err;
      }}
      onGoToWorkspace={() => setCurrentView('workspace')}
      onLogout={handleLogout}
    />
  );
};
