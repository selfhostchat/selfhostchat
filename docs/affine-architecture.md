# AFFiNE Architecture Documentation

> Comprehensive documentation of AFFiNE's architecture, compiled from source code analysis and DeepWiki documentation.
> Last indexed: 16 May 2026 (commit e9ef3c)

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Monorepo Structure](#2-monorepo-structure)
3. [Multi-Platform Architecture](#3-multi-platform-architecture)
4. [Frontend Architecture](#4-frontend-architecture)
5. [Backend Architecture](#5-backend-architecture)
6. [State Management and Services](#6-state-management-and-services)
7. [Feature Flag System](#7-feature-flag-system)
8. [GraphQL API and Schema](#8-graphql-api-and-schema)
9. [Real-time Synchronization](#9-real-time-synchronization)
10. [Document Processing and Y-OCTO CRDT](#10-document-processing-and-y-octo-crdt)
11. [AI Copilot System](#11-ai-copilot-system)
12. [Payment and Subscription System](#12-payment-and-subscription-system)
13. [Authentication and Access Control](#13-authentication-and-access-control)
14. [Native Module Integration (Rust/NAPI)](#14-native-module-integration-rustnapi)
15. [Build System and Tools](#15-build-system-and-tools)
16. [Deployment Architecture](#16-deployment-architecture)
17. [Technology Stack Summary](#17-technology-stack-summary)

---

## 1. System Overview

### 1.1 Three-Layer Architecture

AFFiNE is a collaborative workspace application built as a **monorepo** using Yarn workspaces. The system comprises three primary architectural layers:

| Layer | Description | Technology |
|-------|-------------|-------------|
| **Frontend Layer** | Multi-platform applications (web, desktop, mobile) sharing common business logic via `@affine/core` | React 19, Vite, Electron, Capacitor |
| **Backend Layer** | NestJS-based server providing GraphQL APIs, real-time sync, and AI capabilities | NestJS 11, Apollo GraphQL, Socket.io |
| **Native Layer** | High-performance Rust modules for CPU-intensive operations (CRDT processing, document parsing) | Rust, NAPI-RS, UniFFI |

### 1.2 High-Level System Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                           CLIENTS                                     │
│   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────┐  │
│   │    Web      │  │  Desktop    │  │     iOS     │  │ Android │  │
│   │  (Vite)    │  │ (Electron)  │  │ (Capacitor) │  │(Capacitor)│ │
│   └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └────┬────┘  │
│          │                │                │                │        │
└──────────┼────────────────┼────────────────┼────────────────┼────────┘
           │                │                │                │
           └────────────────┴───────┬────────┴────────────────┘
                                  │
                    ┌──────────────▼──────────────┐
                    │        @affine/core         │
                    │     (Shared Business Logic)  │
                    └──────────────┬──────────────┘
                                  │
     ┌────────────────────────────┼────────────────────────────┐
     │                            │                            │
┌────▼────┐              ┌───────▼──────┐           ┌────────▼────────┐
│Component│              │  @toeverything │           │  @affine/graphql │
│  (UI)   │              │    /infra     │           │   (API types)   │
└─────────┘              └───────────────┘           └─────────────────┘
                                  │
                         ┌─────────▼─────────┐
                         │    BlockSuite     │
                         │   (CRDT/Yjs)      │
                         └─────────┬─────────┘
                                   │
┌──────────────────────────────────┼──────────────────────────────┐
│                           BACKEND                                 │
│        ┌────────────────────────┼────────────────────────┐       │
│   ┌────▼─────┐          ┌──────▼──────┐          ┌──────▼─────┐   │
│   │  REST    │          │  GraphQL    │          │  WebSocket │   │
│   │   API    │          │  (Apollo)   │          │  (Socket.io│   │
│   └─────┬────┘          └──────┬──────┘          └──────┬─────┘   │
│         └───────────────────────┼─────────────────────────┘         │
│                    ┌────────────▼────────────┐                       │
│                    │     NestJS Server       │                       │
│                    │  (Express/Fastify)     │                       │
│                    └────────────┬────────────┘                       │
│         ┌─────────────────────┼─────────────────────┐               │
│    ┌────▼─────┐       ┌──────▼──────┐       ┌─────▼──────┐       │
│    │ PostgreSQL│       │    Redis     │       │   S3/MinIO  │       │
│    │   (DB)   │       │ (Cache/Queue)│       │(File Storage)│       │
│    └──────────┘       └─────────────┘       └────────────┘        │
└───────────────────────────────────────────────────────────────────┘
```

---

## 2. Monorepo Structure

### 2.1 Workspace Organization

The repository is organized as a Yarn Berry workspace with TypeScript project references. It manages a large-scale codebase including frontend applications, a NestJS backend, and several Rust crates integrated via NAPI-RS.

### 2.2 Top-Level Package Organization

```
AFFiNE/
├── packages/
│   ├── frontend/
│   │   ├── apps/
│   │   │   ├── web/           # Web application
│   │   │   ├── electron/       # Desktop (Electron)
│   │   │   ├── ios/           # iOS (Capacitor)
│   │   │   ├── android/       # Android (Capacitor)
│   │   │   ├── mobile/        # Mobile web PWA
│   │   │   └── admin/         # Admin panel
│   │   ├── core/             # Primary business logic
│   │   ├── component/         # Shared UI components
│   │   ├── native/           # Rust modules (NAPI-RS)
│   │   └── mobile-native/     # Mobile native Rust modules
│   ├── backend/
│   │   ├── server/           # NestJS backend
│   │   └── native/           # Backend Rust modules
│   └── common/
│       ├── infra/            # Infrastructure layer (@toeverything/infra)
│       ├── env/              # Feature flags, environment config
│       ├── graphql/          # GraphQL types and queries
│       ├── nbstore/          # Native Block Store (sync engine)
│       └── native/           # Common Rust utilities
├── blocksuite/
│   ├── framework/
│   │   ├── store/           # CRDT store (Yjs)
│   │   └── ui/              # UI components
│   └── affine/              # AFFiNE-specific blocks
├── tools/
│   └── cli/                 # Build tools (@affine-tools/cli)
└── tests/                   # E2E tests
```

### 2.3 Key Package Relationships

| Package | Type | Purpose |
|---------|------|---------|
| `@affine/core` | Library | Primary business logic, modules, services |
| `@affine/component` | Library | Shared UI components |
| `@toeverything/infra` | Library | DI framework, LiveData, services base |
| `@affine/graphql` | Library | GraphQL types, queries, mutations |
| `@blocksuite/affine` | Library | AFFiNE-specific BlockSuite blocks |
| `@affine-tools/cli` | Tool | Build system (wraps Rspack) |

---

## 3. Multi-Platform Architecture

### 3.1 Platform Comparison

AFFiNE implements a "write once, deploy everywhere" strategy where `@affine/core` provides shared business logic consumed by platform-specific application packages.

| Platform | Package | Entry Point | Native Runtime | Build Tool |
|----------|---------|-------------|----------------|------------|
| Web Browser | `@affine/web` | `src/index.tsx` | Browser APIs | `@affine-tools/cli` (Rspack) |
| Desktop | `@affine/electron` | `dist/main.js` | Electron 39 (Node.js) | Electron Forge |
| iOS Native | `@affine/ios` | `src/index.tsx` | WKWebView + Swift | Capacitor CLI |
| Android Native | `@affine/android` | `src/index.tsx` | WebView + Kotlin | Capacitor CLI |
| Mobile Web | `@affine/mobile` | `src/index.tsx` | React PWA | `@affine-tools/cli` |
| Admin Panel | `@affine/admin` | `src/index.tsx` | React SPA | `@affine-tools/cli` |

### 3.2 Platform-Specific Features

**Desktop (Electron):**
- `WindowsManager` for multi-window support
- `electron-updater` for background updates
- Native integrations via `affine_media_capture` Rust module

**Mobile (Capacitor):**
- Shares common mobile UI package `@affine/mobile-shared`
- Uses UniFFI for Rust integration
- Capacitor plugins for native device features

### 3.3 Code Sharing Strategy

```
                    @affine/core (Business Logic)
                           │
    ┌──────────┬───────────┼───────────┬──────────┐
    │          │           │           │          │
┌───▼───┐  ┌──▼───┐  ┌────▼────┐  ┌───▼───┐  ┌───▼───┐
│  Web  │  │Desktop│  │  iOS   │  │Android│  │Mobile │
│(Vite) │  │  EP   │  │(Capac.)│  │(Capac.)│  │  PWA  │
└───────┘  └───────┘  └────────┘  └────────┘  └───────┘
```

---

## 4. Frontend Architecture

### 4.1 Architectural Layers

| Layer | Packages | Responsibility |
|-------|----------|----------------|
| **Platform Applications** | `@affine/web`, `@affine/electron`, `@affine/ios`, `@affine/android`, `@affine/mobile`, `@affine/admin` | Platform-specific entry points and native integrations |
| **Shared Business Logic** | `@affine/core`, `@affine/component` | Feature modules, services, and UI components shared across all platforms |
| **Framework** | `@toeverything/infra`, `@blocksuite/affine` | Service architecture, reactive state, CRDT-based editor |
| **Common Libraries** | `@affine/i18n`, `@affine/graphql`, `@affine/nbstore`, `@affine/track`, `@affine/env` | Cross-cutting concerns and utility libraries |

### 4.2 @affine/core Module Organization

```
packages/frontend/core/src/modules/
├── index.ts                    # Module exports
├── auth/                      # Authentication module
├── workspace/                 # Workspace management
├── doc/                       # Document services
├── docs-search/               # Search functionality
├── editor-setting/            # Editor preferences
├── workbench/                 # Navigation, split-view
├── quicksearch/               # Quick search (Cmd+K)
├── search-menu/               # Search menu
├── ai-button/                 # AI Copilot button
└── permissions/               # Permission management
```

### 4.3 Editor Integration

AFFiNE integrates the **BlockSuite** editor framework, which provides the CRDT-based collaborative editing engine:

- **BlockSuite Components**: Native web components for blocks and widgets
- **Extension System**: Customizing editor behavior through BlockSuite's extension API
- **State Synchronization**: Connecting BlockSuite's Y.js-based store to AFFiNE's workspace sync logic

---

## 5. Backend Architecture

### 5.1 NestJS Application Structure

```
packages/backend/server/src/
├── core/                      # Business logic
│   ├── features/              # Feature management (Pro features)
│   ├── permission/            # Access control (CASL)
│   ├── quota/                 # Storage, member limits enforcement
│   ├── workspaces/            # Workspace operations
│   ├── doc-service/           # Document service
│   ├── doc/                   # Document CRUD, storage
│   ├── sync/                  # Real-time sync gateway
│   └── static-files/          # Static file serving
├── plugins/                   # Optional features
│   ├── payment/               # Stripe, RevenueCat integration
│   ├── copilot/               # AI Copilot
│   └── oauth/                 # OAuth providers
├── models/                    # Prisma entities
│   ├── common/                # Shared models
│   └── workspace-*.ts         # Workspace models
├── base/                      # Shared utilities
│   ├── error/                 # Error definitions
│   └── utils/                 # Helper functions
├── app.module.ts              # Root module
└── main.ts                    # Entry point
```

### 5.2 Key Backend Technologies

| Component | Technology | Purpose |
|-----------|------------|---------|
| Web Framework | NestJS 11 | Server framework |
| API | Apollo GraphQL | Primary API |
| Real-time | Socket.io + Redis | WebSocket communication |
| Database | PostgreSQL | Primary data store |
| ORM | Prisma | Database access |
| Cache/Queue | Redis + BullMQ | Caching and background jobs |
| File Storage | S3/MinIO | Blob storage |

### 5.3 Plugin Architecture

AFFiNE uses a plugin architecture for optional features:

```typescript
// Plugin registration in app.module.ts
plugins: [
  PaymentPlugin,      // Stripe, RevenueCat
  CopilotPlugin,      // AI features
  OAuthPlugin,        // Social login
]
```

---

## 6. State Management and Services

### 6.1 Service-Oriented Architecture

AFFiNE's frontend uses a **service-oriented architecture** with **dependency injection** and **reactive state management**. The architecture is built on three core abstractions from `@toeverything/infra`:

| Abstraction | Description |
|-------------|-------------|
| **Service** | Singleton services providing business logic and state |
| **Entity** | Stateful objects with lifecycle management |
| **LiveData** | Reactive observables for state synchronization |

### 6.2 Framework Scopes

```
Framework Root
    │
    ├── AuthService
    ├── ServerService
    └── FeatureFlagService
    │
    ▼
WorkspaceScope
    │
    ├── WorkspaceService
    ├── DocsService
    └── WorkbenchService
    │
    ▼
DocScope
    │
    ├── DocService
    └── EditorService
```

### 6.3 LiveData Reactive State

`LiveData` is the reactive state management primitive providing observable values.

| Type | Description | Example |
|------|-------------|---------|
| **Basic LiveData** | Mutable observable value | `new LiveData(0)` |
| **Computed LiveData** | Derived from other LiveData | `LiveData.computed(get => ...)` |
| **From External** | Syncs with external stores | `LiveData.from(rxjsObservable, default)` |

### 6.4 Core Services

| Service | Entity | Purpose |
|---------|--------|---------|
| **WorkbenchService** | `Workbench` | Multi-view navigation, tabs, split-screen |
| **DocsService** | `Doc` | Document lifecycle management |
| **DocsSearchService** | - | Local and remote document indexing |
| **WorkspaceService** | `Workspace` | Workspace operations |

### 6.5 State Persistence Mechanisms

| Mechanism | Technology | Purpose |
|-----------|------------|---------|
| **GlobalState** | In-memory + localStorage | UI state (sidebar width, etc.) |
| **Jotai Atoms** | Jotai | App-wide settings, preferences |
| **nbstore** | IndexedDB/SQLite | Document CRDT data and blobs |
| **IndexerSync** | nbstore | Document search indexing |

---

## 7. Feature Flag System

### 7.1 Build-Time vs Runtime Flags

AFFiNE implements a dual-layer feature flag system:

| Type | Implementation | Use Case |
|------|---------------|----------|
| **Build-time** | `AFFiNE_FLAG_*` environment variables | Pro/Free tier separation, dead code elimination |
| **Runtime** | `@toeverything/infra` `FeatureFlagService` | A/B testing, gradual rollout, server-side control |

### 7.2 Feature Flag Architecture

```
┌─────────────────────────────────────────────────┐
│              Environment Variables                │
│   AFFiNE_FLAG_PRO=true/false                     │
│   AFFINE_FLAG_AI=true/false                      │
└─────────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────┐
│              @affine/env Package                 │
│   - buildFlags: Build-time constants             │
│   - runtimeConfig: Server-provided flags         │
└─────────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────┐
│         FeatureFlagService (Runtime)             │
│   - isEnabled(flag: string): boolean             │
│   - getFlag<T>(flag: string): T                  │
└─────────────────────────────────────────────────┘
```

### 7.3 Self-Hosted Pro Unlock

A key feature: **self-hosted instances automatically unlock Pro features**:

```typescript
// When AFFiNE runs in self-hosted mode, all Pro features are enabled
const isPro = isSelfHosted() || isCloudProUser();
```

---

## 8. GraphQL API and Schema

### 8.1 Schema Overview

The GraphQL schema is defined in `packages/backend/server/src/schema.gql` (~2,400 lines) and auto-generated by NestJS GraphQL decorators.

### 8.2 Custom Scalars

| Scalar | TypeScript Type | Purpose |
|--------|----------------|---------|
| `DateTime` | `string` | ISO 8601 timestamp (UTC) |
| `JSON` | `Record<string, string>` | Generic JSON values |
| `JSONObject` | `any` | Typed JSON objects |
| `SafeInt` | `number` | Safe integers (ECMAScript spec) |
| `Upload` | `File` | File upload handling |

### 8.3 Core Type System

**User Types:**
- `UserType`: Primary user object
- `PublicUserType`: Safe for cross-user visibility (no email)
- `LimitedUserType`: For unauthenticated contexts
- `InviteUserType`: For workspace invitation flows

**Workspace Types:**
- `WorkspaceType`: Workspace with metadata
- `DocType`: Document/page with permissions
- `DocMode`: `page` (linear) or `edgeless` (canvas)

**AI Types:**
- `Copilot`: Root type for AI features
- `CopilotHistories`: Chat session history
- `ChatMessage`: Individual chat entry
- `StreamObjectType`: Streaming response metadata

### 8.4 Root Query Operations

| Field | Return Type | Description |
|-------|-------------|-------------|
| `currentUser` | `UserType` | Authenticated user profile |
| `workspace` | `WorkspaceType` | Workspace by ID |
| `serverConfig` | `ServerConfigType` | System-wide configuration |
| `adminDashboard` | `AdminDashboard` | Admin metrics |
| `calendarAccounts` | `[CalendarAccountObjectType!]` | Connected calendars |

### 8.5 Client-Side Integration

```typescript
// Generated types from GraphQL schema
// packages/common/graphql/src/schema.ts
import { Copilot, ChatMessage } from '@affine/graphql';

// Query composition with fragments
const GET_CHAT = gql`
  ${fragments.CopilotChatHistory}
  query GetChat($sessionId: string!) {
    copilotChat(sessionId: $sessionId) {
      ...CopilotChatHistory
    }
  }
`;
```

---

## 9. Real-time Synchronization

### 9.1 Architecture Overview

The synchronization gateway is built on Socket.io and integrates with the Y-OCTO CRDT library, Redis pub/sub, and PostgreSQL for persistence.

### 9.2 System Components

| Class | Purpose | Key Methods |
|-------|---------|-------------|
| `SpaceSyncGateway` | WebSocket gateway | `handleConnection()`, `onJoinSpace()`, `onReceiveDocUpdate()` |
| `PgWorkspaceDocStorageAdapter` | PostgreSQL storage | `pushDocUpdates()`, `getDocUpdates()`, `deleteDoc()` |
| `DatabaseDocReader` | Document read operations | `getDoc()`, `getDocDiff()`, `getDocMarkdown()` |
| `DocSyncPeer` | Client-side sync | `sync()`, `pullAndPush()`, `docDiffUpdate()` |

### 9.3 Protocol and Room Structure

| Room Type | Purpose |
|-----------|---------|
| `sync` | Standard shared room for space membership |
| `sync-025` | Legacy 0.25 doc sync protocol |
| `sync-026` | Current doc sync protocol (v0.26+) |
| `${docId}:awareness` | Document cursor/presence |

### 9.4 Socket Events

| Event | Direction | Purpose | Payload |
|-------|-----------|---------|---------|
| `space:join` | Client → Server | Join workspace | `JoinSpaceMessage` |
| `space:push-doc-update` | Client → Server | Push change | `PushDocUpdateMessage` |
| `space:load-doc` | Client → Server | Request doc state | `LoadDocMessage` |
| `space:update-awareness` | Client → Server | Cursor/presence | `UpdateAwarenessMessage` |
| `space:broadcast-doc-updates` | Server → Client | Broadcast updates | `BroadcastDocUpdatesMessage` |

### 9.5 Document Load Flow

```
1. Client sends space:load-doc with stateVector
         │
         ▼
2. Gateway calls docReader.getDocDiff(spaceId, docId, stateVector)
         │
         ▼
3. DatabaseDocReader retrieves doc and calculates diff
         │
         ▼
4. Updates squashed into snapshot if needed
         │
         ▼
5. Server returns missing update binary + new state vector
```

---

## 10. Document Processing and Y-OCTO CRDT

### 10.1 Y-OCTO Overview

**y-octo** is a high-performance, Yjs-compatible CRDT engine written in Rust. It handles:

- Binary update encoding/decoding
- State vector-based differential synchronization
- Complex data structures (Text, Array, Map)

### 10.2 Document Processing Pipeline

```
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│   CRDT Binary   │ ───► │   y-octo Doc    │ ───► │    Markdown     │
│   (Yjs update)  │      │   (Rust)        │      │   (Text)        │
└─────────────────┘      └─────────────────┘      └─────────────────┘
```

### 10.3 Key CRDT Types

| Entity | Role | Location |
|--------|------|----------|
| `Doc` | Root container | `packages/backend/native/src/doc.rs` |
| `DocLoader` | High-level abstraction | `packages/backend/native/src/doc_loader.rs` |
| `Update` | Network transmission unit | `packages/common/y-octo/core/src/doc/document.rs` |
| `StateVector` | Sync state tracking | `client_id -> clock` map |

### 10.4 Native Memory Management

The native server module uses `mimalloc` for high-performance memory allocation, critical for frequent small allocations during CRDT operations.

```toml
# packages/backend/native/Cargo.toml
[dependencies]
mimalloc = "0.1"
y-octo = { path = "../../common/y-octo/core", features = ["large_refs"] }
```

---

## 11. AI Copilot System

### 11.1 Architecture Overview

The Copilot system is a multi-provider AI assistant integrated into both frontend and backend.

```
┌─────────────────────────────────────────────────────────────────┐
│                     AI Copilot System                             │
├─────────────────────────────────────────────────────────────────┤
│  Frontend                    │  Backend                          │
│  ┌───────────┐               │  ┌───────────────┐                │
│  │ Chat UI   │               │  │ Provider      │                │
│  │ Interface │               │  │ Factory       │                │
│  └─────┬─────┘               │  └───┬───────────┘                │
│        │                      │      │                           │
│        ▼                      │  ┌───▼───┐ ┌─────┐ ┌─────────┐  │
│  ┌───────────┐                │  │OpenAI │ │Claude│ │ Gemini  │  │
│  │ Chat      │                │  └───────┘ └─────┘ └─────────┘  │
│  │ Service   │                │                                   │
│  └─────┬─────┘               │  ┌───────────────┐                │
│        │                      │  │ MCP Controller │                │
│        ▼                      │  │ (Model Context │                │
│  ┌───────────┐               │  │  Protocol)     │                │
│  │ Session   │               │  └───────────────┘                │
│  │ Manager   │               │                                   │
└──┴─────┬─────┴───────────────┴───────────────────────────────────┘
          │
          ▼
   ┌───────────────┐
   │ RAG Pipeline  │
   │ (Retrieval +  │
   │ Generation)   │
   └───────────────┘
```

### 11.2 Provider System

```typescript
// packages/backend/server/src/plugins/copilot/providers/provider.ts
interface CopilotProvider {
  name: string;
  chat(model: string, messages: ChatMessage[]): Promise<ChatResponse>;
  embed(text: string): Promise<number[]>;
}
```

**Supported Providers:**
- OpenAI (GPT-4, GPT-4o)
- Anthropic (Claude 3.5 Sonnet)
- Google Gemini

### 11.3 Context and Embedding Management

The system handles document embeddings and semantic search for RAG workflows:

- Document chunking and embedding generation
- Vector storage for similarity search
- Context injection into LLM prompts

---

## 12. Payment and Subscription System

### 12.1 Multi-Provider Architecture

AFFiNE supports multiple payment providers for cross-platform billing:

| Provider | Platform | Payment Type |
|----------|----------|--------------|
| **Stripe** | Web | Credit card, PayPal |
| **RevenueCat** | Mobile (iOS/Android) | In-App Purchases |
| **Self-hosted License** | Self-hosted | Team licenses |

### 12.2 Subscription Managers

```typescript
// Base class with provider-agnostic logic
class SubscriptionManager { ... }

// Platform-specific implementations
class UserSubscriptionManager extends SubscriptionManager { ... }      // Pro, AI plans
class WorkspaceSubscriptionManager extends SubscriptionManager { ... } // Team plans
class SelfhostTeamSubscriptionManager extends SubscriptionManager { ... } // Self-hosted
```

### 12.3 Quota and Entitlement Enforcement

| Quota Type | Source | Enforcement |
|------------|--------|-------------|
| **Storage** | `UserQuota` / `WorkspaceQuota` | Checked during blob uploads |
| **Member Seats** | `WorkspaceSubscription` | Validated on invite |
| **AI Copilot** | `UserFeature` | Limits on chat actions |

### 12.4 Self-Hosted Pro Unlock

A key business logic: **self-hosted workspaces automatically unlock Pro features**:

```typescript
// packages/backend/server/src/plugins/payment/manager/selfhost.ts
class SelfhostTeamSubscriptionManager {
  isEligibleForPro(): boolean {
    return this.isSelfHosted();
  }
}
```

### 12.5 Background Reconciliation

Nightly BullMQ jobs ensure data consistency:

- Expired subscription cleanup
- RevenueCat state sync
- Stripe reconciliation

---

## 13. Authentication and Access Control

### 13.1 Authentication Flow

```
┌─────────┐     ┌─────────────┐     ┌──────────────┐
│  User   │────►│   OAuth     │────►│  JWT Token   │
│ Browser │◄────│  Providers  │◄────│  Generation  │
└─────────┘     └─────────────┘     └──────────────┘
```

### 13.2 Supported Providers

- Email/Password
- Google OAuth
- GitHub OAuth
- Apple Sign-In

### 13.3 Permission Model

| Model | Purpose |
|-------|---------|
| `WorkspacePermission` | Workspace-level access (owner, admin, member) |
| `DocPermission` | Document-level access (read, write, manage) |
| `FeaturePermission` | Pro feature access |

### 13.4 CASL Integration

Access control uses CASL for declarative permission checking:

```typescript
// packages/backend/server/src/core/permission/
const permission = await this.caslAbilityFor(userId, workspaceId);
if (permission.cannot('manage', 'Document')) {
  throw new ForbiddenException();
}
```

---

## 14. Native Module Integration (Rust/NAPI)

### 14.1 FFI Bridge Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Rust NAPI Bridge                              │
├─────────────────────────────────────────────────────────────────┤
│  TypeScript/Javascript                                           │
│  ┌─────────────────────────────────────────────────────────┐     │
│  │  import { Doc, parseYDocToMarkdown } from '@affine/native'; │  │
│  └─────────────────────────────────────────────────────────┘     │
│                              │                                    │
│                    NAPI-RS Bindings                              │
│                              │                                    │
├──────────────────────────────▼──────────────────────────────────┤
│  Rust (Native)                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────────┐    │
│  │    y-octo    │  │ doc_parser  │  │  mimalloc (memory)  │    │
│  │   (CRDT)     │  │  (Markdown) │  │                     │    │
│  └──────────────┘  └──────────────┘  └─────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

### 14.2 Native Packages

| Package | Platform | Purpose |
|---------|----------|---------|
| `packages/backend/native` | Node.js | Backend CRDT operations |
| `packages/frontend/native` | Browser/Electron | Client-side operations |
| `packages/common/native` | Shared | Common utilities |
| `packages/frontend/mobile-native` | Mobile | Capacitor integration |

### 14.3 Key Rust Modules

| Module | Function |
|--------|----------|
| `doc.rs` | CRDT document operations |
| `doc_loader.rs` | Document loading/management |
| `doc_parser/mod.rs` | Markdown conversion |
| `safe_fetch.rs` | Secure HTTP requests |
| `hashcash.rs` | Spam protection |

---

## 15. Build System and Tools

### 15.1 Build Tooling Stack

| Tool | Purpose |
|------|---------|
| **Yarn Berry** | Package management (workspace) |
| **@affine-tools/cli** | Custom CLI wrapping Rspack |
| **Rspack** | High-performance bundler |
| **SWC** | TypeScript/JavaScript transpilation |
| **Electron Forge** | Desktop app packaging |
| **Capacitor CLI** | Mobile app packaging |

### 15.2 Build Commands

| Command | Purpose |
|---------|---------|
| `yarn dev` | Start development server |
| `yarn build` | Production build |
| `yarn typecheck` | TypeScript static analysis |
| `yarn test` | Run tests |
| `yarn lint` | Code linting |

### 15.3 Build Optimization

- **Dead code elimination** for Pro/Free tier separation
- **Code splitting** for lazy-loaded routes
- **Tree shaking** for minimal bundle sizes

---

## 16. Deployment Architecture

### 16.1 Container Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      Kubernetes Cluster                           │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │   Web UI   │  │   API Pod   │  │  WebSocket  │              │
│  │   (Nginx)  │  │  (NestJS)  │  │  (Socket.io)│              │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘              │
│         │                 │                 │                     │
│  ┌──────┴─────────────────┴─────────────────┴──────┐            │
│  │              Load Balancer                       │            │
│  └──────────────────────┬──────────────────────────┘            │
│                         │                                       │
│  ┌──────────────────────┼──────────────────────────┐            │
│  │           Internal Network                      │            │
│  └──────────────────────┼──────────────────────────┘            │
│         │                 │                 │                     │
│  ┌──────▼──────┐  ┌──────▼──────┐  ┌──────▼──────┐              │
│  │ PostgreSQL  │  │   Redis     │  │     S3      │              │
│  │  (RDS)      │  │ (ElastiCache│  │  (Storage)  │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
└─────────────────────────────────────────────────────────────────┘
```

### 16.2 Helm Chart Structure

```
.github/helm/affine/
├── Chart.yaml
├── values.yaml
└── templates/
    ├── deployment.yaml
    ├── service.yaml
    ├── ingress.yaml
    ├── configmap.yaml
    └── secret.yaml
```

### 16.3 Environment Configuration

```yaml
# Key environment variables
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
S3_BUCKET=affine-storage
S3_ENDPOINT=https://s3.amazonaws.com
STRIPE_API_KEY=sk_...
REVENUECAT_API_KEY=...
```

---

## 17. Technology Stack Summary

### 17.1 Frontend Stack

| Category | Technology |
|----------|------------|
| Framework | React 19 |
| State Management | Jotai, LiveData (custom) |
| Reactive | RxJS |
| Styling | Vanilla Extract (CSS-in-JS) |
| Editor | BlockSuite (WebComponents) |
| Bundler | Rspack (via @affine-tools/cli) |
| Mobile | Capacitor |
| Desktop | Electron 39 |

### 17.2 Backend Stack

| Category | Technology |
|----------|------------|
| Framework | NestJS 11 |
| API | Apollo GraphQL |
| Real-time | Socket.io + Redis adapter |
| Database | PostgreSQL |
| ORM | Prisma |
| Cache | Redis |
| Queue | BullMQ |
| Storage | S3/MinIO |

### 17.3 Native Stack

| Category | Technology |
|----------|------------|
| Language | Rust |
| JS Bridge | NAPI-RS |
| Mobile Bridge | UniFFI |
| Memory | mimalloc |
| CRDT | y-octo (Yjs-compatible) |

### 17.4 Infrastructure Stack

| Category | Technology |
|----------|------------|
| Container | Docker |
| Orchestration | Kubernetes |
| CI/CD | GitHub Actions |
| CDN | Cloudflare |
| Monitoring | Custom telemetry |

---

## Key Takeaways for Self-Hosted Chat Application

Based on AFFiNE's architecture, here are the key patterns to consider:

### Patterns to Adopt

1. **Service-Oriented Architecture with DI** - Clean separation of concerns
2. **Feature Flags for Tier Management** - Essential for Pro/Free separation
3. **CRDT for Real-time Collaboration** - y-octo/Yjs for conflict-free editing
4. **Multi-Provider Payment Abstraction** - Stripe + RevenueCat pattern
5. **Rust NAPI for Performance** - Critical for CPU-intensive operations
6. **Offline-First Sync** - nbstore pattern for local + cloud sync

### Patterns to Simplify

1. **Monorepo Structure** - Start with 2-3 packages, scale up as needed
2. **Feature Flag Complexity** - Start with simple boolean flags
3. **Multi-Platform** - Focus on web first, add desktop/mobile later
4. **AI Integration** - Add after core features are stable

---

## References

- **GitHub Repository**: https://github.com/toeverything/AFFiNE
- **DeepWiki Documentation**: https://deepwiki.com/toeverything/AFFiNE
- **Official Docs**: https://docs.affine.pro
- **Last Indexed Commit**: e9ef3c50 (May 16, 2026)
