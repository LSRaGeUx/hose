import { VERB_COUNT, WHY_COUNT } from './schemas.ts'

import type { Exchange } from './schemas.ts'
import type { PersonalFrame } from './frame.ts'

/**
 * The person the advice is for, when they have told us.
 *
 * The 2024 app collected exactly this on its board and never fed it to the
 * model, so the three verbs were proposed for nobody in particular. An action
 * someone will not do is not a solution, however sound the reasoning behind it.
 */
function framing(frame: PersonalFrame): string {
  const lines = [
    frame.energises && `Ce qui lui donne de l'énergie : ${frame.energises}`,
    frame.drains && `Ce qui l'épuise : ${frame.drains}`,
    frame.aspiration && `Ce vers quoi elle veut aller : ${frame.aspiration}`,
  ].filter(Boolean)

  if (lines.length === 0) return ''

  return `

La personne t'a dit ceci sur elle :
${lines.join('\n')}

Tiens-en compte : propose des actions qu'elle fera vraiment. Évite ce qui
l'épuise quand une autre voie existe, appuie-toi sur ce qui lui donne de
l'énergie, et oriente vers ce qu'elle vise. Si la meilleure action passe
malgré tout par ce qu'elle n'aime pas, propose-la et rends-la aussi petite
que possible.`
}

/**
 * Prompts for the five-whys engine.
 *
 * Notably shorter than the 2024 versions, because the output shape is enforced
 * by the schema rather than described in prose. Everything those prompts spent
 * on "réponds uniquement avec cet objet JSON, sans oublier aucune virgule" is
 * gone, along with the typos they carried for two years (dervas, l'orde,
 * ciblé, acitons, réppnses), which the model was reading as instructions.
 */

const VOICE = `Tu es un assistant français expert en clarification d'idées.
Tu accompagnes une personne avec la méthode des cinq pourquoi : en remontant
la chaîne des causes, on passe d'une problématique floue à quelque chose
d'actionnable.

Ton :
- Tutoie la personne.
- Reste concret et direct, jamais plus d'une phrase par question.
- Ne juge pas, ne propose pas de solution tant que les cinq pourquoi ne sont
  pas terminés.`

export function firstQuestionPrompt(title: string) {
  return {
    system: `${VOICE}

Tu poses la première question. Elle doit interroger la cause immédiate de la
problématique, pas ses conséquences.`,
    user: `Ma problématique : ${title}`,
  }
}

export function nextQuestionPrompt(title: string, exchanges: Array<Exchange>) {
  const transcript = exchanges
    .filter((e) => e.answer !== null)
    .map((e, i) => `${i + 1}. ${e.question}\n   → ${e.answer}`)
    .join('\n')

  const asked = exchanges.filter((e) => e.answer !== null).length

  return {
    system: `${VOICE}

Tu poses la question ${asked + 1} sur ${WHY_COUNT}. Appuie-toi sur la dernière
réponse pour creuser d'un cran. Ne repose pas une question déjà posée et ne
reformule pas la précédente.`,
    user: `Ma problématique : ${title}

Échanges jusqu'ici :
${transcript}`,
  }
}

export function fullChainPrompt(title: string) {
  return {
    system: `${VOICE}

Déroule seule la totalité des ${WHY_COUNT} pourquoi : pour chaque question,
écris aussi la réponse que la personne donnerait, à la première personne.
Chaque réponse doit amener la question suivante, et la chaîne doit descendre
vers une cause de fond plutôt que tourner en rond.`,
    user: `Ma problématique : ${title}`,
  }
}

export function synthesisPrompt(
  title: string,
  exchanges: Array<Exchange>,
  frame: PersonalFrame,
) {
  const transcript = exchanges
    .map(
      (e, i) => `${i + 1}. ${e.question}\n   → ${e.answer ?? '(sans réponse)'}`,
    )
    .join('\n')

  return {
    system: `${VOICE}

Les cinq pourquoi sont terminés. Dégage ${VERB_COUNT} verbes d'action qui
ciblent la problématique telle qu'elle apparaît maintenant, et non telle
qu'elle était formulée au départ.

Pour chaque verbe, propose l'action la plus utile à mettre en place :
concrète, réalisable par la personne elle-même, dix mots maximum.
Les ${VERB_COUNT} verbes doivent être distincts et couvrir des angles
différents.${framing(frame)}`,
    user: `Ma problématique : ${title}

Les cinq pourquoi :
${transcript}`,
  }
}
