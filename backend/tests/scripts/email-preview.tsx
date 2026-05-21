import { EtherealProvider } from '@/email/providers/ethereal.provider'
import { BaseEmail } from '@/email/templates/index'
import { renderEmailHtml } from '@/email/util'
import { logger } from '@/lib/logger'

async function testEmail() {
  logger.info('Iniciando teste de e-mail...')

  const provider = new EtherealProvider()

  const emailHtml = renderEmailHtml(
    await BaseEmail({
      title: 'Teste de Integração SGDA',
      children: (
        <p>Este é um e-mail de teste enviado pelo script de verificação do SGDA. Se você está vendo isso, o sistema de templates e o provedor de e-mail estão funcionando corretamente.</p>
      ),
    })!,
  )

  logger.info('Enviando e-mail de teste via Ethereal...')

  try {
    const result = await provider.send({
      to: 'sucesso@sgda.com',
      subject: 'SGDA - Teste de Funcionamento',
      html: emailHtml,
      text: 'Este é o conteúdo em texto simples do e-mail de teste do SGDA.',
    })

    if (result.success && 'previewUrl' in result) {
      logger.info('✅ E-mail enviado com sucesso!')
      logger.info(`🔗 URL de visualização: ${result.previewUrl}`)
      logger.info('Abra o link acima no seu navegador para ver como o e-mail ficou.')
    }
    else {
      logger.error(`❌ Falha ao enviar e-mail`)
    }
  }
  catch (error) {
    logger.error(error, '❌ Erro inesperado durante o teste de e-mail')
  }
}

testEmail().catch((err) => {
  logger.error(err, 'Erro fatal no script de teste')
  process.exit(1)
})
