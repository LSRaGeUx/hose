# 0009. Un parcours s’écrit en une transaction, à la fin

Statut : acceptée

## Contexte

En 2024, un parcours était enregistré à travers plusieurs points d’entrée sans
rapport et sans transaction. Une interruption au milieu laissait une
problématique sans échanges, ou des échanges sans verbes. Les solutions
produites n’étaient de toute façon jamais écrites.

## Décision

Un parcours vit dans l’état React jusqu’à sa complétion, puis `saveRun` écrit
la problématique, ses cinq échanges, ses trois verbes avec leurs pistes et un
tableau vide, en une seule transaction.

## Conséquences

- Une conversation abandonnée au troisième pourquoi ne laisse rien derrière
  elle.
- **C’est ce qui autorise le schéma à être strict.** Les contraintes peuvent
  exiger cinq échanges et trois verbes précisément parce qu’aucun parcours
  partiel n’est jamais écrit. Les deux décisions se tiennent l’une l’autre.
- Contrepartie assumée : fermer l’onglet au milieu perd le travail en cours. Un
  brouillon persistant serait une fonctionnalité à part entière, avec sa propre
  gestion d’expiration et de reprise.
- Les verbes sont insérés avec `ON CONFLICT DO UPDATE` sur le label, puisque le
  vocabulaire est partagé entre les comptes.
