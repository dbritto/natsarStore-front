# natsarStore-front

Frontend Corporativo Minimalista de **NatsarStore** construido con **React + TypeScript + Vite**, aplicando **Domain-Driven Design (DDD)**, **Arquitectura Hexagonal (Ports & Adapters)**, **Diseño Basado en Modelos** y **Atomic Design** centralizado en `src/shared/components` para evitar duplicación de componentes.

---

## 🏛️ Estructura Arquitectónica

```text
src/
├── shared/                                  # Shared Kernel & Sistema de Diseño Atómico
│   ├── components/                          # Atomic Design (Cero repetición de componentes)
│   │   ├── atoms/                           # Button, Input, Checkbox, Badge, Divider, Icon, BrandLogo, Typography
│   │   ├── molecules/                       # FormField, PasswordField, SocialAuthButton, StatMetricCard, AlertBanner, FloatingWidgetCard
│   │   ├── organisms/                       # CorporateShowcaseHero, TopNavbar
│   │   ├── templates/                       # AuthSplitTemplate, WorkspaceShellTemplate
│   │   └── index.ts                         # Barrel file único (@shared/components)
│   ├── domain/                              # Primitivas DDD: Entity<T>, ValueObject<T>, Result<T>
│   ├── infrastructure/
│   │   └── http/                            # HttpClientPort + FetchHttpClientAdapter (Inyecta X-Request-ID, X-Channel-ID, Accept-Language)
│   └── styles/
│       └── tokens.css                       # Variables CSS y tokens corporativos minimalistas
│
├── modules/                                 # Bounded Contexts (DDD + Hexagonal)
│   ├── auth/                                # Módulo de Autenticación y Sesiones RBAC
│   │   ├── domain/
│   │   │   ├── models/                      # UserSession.model.ts (RBAC + superAdmin:*), AuthTokens.model.ts (JWT RS256 decoder)
│   │   │   ├── value-objects/               # Email.vo.ts, Password.vo.ts
│   │   │   └── ports/                       # AuthRepositoryPort.ts, SessionStoragePort.ts
│   │   ├── application/
│   │   │   └── use-cases/                   # LoginUseCase.ts, LogoutUseCase.ts, RestoreSessionUseCase.ts
│   │   └── infrastructure/
│   │       ├── adapters/                    # HttpAuthRepositoryAdapter.ts, LocalStorageSessionAdapter.ts
│   │       └── ui/                          # LoginPage.tsx (Driving Adapter)
│   │
│   └── pos-workspace/                       # Módulo Operativo NatsarStore & Liquidación Tributaria DIAN
│       ├── domain/
│       │   ├── models/                      # TaxSettlement.model.ts (Motor IVA 19%/5%, INC 8%, ReteFuente 2.5%)
│       │   └── value-objects/               # DianNit.vo.ts (Cálculo Módulo 11 DV oficial DIAN), MoneyCop.vo.ts
│       ├── application/
│       │   └── use-cases/                   # SimulatePosCheckoutUseCase.ts
│       └── infrastructure/
│           └── ui/                          # PosWorkspacePage.tsx (Driving Adapter)
│
├── App.tsx                                  # Raíz de Composición e Inyección de Dependencias Hexagonal
└── main.tsx                                 # Punto de entrada React
```

---

## 🚀 Desarrollo Local

```bash
npm install
npm run dev
```
