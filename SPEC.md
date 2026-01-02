# Markdown Viewer - Spécification Produit v1

## Vision

Application desktop (Tauri + React) permettant de naviguer, rechercher et visualiser tous les fichiers Markdown présents sur la machine. Mode lecture seule avec intégration VS Code pour l'édition.

> **Pourquoi Tauri ?** App légère (~5MB vs ~150MB Electron), utilise la WebView native macOS, accès filesystem natif via Rust.

## Utilisateur cible

Développeur / power user avec beaucoup de documentation Markdown dispersée (notes, README, docs projets, wikis locaux).

---

## Fonctionnalités Core (MVP)

### 1. Scan & Indexation

| Aspect | Décision |
|--------|----------|
| **Sources** | Dossiers configurables (ex: `~/Code`, `~/Notes`, `~/Hexactitude`) |
| **Exclusions** | `node_modules`, `.git`, `vendor`, dossiers cachés (configurable) |
| **Format** | Fichiers `.md` et `.mdx` |
| **Indexation** | Au démarrage + watch mode pour changements en temps réel |

### 2. Recherche

| Type | Description |
|------|-------------|
| **Par nom de fichier** | Fuzzy search sur le path/nom |
| **Par contenu** | Full-text search dans le contenu Markdown |
| **Filtres** | Par dossier source, date de modification |

### 3. Visualisation

- Rendu Markdown fidèle (GFM - GitHub Flavored Markdown)
- Support syntax highlighting pour blocs de code
- Support des liens relatifs entre fichiers MD
- Table des matières auto-générée (headings)
- Mode sombre / clair

### 4. Actions

| Action | Comportement |
|--------|--------------|
| **Ouvrir dans VS Code** | `code <filepath>` - ouvre le fichier à la ligne si possible |
| **Copier le chemin** | Copie le path absolu dans le clipboard |
| **Révéler dans Finder** | Ouvre le dossier parent dans Finder |

---

## Interface Utilisateur

```
┌─────────────────────────────────────────────────────────────────┐
│  [🔍 Search...]                                    [⚙️] [🌙]    │
├──────────────────────┬──────────────────────────────────────────┤
│                      │                                          │
│  📁 Sources          │   # Document Title                       │
│  ├── ~/Code          │                                          │
│  ├── ~/Notes         │   Content rendered here...               │
│  └── ~/Hexactitude   │                                          │
│                      │   ```typescript                          │
│  📄 Results (42)     │   const x = 1;                           │
│  ├── README.md       │   ```                                    │
│  ├── SPEC.md         │                                          │
│  └── notes/todo.md   │   [Open in VS Code]  [Copy Path]         │
│                      │                                          │
└──────────────────────┴──────────────────────────────────────────┘
```

### Layout

- **Sidebar gauche** : Arborescence des sources + résultats de recherche
- **Zone principale** : Rendu du Markdown sélectionné
- **Header** : Barre de recherche globale + settings

### Raccourcis clavier

| Raccourci | Action |
|-----------|--------|
| `Cmd+K` | Focus sur la recherche |
| `Cmd+O` | Ouvrir dans VS Code |
| `Cmd+Shift+C` | Copier le chemin |
| `Cmd+,` | Ouvrir les settings |
| `↑/↓` | Naviguer dans les résultats |
| `Enter` | Sélectionner le fichier |

---

## Architecture Technique

### Stack

| Composant | Technologie |
|-----------|-------------|
| **Desktop** | Tauri v2 (Rust backend) |
| **UI** | React + TypeScript |
| **Styling** | Tailwind CSS |
| **State** | Zustand |
| **Markdown** | react-markdown + remark-gfm |
| **Syntax highlight** | Shiki |
| **Search index** | MiniSearch (client-side) |
| **File watching** | notify (crate Rust, via Tauri) |

### Structure projet

```
src/                      # Frontend React
├── App.tsx
├── components/
│   ├── Sidebar/
│   ├── MarkdownViewer/
│   ├── SearchBar/
│   └── Settings/
├── hooks/
├── stores/
├── lib/
│   └── tauri.ts          # Wrappers pour les commandes Tauri
└── types/
    └── index.ts

src-tauri/                # Backend Rust
├── Cargo.toml
├── tauri.conf.json
└── src/
    ├── main.rs
    ├── commands/         # Commandes exposées au frontend
    │   ├── mod.rs
    │   ├── files.rs      # Scan, read, watch
    │   └── actions.rs    # Open VS Code, reveal in Finder
    └── state.rs          # État partagé (index, settings)
```

### Communication Tauri (Commands + Events)

```rust
// Commands (Frontend → Backend, async)
#[tauri::command]
async fn scan_directories(paths: Vec<String>) -> Result<Vec<FileEntry>, String>
async fn read_file(path: String) -> Result<String, String>
async fn open_in_vscode(path: String) -> Result<(), String>
async fn reveal_in_finder(path: String) -> Result<(), String>
async fn get_settings() -> Result<Settings, String>
async fn save_settings(settings: Settings) -> Result<(), String>

// Events (Backend → Frontend, via emit)
"file:added"
"file:changed"
"file:removed"
```

---

## Configuration persistée

```json
{
  "sources": [
    { "path": "~/Code", "enabled": true },
    { "path": "~/Notes", "enabled": true }
  ],
  "exclusions": ["node_modules", ".git", "vendor", "dist", "build"],
  "theme": "system",
  "lastOpenedFile": "/path/to/file.md"
}
```

Stockage : `tauri-plugin-store` (fichier JSON dans app data, ex: `~/Library/Application Support/com.markdown-viewer/settings.json`)

---

## Hors scope (v1)

- ❌ Édition de fichiers dans l'app
- ❌ Création de nouveaux fichiers
- ❌ Sync cloud
- ❌ Tags / métadonnées custom
- ❌ Export PDF / HTML
- ❌ Preview d'images locales (à évaluer)
- ❌ Support fichiers autres que Markdown

---

## Décisions techniques

1. **Index** : Rebuild au démarrage (pas de persistance pour l'instant). Watch mode (notify) pour add/update/delete en temps réel → important pour le use case "LLM édite en local, UI reflète en direct".

2. **Limite de fichiers** : Pas de limite dure. Virtualisation de la liste (react-virtual) pour la perf.

3. **Liens relatifs** : Navigation interne si le fichier cible est dans les sources indexées.

---

## Prochaines étapes

1. ✅ Valider cette spec
2. Scaffold le projet Tauri + React (`npm create tauri-app`)
3. Implémenter le scan de fichiers (commandes Rust)
4. Créer l'UI de base (sidebar + viewer)
5. Ajouter la recherche
6. Polish (raccourcis, thèmes, settings)
7. Build & packaging (`.app` macOS)
