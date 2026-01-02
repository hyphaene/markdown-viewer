# Markdown Viewer — Roadmap

> **Vision** : LLM Companion — l'outil pour visualiser, naviguer et reviewer les fichiers générés/modifiés par Claude Code en temps réel.

## Phases

### ✅ Phase 1 : MVP (actuel)

Défini dans [SPEC.md](./SPEC.md)

- Scan & indexation de dossiers configurables (.md/.mdx)
- Recherche fuzzy filename + full-text
- Rendu Markdown GFM avec syntax highlighting
- Actions : ouvrir VS Code, copier path, révéler Finder
- Interface : sidebar (sources + résultats) + zone principale (rendu)
- Mode read-only, thème dark/light

---

### 🎯 Phase 2 : Images + Frontmatter

| Feature                      | Détail                                                  |
| ---------------------------- | ------------------------------------------------------- |
| **Preview images locales**   | PNG, JPG, SVG référencées dans le Markdown              |
| **Frontmatter YAML**         | Parser et afficher les métadonnées (date, tags, auteur) |
| **Filtrage par frontmatter** | Rechercher par tags, trier par date dans la sidebar     |
| **Index persistant**         | Migration MiniSearch → SQLite pour perf instantanée     |

---

### 🎯 Phase 3 : Édition Split View

| Feature               | Détail                                                      |
| --------------------- | ----------------------------------------------------------- |
| **Split view**        | Markdown raw à gauche, preview à droite                     |
| **Sauvegarde Ctrl+S** | Sauvegarde manuelle uniquement (pas d'autosave)             |
| **Système d'onglets** | Onglets de fichiers ouverts (comme VS Code)                 |
| **Workspaces**        | Onglets de contextes/projets avec leurs sources configurées |
| **File tree**         | Arborescence navigable (pas juste liste de résultats)       |

---

### 🎯 Phase 4 : Git Diff

| Feature               | Détail                                                        |
| --------------------- | ------------------------------------------------------------- |
| **Diff visuel**       | Afficher les changements vs commits précédents (style GitHub) |
| **Auto-detect git**   | Détection automatique du .git parent                          |
| **Toggle diff/rendu** | Basculer entre vue diff et rendu final                        |
| **Worktrees support** | Watch de plusieurs worktrees git en parallèle                 |

---

### 🔮 Future (à investiguer)

| Feature                | Détail                                                      |
| ---------------------- | ----------------------------------------------------------- |
| **Mermaid/diagrammes** | À évaluer : intégration native ou migration vers Hexalidraw |

---

## Contraintes techniques

| Contrainte                | Décision                                      |
| ------------------------- | --------------------------------------------- |
| **Performance recherche** | Doit être instantanée ("snap") → SQLite local |
| **Fiabilité watch mode**  | Ne doit PAS rater de changements              |
| **Indicateur synchro**    | Afficher "dernière synchro il y a X sec"      |
| **Force refresh**         | Bouton manuel en backup                       |
| **Sauvegarde édition**    | Ctrl+S explicite, pas d'autosave              |

---

## Critères de succès

- [ ] La recherche est instantanée
- [ ] Le watch mode ne rate aucun changement
- [ ] L'UI est visuellement agréable
- [ ] Basculer rapidement entre fichiers/contextes ouverts

---

## Questions ouvertes

- **Mermaid** : Intégrer nativement ou déléguer à Hexalidraw ?
- **Index SQLite** : Rust-side (sqlx) ou JS-side (sql.js) ?
- **Worktrees UI** : Comment représenter plusieurs contextes git ?
