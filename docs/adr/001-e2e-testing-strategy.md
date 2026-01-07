# ADR-001: Stratégie de tests E2E pour application Tauri

**Statut**: Candidat (en exploration)
**Date**: 2025-01-07
**Décideurs**: @hyphaene

## Contexte

Cette application est construite avec Tauri v2 (Rust backend + React frontend). Nous cherchons une solution de tests E2E qui permette de valider les flux utilisateur complets, idéalement avec Playwright (expertise existante).

### Contraintes spécifiques Tauri

| Aspect           | Réalité                                                                                                                   |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------- |
| WebView natif    | Pas de Chromium bundlé → chaque OS utilise son WebView (WebKit sur macOS, Edge/Chromium sur Windows, WebKitGTK sur Linux) |
| IPC Bridge       | Communication frontend ↔ Rust via `invoke()`                                                                              |
| macOS            | **Pas de WebDriver disponible** pour WKWebView                                                                            |
| Playwright natif | Non supporté officiellement par Tauri                                                                                     |

## Options évaluées

### Option 1: WebDriver + WebdriverIO/Selenium

**Description**: Approche officiellement recommandée par Tauri via `tauri-driver`.

**Setup**:

```bash
cargo install tauri-driver --locked
```

**Avantages**:

- ✅ Documentation officielle Tauri
- ✅ Test de l'app réelle (WebView + Rust backend + IPC)
- ✅ CI/CD ready (GitHub Actions examples)
- ✅ Supporte Windows et Linux

**Inconvénients**:

- ❌ **macOS non supporté** (pas de WKWebView driver)
- ❌ Syntaxe WebdriverIO/Selenium moins ergonomique que Playwright
- ❌ Setup complexe (coordination tauri-driver + app + tests)
- ❌ Pas d'expertise existante

**Sources**:

