# Documentation

Hose est une application française qui déroule la **méthode des cinq pourquoi**
sur une problématique mal formulée, et s’arrête sur trois verbes d’action puis
un engagement daté.

Cette documentation explique comment elle est construite et, surtout, pourquoi
elle est construite comme ça. C’est une réécriture d’un projet de 2024, donc
beaucoup de choix se lisent comme des réponses à un problème concret rencontré
dans la version précédente. Ces comparaisons sont dans le texte quand elles
éclairent la décision, pas pour l’anecdote.

## Ordre de lecture

Si tu découvres le projet, lis dans cet ordre. Chaque page tient debout seule,
mais elles se répondent.

| Page                               | Ce que tu y trouves                                                                        |
| ---------------------------------- | ------------------------------------------------------------------------------------------ |
| [Architecture](architecture.md)    | Le trajet d’une requête, les frontières client / serveur, la machine à états d’un parcours |
| [Modèle de données](data-model.md) | Les tables, les contraintes, et ce que chacune interdit                                    |
| [Moteur d’IA](ai-engine.md)        | Les prompts, les schémas, les reprises sur erreur, les modes de défaillance                |
| [Sécurité](security.md)            | Sessions, propriété des données, secrets, validation des entrées                           |
| [Tableau](board.md)                | Le canevas éditable, ce qui est persisté et ce qui ne l’est pas                            |
| [Tests](testing.md)                | Ce qui est couvert, ce qui ne l’est pas, et pourquoi                                       |
| [Décisions](decisions/)            | Les arbitrages structurants, un fichier par décision                                       |

## Repères rapides

|           |                                                                   |
| --------- | ----------------------------------------------------------------- |
| Framework | TanStack Start (React 19, Vite, TypeScript)                       |
| Base      | Postgres 17, accédée via Drizzle                                  |
| Auth      | Better Auth, e-mail et mot de passe                               |
| Modèle    | `claude-opus-5`, en sorties structurées                           |
| Canevas   | React Flow                                                        |
| Tests     | Vitest (37 tests unitaires), Playwright (8 tests de bout en bout) |

## Ce que le projet n’est pas

À dire une fois plutôt que de laisser le lecteur le déduire :

- **Pas déployé.** Aucune instance publique. Le dépôt tourne en local, contre
  un Postgres local et ta propre clé Claude.
- **Pas multi-utilisateur au sens produit.** Les comptes existent et sont
  isolés les uns des autres, mais rien n’est partagé ni collaboratif.
- **Pas internationalisé.** L’interface est en français uniquement, y compris
  les prompts. Voir [la décision correspondante](decisions/0014-interface-francaise.md).

## Faire tourner le projet

Les commandes sont dans le [README racine](../README.md). Le minimum :

```bash
npm install
cp .env.example .env.local
npm run db:up
npm run db:migrate
npm run db:seed
npm run dev
```

Sans clé Claude, l’app démarre quand même et annonce que l’assistant est
désactivé. Tout le reste (comptes, historique, tableau) fonctionne.
