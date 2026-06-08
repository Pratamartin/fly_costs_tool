import { EtherealProvider } from '@/lib/email/providers/ethereal.provider'
import { BaseEmail } from '@/lib/email/templates/index'
import { renderEmailHtml } from '@/lib/email/util'
import { logger } from '@/lib/logger'

async function testEmail() {
  logger.info('Starting email test...')

  const provider = new EtherealProvider()

  const emailHtml = renderEmailHtml(
    await BaseEmail({
      title: 'SGDA Integration Test',
      children: (
        <p>This is a test email sent by the SGDA verification script. If you are seeing this, the template system and email provider are working correctly.</p>
      ),
    })!,
  )

  logger.info('Sending test email via Ethereal...')

  try {
    const result = await provider.send({
      to: 'success@sgda.com',
      subject: 'SGDA - Functionality Test',
      html: emailHtml,
      text: 'This is the plain text content of the SGDA test email.',
    })

    if (result.success && 'previewUrl' in result) {
      logger.info('✅ Email sent successfully!')
      logger.info(`🔗 Preview URL: ${result.previewUrl}`)
      logger.info('Open the link above in your browser to see how the email looks.')
    }
    else {
      logger.error(`❌ Failed to send email`)
    }
  }
  catch (error) {
    logger.error(error, '❌ Unexpected error during email test')
  }
}

testEmail().catch((err) => {
  logger.error(err, 'Fatal error in test script')
  process.exit(1)
})
