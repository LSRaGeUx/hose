# 0005. Sorties structurées plutôt que du JSON demandé en prose

Statut : acceptée

## Contexte

Les prompts de 2024 demandaient du JSON en français, extrayaient le premier
`{...}` de la réponse par expression régulière, et le parsaient pendant le
rendu. Toute déviation du modèle produisait un écran blanc.

## Décision

`client.messages.parse()` avec `output_config.format` construit depuis un
schéma zod. La forme est imposée par l’API.

## Conséquences

- Plus aucune expression régulière, aucun `JSON.parse`, aucune étape de
  réparation dans l’application.
- Les prompts raccourcissent nettement : tout ce qu’ils dépensaient à décrire
  le format est porté par le schéma.
- **Limite importante, découverte à l’usage : le nombre d’éléments d’un tableau
  n’est pas imposé.** `.length(3)` est retiré du schéma appliqué et ne survit
  que comme description. Le moteur compense en écrivant les nombres dans le
  prompt et en réessayant avec l’erreur de validation réinjectée.
- Les règles sémantiques restent à la charge de l’applicatif : la distinction
  des trois verbes est vérifiée par un `Set` avant écriture.
