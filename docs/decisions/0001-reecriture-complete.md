# 0001. Réécrire plutôt que moderniser

Statut : acceptée

## Contexte

Le projet d’origine (2024) est une SPA React avec un backend Express et MySQL.
Les problèmes n’étaient pas des retards de version : la session était décidée
dans le navigateur, la clé du modèle était inlinée dans le bundle, les
solutions produites par l’IA n’étaient jamais persistées, les problématiques
étaient fusionnées par distance de Levenshtein, et un mot de passe d’application
Gmail se trouvait dans l’historique git.

Une modernisation incrémentale aurait conservé ces structures et se serait
battue avec elles à chaque étape.

## Décision

Réécriture complète, dépôt neuf, l’ancien archivé. Rien n’est repris sauf
l’idée : la méthode des cinq pourquoi, les trois verbes d’action, le tableau.

## Conséquences

- Aucune migration de données. Il n’y avait pas de données à migrer.
- Le nouveau code peut être strict là où l’ancien était permissif, notamment
  sur les contraintes de schéma.
- Les commentaires du code citent souvent la version 2024. C’est délibéré :
  une contrainte a plus de valeur quand on sait ce qu’elle empêche de
  reproduire.
- Le coût est réel : tout est réécrit, y compris ce qui fonctionnait.
