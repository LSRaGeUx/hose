# Modèle de données

Postgres 17, accédé via Drizzle. Le schéma est dans `src/db/schema.ts`, les
migrations dans `drizzle/`, générées par drizzle-kit et jamais écrites à la
main.

## Vue d’ensemble

```
user  (Better Auth)
 │
 ├─1:1─ profiles          le cadre personnel
 │
 └─1:n─ problems          une problématique, et ce qui a été engagé dessus
          │
          ├─1:n─ exchanges       les cinq pourquoi, positions 1 à 5
          │
          ├─1:n─ problem_verbs   les trois verbes, positions 1 à 3
          │         │
          │         └─n:1─ action_verbs   vocabulaire partagé entre comptes
          │
          └─1:1─ boards          le graphe React Flow, en jsonb
```

`user`, `session`, `account` et `verification` appartiennent à Better Auth.
Elles sont générées dans `src/db/auth-schema.ts` et réexportées depuis
`schema.ts`, pour que l’adaptateur et drizzle-kit voient un seul module.

## Les tables

### `profiles`

Le cadre personnel : ce qui donne de l’énergie, ce qui épuise, ce vers quoi la
personne va. Trois colonnes texte nullables, clé primaire `user_id`.

Table séparée plutôt que colonnes sur `user`, parce que `user` appartient à
Better Auth et est régénérée. Ces trois champs alimentent la synthèse : voir
[Moteur d’IA](ai-engine.md#le-cadre-personnel).

### `problems`

Une problématique. `title`, plus `committed_verb` et `commitment`, tous deux
nullables : quelqu’un peut terminer les cinq pourquoi sans s’engager sur quoi
que ce soit.

Index sur `(user_id, created_at)`, qui est exactement l’ordre dans lequel
`/mon-compte` les lit.

La propriété est une clé étrangère simple. La version 2024 modélisait ça en
n:n via une table `usersproblem`, puis dédupliquait les nouvelles
problématiques contre les anciennes avec une distance de Levenshtein de 3, ce
qui fusionnait silencieusement des problématiques sans rapport. Fusionner est
maintenant un choix explicite dans l’interface, pas un effet de bord d’une
heuristique de chaîne de caractères.

### `exchanges`

Un « pourquoi ? » et sa réponse. Cinq par problématique.

```sql
unique (problem_id, position)
check  (position between 1 and 5)
```

`position` est explicite, donc l’ordre ne dépend jamais de l’ordre d’insertion
ni d’un `SELECT` qui reviendrait trié par chance. C’était le fonctionnement de
l’ancienne table `dialog`.

### `action_verbs`

Le vocabulaire des verbes, partagé entre tous les comptes, `label` unique et
stocké déjà normalisé (coupé, en minuscules). Partagé parce que le graphique de
fréquence n’a de sens que si « définir » écrit par deux personnes est le même
verbe.

### `problem_verbs`

Les trois verbes d’une problématique, chacun avec sa piste d’action.

```sql
primary key (problem_id, action_verb_id)
unique      (problem_id, position)
check       (position between 1 and 3)
solution    text not null
```

`solution` est `NOT NULL` volontairement. En 2024, l’IA produisait
`Solution1..3` à chaque exécution et le backend n’en persistait aucune : la
moitié de ce que le produit fabriquait était jetée. La contrainte rend cet
oubli impossible à réintroduire.

La clé primaire composite interdit aussi le même verbe deux fois sur une même
problématique. C’est pour ça que `synthesize()` vérifie la distinction des
verbes côté applicatif avant l’écriture : le schéma fixe le nombre, pas
l’unicité sémantique, et une violation ici ferait échouer toute la transaction.

### `boards`

Le graphe React Flow, en `jsonb`, une ligne au plus par problématique. Détail
dans [Tableau](board.md).

## Ce que les contraintes interdisent, concrètement

| Tentative                         | Résultat                        |
| --------------------------------- | ------------------------------- |
| Un sixième pourquoi               | `check` sur `position`          |
| Deux pourquoi en position 3       | `unique (problem_id, position)` |
| Un verbe sans piste d’action      | `not null` sur `solution`       |
| Le même verbe deux fois           | clé primaire composite          |
| Supprimer un verbe encore utilisé | `on delete restrict`            |
| Un parcours à moitié écrit        | la transaction de `saveRun`     |

Supprimer un compte efface en cascade ses profils, problématiques, échanges,
verbes de problématique et tableaux. `action_verbs` survit : c’est du
vocabulaire partagé, pas une donnée personnelle. D’où le `restrict` sur la
référence, qui empêche de retirer un verbe encore rattaché à une problématique.

## Migrations

```bash
npm run db:generate   # à partir de schema.ts
npm run db:migrate    # applique
npm run db:studio     # inspecte
```

`db:push` existe pour l’itération locale mais ne doit pas servir à faire
évoluer une base qui contient quelque chose : il calcule un diff au lieu de
rejouer un historique.
