# Moteur d’IA

Modèle : `claude-opus-5`. Le raisonnement est actif par défaut ; la profondeur
se règle par `effort` plutôt que par un budget de jetons.

Trois fichiers, séparés par ce qu’ils savent :

| Fichier                   | Rôle                 | Connaît                                       |
| ------------------------- | -------------------- | --------------------------------------------- |
| `src/lib/ai/five-whys.ts` | le moteur            | rien de l’app : reçoit un client en paramètre |
| `src/lib/ai/prompts.ts`   | le texte français    | les types, pas la base                        |
| `src/lib/ai/schemas.ts`   | les formes de sortie | zod uniquement                                |
| `src/lib/ai/server.ts`    | les points d’entrée  | session, base, environnement                  |

Le moteur ne construit jamais son propre client : `askFirstQuestion(client,
…)`. C’est ce qui rend les tests possibles sans clé et sans réseau, et ce qui
empêche `env` de remonter dans le bundle par un import transitif.

## Les sorties sont imposées, pas demandées

Chaque appel passe par `client.messages.parse()` avec
`output_config: { format: zodOutputFormat(schema) }`. La forme est garantie par
l’API. Il n’y a donc, nulle part dans l’app :

- aucune expression régulière sur la réponse du modèle,
- aucun `JSON.parse`,
- aucune étape de réparation.

La version 2024 demandait du JSON en prose, extrayait le premier `{...}` avec
une regex et le parsait pendant le rendu. Toute déviation produisait un écran
blanc.

## Ce que les sorties structurées ne garantissent pas

**Le nombre d’éléments d’un tableau n’est pas imposé.** `.length(3)` est retiré
du schéma que l’API applique et ne survit que comme description. Le modèle peut
donc rendre deux verbes là où trois étaient demandés.

Le moteur en tient compte de deux façons :

1. Les nombres sont écrits en toutes lettres dans le prompt
   (« exactement 3, ni plus ni moins »).
2. Une erreur de validation est réessayée, en disant au modèle ce qui n’allait
   pas.

```
tentative 1  ──► échec de validation
                 │  on extrait la première ligne lisible du dump du SDK
                 ▼
tentative 2  ──► « Ta réponse précédente était invalide : <raison>.
                    Respecte exactement le format demandé. »
                 │
                 ▼
tentative 3  ──► toujours invalide → MalformedError
```

Trois tentatives (`PARSE_ATTEMPTS`). Renvoyer la requête identique en espérant
un autre résultat ne serait pas une reprise sur erreur, seulement une attente.

## Ce qui reste vérifié côté applicatif

Le schéma fixe la forme. Il ne fixe pas les règles sémantiques :

- **Distinction des verbes.** `synthesize()` construit un `Set` et lève
  `MalformedError` si les trois verbes ne sont pas distincts. Sans cette
  vérification, la violation apparaîtrait plus tard sous la forme d’une erreur
  de clé primaire au milieu de la transaction d’enregistrement.
- **Normalisation.** Les verbes sont coupés et passés en minuscules avant
  écriture, pour que `action_verbs.label` reste une clé de dédoublonnage
  fiable.

## Les six appels

| Fonction           | Quand                                  | Effort   | Sortie                   |
| ------------------ | -------------------------------------- | -------- | ------------------------ |
| `askFirstQuestion` | premier pourquoi, les deux modes       | `low`    | une question             |
| `askNextQuestion`  | pourquoi suivant, mode assisté         | `low`    | une question             |
| `runFullChain`     | mode auto                              | `medium` | 5 échanges               |
| `continueChain`    | après correction d’une réponse devinée | `medium` | les échanges restants    |
| `synthesize`       | fin de chaîne, les deux modes          | `medium` | 3 verbes et leurs pistes |
| `commitToAction`   | après le choix d’un verbe              | `medium` | une action et un moment  |

Les deux modes convergent sur `synthesize`. C’est délibéré : en 2024, les deux
branches avaient divergé au point qu’une appelait une méthode du SDK et l’autre
une méthode qui n’existait plus.

`continueChain` construit son schéma à la demande avec `chainSchemaOf(n)`, parce
que le modèle doit rendre exactement ce qui manque, ni plus ni moins.

## Les prompts

Une voix commune (`VOICE`) : tutoiement, une phrase par question, aucune
solution tant que les cinq pourquoi ne sont pas terminés. Chaque appel y ajoute
sa consigne propre.

Ils sont nettement plus courts que ceux de 2024, parce que tout ce que ces
derniers dépensaient à décrire le format (« réponds uniquement avec cet objet
JSON, sans oublier aucune virgule ») est désormais porté par le schéma. Ils ont
aussi perdu les fautes de frappe qu’ils traînaient depuis deux ans (_dervas_,
_l’orde_, _acitons_, _réppnses_), que le modèle lisait comme des instructions.

### « Autre question »

Quand quelqu’un rejette une question, la question rejetée est renvoyée au
modèle avec une consigne explicite : change d’angle, ne reformule pas. Sans ça,
une reformulation de la même question revient presque à chaque fois.

### Le cadre personnel

`synthesize` et `commitToAction` reçoivent le cadre, lu **sur le serveur depuis
la ligne du compte connecté**. Le client ne le transmet jamais, donc il ne peut
être ni falsifié ni utilisé pour une injection de prompt.

La consigne est nuancée volontairement : éviter ce qui épuise _quand une autre
voie existe_, et si la meilleure action passe malgré tout par là, la proposer
en la rendant aussi petite que possible. Un assistant qui évite systématiquement
ce qui déplaît finit par ne proposer que du confortable.

Le tableau de 2024 collectait exactement ces trois champs et ne les envoyait
jamais nulle part : les verbes étaient proposés pour personne en particulier.

### L’étape d’engagement

C’est là que se joue l’écart entre comprendre et changer. Le prompt exige une
action faisable en moins d’une heure, seul, sans autorisation ni réunion, et
dont on puisse dire sans discuter si elle a été faite. Pas de « commencer à »,
pas de « réfléchir à ». « Documenter » n’est pas une action, c’est une
catégorie.

## Modes de défaillance

| Erreur                       | Cause                  | Ce que voit la personne                          |
| ---------------------------- | ---------------------- | ------------------------------------------------ |
| `RefusedError`               | le modèle refuse       | le message porté par l’erreur, déjà en français  |
| `MalformedError`             | 3 tentatives invalides | message générique de réessai                     |
| message de `availability.ts` | pas de clé utilisable  | « l’assistant est désactivé sur cette instance » |
| autre                        | réseau, quota, panne   | message générique, détail en console             |

Un refus renvoie **HTTP 200** avec un corps vide ou partiel. `stop_reason` est
donc testé avant toute lecture du contenu, sinon l’indexation lèverait une
erreur qui masquerait la vraie cause. Un refus n’est jamais réessayé : il ne
changera pas.

Seul le message survit à la frontière des fonctions serveur, pas la classe ni
son nom. C’est pourquoi le client reconnaît le message « assistant désactivé »
par égalité exacte, via `isDisabledMessage`, plutôt qu’en cherchant une
sous-chaîne.

## Tests

16 tests couvrent le moteur contre un client factice : la suite ne dépense
jamais de jetons et n’attend jamais la latence du modèle. Détail dans
[Tests](testing.md).
