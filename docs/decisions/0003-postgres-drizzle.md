# 0003. Postgres et Drizzle plutôt que MySQL et du SQL écrit à la main

Statut : acceptée

## Contexte

La version 2024 utilisait MySQL avec des requêtes construites à la main et sans
transaction. Un parcours s’écrivait à travers plusieurs points d’entrée sans
rapport entre eux.

## Décision

Postgres 17, en local via podman, accédé par Drizzle. Migrations générées par
drizzle-kit et jamais écrites à la main.

## Conséquences

- `jsonb` disponible pour le graphe du tableau, ce qui évite deux tables et des
  jointures pour un objet toujours lu et écrit en entier. Voir
  [Tableau](../board.md).
- Contraintes `check`, index partiels et clés composites exprimables
  directement dans le schéma TypeScript.
- Les transactions rendent [0009](0009-transaction-unique.md) possible.
- Le schéma TypeScript est la source de vérité, donc les types de requête sont
  déduits et non déclarés.
- podman plutôt que Docker parce que rien ici n’exige un démon privilégié. Le
  fichier compose reste utilisable avec Docker moyennant un ajustement.
