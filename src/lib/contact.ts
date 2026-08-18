import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

import { env } from '#/env'

/**
 * Contact form delivery.
 *
 * The 2024 version hardcoded a Gmail address and its app password directly in
 * Backend/server.js, which is how that password ended up in git history. The
 * credential is configuration here, and the form degrades honestly when it is
 * absent rather than reporting success for a message nobody received.
 */
export const sendContactMessage = createServerFn({ method: 'POST' })
  .validator(
    z.object({
      name: z.string().trim().min(1).max(120),
      email: z.string().trim().email().max(200),
      message: z.string().trim().min(10).max(4000),
    }),
  )
  .handler(async ({ data }): Promise<{ sent: boolean; reason?: string }> => {
    const { RESEND_API_KEY, CONTACT_FROM, CONTACT_TO } = env
    if (!RESEND_API_KEY || !CONTACT_FROM || !CONTACT_TO) {
      return { sent: false, reason: 'unconfigured' }
    }

    const { Resend } = await import('resend')
    const resend = new Resend(RESEND_API_KEY)

    const result = await resend.emails.send({
      from: CONTACT_FROM,
      to: CONTACT_TO,
      // The sender is untrusted input, so it goes in reply-to rather than from.
      replyTo: data.email,
      subject: `Hose — message de ${data.name}`,
      text: `${data.name} <${data.email}>\n\n${data.message}`,
    })

    if (result.error) return { sent: false, reason: 'failed' }
    return { sent: true }
  })