- [WebDriver | Tauri v2](https://v2.tauri.app/develop/tests/webdriver/)
- [WebdriverIO Example | Tauri](https://v2.tauri.app/develop/tests/webdriver/example/webdriverio/)

---

### Option 2: Playwright + Mock IPC (frontend only)

**Description**: Tester le frontend React via Playwright en mockant les appels IPC vers Rust.

**Setup**:

```typescript
// playwright.config.ts
export default defineConfig({
  webServer: {
    command: "npm run dev",
    url: "http://localhost:1420",
    env: { VITE_PLAYWRIGHT: "true" },
  },
});
```

```html
<!-- index.html -->
<script type="module">
  if (import.meta.env.VITE_PLAYWRIGHT) {
    const { mockIPC } = await import("@tauri-apps/api/mocks");
    window.mockIPC = mockIPC;
  }
</script>
```

```typescript
// test.spec.ts
test("greet user", async ({ page }) => {
  await page.evaluate(() => {
    window.mockIPC((cmd, args) => {
      if (cmd === "greet") return `Hello, ${args.name}!`;
    });
  });
  // ... test UI
});
```

**Avantages**:

- ✅ Playwright natif (syntaxe familière, DevTools, traces)
- ✅ Cross-platform (macOS inclus)
- ✅ Rapide (pas de build Tauri nécessaire)
- ✅ Expertise existante réutilisable
- ✅ Parfait pour tester la logique UI/UX

**Inconvénients**:

- ❌ **Pas de test du backend Rust**
- ❌ **Pas de test de l'IPC réel**
- ❌ Mocks à maintenir synchronisés avec le backend
- ❌ Ne teste pas les spécificités WebView (rendering differences)

**Sources**:

- [Mock Tauri APIs | Tauri](https://tauri.app/develop/tests/mocking/)
- [Discussion #10123](https://github.com/tauri-apps/tauri/discussions/10123)

---

### Option 3: TestDriver.ai + Playwright SDK

**Description**: Extension Playwright utilisant l'IA vision pour des tests "selectorless".

**Setup**:

```bash
npm install @testdriver.ai/playwright
```

```typescript
import { test, ai } from "@testdriver.ai/playwright";

test("greet flow", async ({ page }) => {
  await test.agent(`
    Enter the name 'Tauri'
    Click the 'Greet' button
    Verify the greeting message appears
  `);
});
```

**Avantages**:

- ✅ Tests en langage naturel
- ✅ Resilient aux changements de sélecteurs
- ✅ Peut tester l'app Tauri compilée

**Inconvénients**:

- ❌ Dépendance à un service externe (AI)
- ❌ Coût potentiel
- ❌ Moins de contrôle fin
- ❌ Debugging complexe
- ❌ Latence des assertions AI

**Sources**:

- [TestDriver - Tauri Apps](https://docs.testdriver.ai/v6/apps/tauri-apps)

---

### Option 4: Tests séparés (Frontend + Backend)

**Description**: Séparer les responsabilités de test.

| Couche         | Outil                         | Scope                         |
| -------------- | ----------------------------- | ----------------------------- |
| Frontend React | Playwright + mocks            | UI/UX, composants, navigation |
| Backend Rust   | `cargo test`                  | Commands, logique métier      |
| Intégration    | Tests manuels ou WebDriver CI | Flux critiques uniquement     |

**Avantages**:

- ✅ Chaque couche testée avec l'outil optimal
- ✅ Tests rapides et ciblés
- ✅ Playwright sur macOS possible
- ✅ Coverage complète via composition

**Inconvénients**:

- ❌ Pas de test E2E "vrai" en local sur macOS
- ❌ Gap potentiel entre mocks et réalité
- ❌ Plus de configuration à maintenir

---

### Option 5: Electron-like approach (non applicable)

Playwright supporte nativement Electron car celui-ci bundle Chromium. Cette approche n'est **pas transposable à Tauri** qui utilise le WebView natif de l'OS.

**Sources**:

- [Electron vs Tauri Comparison](https://www.codecentric.de/wissens-hub/blog/electron-tauri-building-desktop-apps-web-technologies)

---

## Matrice de comparaison

| Critère              | WebDriver | Playwright+Mock | TestDriver | Séparé     |
| -------------------- | --------- | --------------- | ---------- | ---------- |
| macOS support        | ❌        | ✅              | ✅         | ✅         |
| Test backend Rust    | ✅        | ❌              | ⚠️         | ✅ (cargo) |
| Test IPC réel        | ✅        | ❌              | ⚠️         | ❌         |
| Expertise Playwright | ❌        | ✅              | ✅         | ✅         |
| Setup complexity     | 🔴 High   | 🟢 Low          | 🟡 Medium  | 🟡 Medium  |
| CI ready             | ✅        | ✅              | ⚠️         | ✅         |
| Maintenance mocks    | N/A       | 🔴 High         | N/A        | 🟡 Medium  |
| Cost                 | Free      | Free            | Paid?      | Free       |

## Recommandation préliminaire

Pour ce projet (markdown-viewer), la logique métier est principalement côté frontend (parsing markdown, UI, navigation). Le backend Rust gère essentiellement le filesystem.

**Approche suggérée: Option 4 (Hybride) avec focus Playwright**

```
┌─────────────────────────────────────────────────────┐
│                    Test Strategy                     │
├─────────────────────────────────────────────────────┤
│  Frontend (80% des tests)                           │
│  └─ Playwright + @tauri-apps/api/mocks              │
│     └─ UI components, navigation, markdown render   │
├─────────────────────────────────────────────────────┤
│  Backend (15% des tests)                            │
│  └─ cargo test                                      │
│     └─ File operations, Tauri commands              │
├─────────────────────────────────────────────────────┤
│  E2E Full Stack (5% - CI only, Linux/Windows)       │
│  └─ WebdriverIO + tauri-driver                      │
│     └─ Critical paths: open file, save, etc.        │
└─────────────────────────────────────────────────────┘
```

## Points à explorer

- [ ] Évaluer `@tauri-apps/api/mocks` avec notre stack actuelle
- [ ] Prototyper un test Playwright basique sur un composant
- [ ] Mesurer le gap mocks vs réalité pour nos use cases
- [ ] Évaluer si WebDriver CI (Linux) est acceptable pour les smoke tests
- [ ] Investiguer si TestDriver.ai vaut le coût pour ce projet

## Décision

**En attente** - Exploration nécessaire avant décision finale.

## Références

- [Tests | Tauri v2](https://v2.tauri.app/develop/tests/)
- [WebDriver | Tauri v2](https://v2.tauri.app/develop/tests/webdriver/)
- [Mock Tauri APIs | Tauri](https://tauri.app/develop/tests/mocking/)
- [Discussion: E2E testing Tauri apps](https://github.com/tauri-apps/tauri/discussions/10123)
- [Discussion: Testing Tauri desktop apps](https://github.com/tauri-apps/tauri/discussions/3768)
- [TestDriver - Tauri Apps](https://docs.testdriver.ai/v6/apps/tauri-apps)
