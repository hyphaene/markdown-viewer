# Split View - Spécification

Fonctionnalité permettant d'afficher plusieurs fichiers Markdown côte à côte pour exploiter l'espace des grands écrans.

## Objectif

Permettre la navigation multi-fichiers, la comparaison de documents, et la consultation de référence simultanée sans alt-tab constant.

---

## Architecture des panels

| Aspect               | Décision                                          |
| -------------------- | ------------------------------------------------- |
| **Orientation MVP**  | Horizontale uniquement (gauche/droite)            |
| **Nombre de panels** | Illimité                                          |
| **Orientation v2**   | Ajout du vertical (haut/bas) pour grille complète |

---

## Layout visuel

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  [🔍 Search...]                                              [⚙️] [🌙]      │
├────────────┬────────────────────────┬─┬────────────────────────┬─┬─────────┤
│            │ [file1.md] [file2.md] x│ │ [readme.md] x          │ │[spec]x  │
│  📁 Tree   ├────────────────────────┤ ├────────────────────────┤ ├─────────┤
│            │                        │◂│                        │◂│         │
│  📄 Files  │   # Document 1         │▸│   # Document 2         │▸│ # Doc 3 │
│            │                        │ │                        │ │         │
│            │   Content...           │ │   Content...           │ │ ...     │
│            │                        │ │                        │ │         │
└────────────┴────────────────────────┴─┴────────────────────────┴─┴─────────┘
                                      ↑                          ↑
                              Séparateurs resizables (drag)
```

---

## Tabs par panel

Chaque panel possède sa propre barre d'onglets :

| Comportement                  | Description                                                |
| ----------------------------- | ---------------------------------------------------------- |
| **Tabs indépendants**         | Chaque panel gère ses propres fichiers ouverts             |
| **Même fichier multi-panels** | Autorisé - instances indépendantes (scroll séparé)         |
| **Fermeture dernier tab**     | Le panel se ferme, espace redistribué aux panels adjacents |

---

## Interactions

### Ouverture de fichiers

| Action          | Comportement                                        |
| --------------- | --------------------------------------------------- |
| **Clic simple** | Ouvre dans le panel actif (qui a le focus)          |
| **Cmd+Clic**    | Ouvre dans un nouveau panel (split automatique)     |
| **Drag & drop** | Glisser un fichier vers un bord pour créer un split |

### Raccourcis clavier

| Raccourci     | Action                                           |
| ------------- | ------------------------------------------------ |
| `Cmd+\`       | Créer un nouveau split (duplique le panel actif) |
| `Cmd+W`       | Fermer l'onglet actif                            |
| `Cmd+Shift+W` | Fermer le panel actif                            |
| `Cmd+Alt+←`   | Focus sur le panel de gauche                     |
| `Cmd+Alt+→`   | Focus sur le panel de droite                     |
| `` Cmd+` ``   | Cycler entre les panels                          |

---

## Resize des panels

| Aspect              | Décision                                          |
| ------------------- | ------------------------------------------------- |
| **Mode**            | Libre (au pixel près, pas de snap)                |
| **Taille minimale** | À définir - empêche les panels trop petits        |
| **Interaction**     | Drag des séparateurs verticaux                    |
| **Feedback visuel** | Curseur resize + highlight du séparateur au hover |

---

## Indication de focus

| Aspect         | Décision                                  |
| -------------- | ----------------------------------------- |
| **Style**      | Subtil - bordure légère ou ombre discrète |
| **Visibilité** | Toujours clair quel panel est actif       |
| **Changement** | Clic dans un panel ou navigation clavier  |

---

## Animations

| Transition       | Comportement                     |
| ---------------- | -------------------------------- |
| **Split/Close**  | Animation subtile (200-300ms)    |
| **Resize**       | Temps réel, pas d'animation      |
| **Focus change** | Transition de la bordure (150ms) |

---

## Persistance

| Aspect           | Décision                                  |
| ---------------- | ----------------------------------------- |
| **Layout**       | Sauvegardé à chaque changement            |
| **Contenu**      | Fichiers ouverts par panel + onglet actif |
| **Tailles**      | Proportions des panels                    |
| **Restauration** | Complète au redémarrage de l'app          |

Stockage dans le même fichier settings via `tauri-plugin-store`.

---

## Structure de données (Zustand)

```typescript
interface Panel {
  id: string;
  tabs: Tab[];
  activeTabId: string;
  width: number; // pourcentage ou pixels
}

interface Tab {
  id: string;
  filePath: string;
  scrollPosition?: number;
}

interface SplitViewState {
  panels: Panel[];
  activePanelId: string;

  // Actions
  splitPanel: (panelId: string) => void;
  closePanel: (panelId: string) => void;
  openFileInPanel: (panelId: string, filePath: string) => void;
  openFileInNewPanel: (filePath: string) => void;
  setActivePanel: (panelId: string) => void;
  resizePanel: (panelId: string, width: number) => void;
  closeTab: (panelId: string, tabId: string) => void;
}
```

---

## Contraintes UX

| Anti-pattern     | Solution                                             |
| ---------------- | ---------------------------------------------------- |
| Menus compliqués | Actions directes (raccourcis, drag & drop, bouton X) |
| Resize difficile | Séparateurs larges (8px), zone de hit étendue        |
| Perte de focus   | Indication visuelle claire du panel actif            |
| Bugs de layout   | Tests rigoureux, pas de chevauchement                |

---

## Critères de succès

- [ ] Ouvrir 3+ fichiers côte à côte sans friction
- [ ] Retrouver sa disposition exacte après redémarrage
- [ ] Resize intuitif et sans bugs visuels
- [ ] Navigation clavier fluide entre panels
- [ ] Pas de dégradation de performance avec plusieurs panels

---

## Hors scope (MVP)

- ❌ Splits verticaux (haut/bas) → v2
- ❌ Grille complète H+V → v2
- ❌ Synchronisation de scroll entre panels
- ❌ Diff view intégré (comparaison visuelle)
- ❌ Groupes de panels (comme VSCode)
