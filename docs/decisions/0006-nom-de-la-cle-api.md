# 0006. `HOSE_ANTHROPIC_API_KEY` plutôt que `ANTHROPIC_API_KEY`

Statut : acceptée

## Contexte

Le plugin Vite de Netlify s’approprie `ANTHROPIC_API_KEY` pour sa propre AI
Gateway : au chargement, il écrit dans `process.env` un JWT court, lié au site,
en écrasant ce qui avait été défini. Envoyé à `api.anthropic.com`, ce jeton
échoue en 401 pour une raison que rien dans la réponse n’explique.

Le même plugin injecte aussi `ANTHROPIC_BASE_URL`, dont le SDK hérite
silencieusement, ce qui redirige les appels vers une passerelle qui rejette
notre propre clé.

## Décision

La variable porte un nom que rien d’autre ne revendique, et le `baseURL` du
client est épinglé sur `https://api.anthropic.com`.

## Conséquences

- Le nom s’écarte de la convention du SDK, ce qui surprend au premier abord.
  C’est documenté dans les deux README, à l’endroit où la question se pose.
- La forme du credential est vérifiée au point d’utilisation et non dans le
  contrat d’environnement : un mauvais credential doit casser le moteur des
  cinq pourquoi, jamais la connexion ni la page d’accueil.
- Le cas « jeton Netlify » est nommé explicitement dans l’erreur destinée au
  développeur, parce que sans ça le diagnostic prend un après-midi.
