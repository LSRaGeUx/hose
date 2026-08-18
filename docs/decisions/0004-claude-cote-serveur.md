# 0004. Claude côté serveur plutôt qu’un modèle dans le navigateur

Statut : acceptée

## Contexte

La version 2024 construisait un client Mistral dans le bundle React, avec la
clé inlinée. N’importe qui pouvait la lire dans le source de la page.

## Décision

`claude-opus-5`, appelé exclusivement depuis des fonctions serveur. Le client
Anthropic est construit en un seul endroit, `src/lib/ai/client.ts`.

## Conséquences

- La clé ne quitte jamais le serveur.
- Les prompts non plus, ce qui n’est pas un secret mais reste la personnalité
  du produit.
- Un point unique de construction du client signifie que passer par une
  passerelle serait une modification d’un fichier, pas de chaque appel.
- Le `baseURL` est épinglé explicitement plutôt qu’hérité, sans quoi le SDK
  reprend `ANTHROPIC_BASE_URL` de l’environnement. Voir
  [0006](0006-nom-de-la-cle-api.md).
- Chaque appel coûte de l’argent et le trajet est plus long qu’un appel
  navigateur direct. C’est le prix d’une clé qui ne fuit pas.
