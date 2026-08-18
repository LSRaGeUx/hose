# Tableau

Le tableau est un canevas React Flow. Il ne restitue pas le parcours, il le
rend manipulable : c’est l’endroit où la personne planifie ce qu’elle va faire.

## Il ne s’ouvre jamais vide

`seedGraph()` (`src/lib/board-layout.ts`) construit le graphe de départ à partir
du parcours enregistré :

```
      ┌─────────────────┐
      │  Ce qui me      │        ┌──────────────┐
      │  donne de       │        │ problématique│
      │  l’énergie      │        └──────┬───────┘
      ├─────────────────┤               │
      │  Ce qui         │        ┌──────▼───────┐
      │  m’épuise       │        │ pourquoi 1   │
      ├─────────────────┤        ├──────────────┤
      │  Ce vers quoi   │        │ pourquoi 2   │
      │  je vais        │        ├──────────────┤
      └─────────────────┘        │  … jusqu’à 5 │
        cadre personnel          └──────┬───────┘
                                        │
                      ┌─────────┬───────┴───────┐
                      ▼         ▼               ▼
                   verbe 1   verbe 2         verbe 3
                      └─────────┼───────────────┘
                                ▼
                        action engagée  ☐
```

Trois choses valent d’être notées dans cette disposition :

- **Les verbes pendent du dernier pourquoi, pas de la problématique.** C’est la
  forme de la méthode : ils répondent à la problématique telle qu’elle apparaît
  après la descente, pas telle qu’elle était formulée au départ. Un test le
  vérifie explicitement.
- **La colonne de cadre est dessinée à côté du raisonnement.** Ce sont les
  contraintes contre lesquelles les verbes ont été jugés, donc elles sont
  visibles plutôt que rangées dans la page de compte. Aucun nœud n’est créé
  pour un champ non rempli.
- **L’engagement est déjà là, comme une action à cocher.** C’est tout l’objet
  de l’étape d’engagement : le plan démarre là, et pas sur une case vide.

## Ce que la personne peut faire

| Action                         | Comment                                |
| ------------------------------ | -------------------------------------- |
| Déplacer, relier               | glisser, tirer d’une poignée à l’autre |
| Ajouter une note ou une action | boutons `+ NOTE` et `+ ACTION`         |
| Modifier un texte              | double-clic                            |
| Cocher une action              | case du nœud                           |
| Supprimer                      | touche `Suppr`                         |
| Annuler                        | bouton `Annuler`, 50 pas d’historique  |

## Trois problèmes qui méritaient une solution

### Ouvrir le tableau écrivait en base

React Flow émet des changements de type `dimensions` au premier mesurage des
nœuds, et `select` à chaque clic. Compter ces événements comme des
modifications suffisait à déclencher une écriture à chaque simple ouverture de
la page.

`isRealEdit()` tranche : un déplacement ne compte qu’une fois le glisser
terminé (`dragging === false`), et sinon seuls `add`, `remove` et `replace`
comptent.

### Les nœuds ajoutés atterrissaient sur l’arbre

Les nœuds créés depuis la barre d’outils apparaissaient au centre du viewport,
c’est-à-dire très exactement là où se trouve l’arbre déjà disposé.

`freeSpot()` part à droite de tout ce qui existe et descend jusqu’à trouver une
place libre.

### L’état d’affichage n’a rien à faire en base

React Flow attache aux nœuds des tailles mesurées, des drapeaux de glissement
et de sélection. `toGraph()` les retire avant l’enregistrement : les écrire
dans le `jsonb` reviendrait à stocker de l’état d’affichage comme si c’était du
contenu, et il devient faux dès que le viewport change. Les positions sont
arrondies à l’entier au passage.

## Enregistrement

Autosauvegarde différée de 1200 ms après la dernière modification réelle.
L’état est visible dans l’interface (`pending`, `saved`, `error`).

Le graphe est écrit dans `boards.data` (`jsonb`) par un `INSERT … ON CONFLICT
DO UPDATE` sur `problem_id`, donc au plus une ligne par problématique.

`jsonb` plutôt que des tables de nœuds et d’arêtes : le graphe est toujours lu
et écrit en entier, il n’est jamais interrogé par morceaux, et aucune requête
ne cherche « tous les nœuds de type action ». Normaliser aurait ajouté deux
tables et des jointures pour aucune requête réelle. Si un jour une vue
transversale des actions engagées apparaît, ce choix est à revoir, et c’est le
signal qui devra le déclencher.

## Validation

`saveBoard` valide chaque nœud et chaque arête avec zod, et vérifie la
propriété de la problématique avec le même motif que partout ailleurs : la
condition est dans la requête, donc un tableau appartenant à quelqu’un d’autre
n’est pas trouvé.

Le type persisté (`src/lib/board-types.ts`) est volontairement étroit : `id`,
`type`, `position`, et un `data` limité à `label`, `detail` et `done`. Ce qui
n’y est pas ne peut pas arriver en base.
