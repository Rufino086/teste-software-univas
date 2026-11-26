import { test, expect, emailUnico, unico } from './support/fixtures'

test.describe('J07 — Email já cadastrado', () => {
  test('informa email duplicado, preserva formulário e não cria outro usuário', async ({ page, dados }) => {
    // Defeito RF09: a tela mostra erro genérico no lugar da mensagem de email duplicado.
    test.fail(true, 'RF09: API 409 resulta em “Erro ao salvar usuário”, sem “Email já cadastrado”.')
    const email = emailUnico('j07')
    const nomeOriginal = unico('Usuário J07 original')
    const nomeTentativa = unico('Usuário J07 duplicado')
    await dados.criarUsuario({ name: nomeOriginal, email })

    await page.goto('/users')
    await page.getByRole('button', { name: 'Adicionar Usuário' }).click()
    await page.getByLabel('Nome:').fill(nomeTentativa)
    await page.getByLabel('Email:').fill(email)
    await page.getByRole('button', { name: 'Criar' }).click()

    await expect(page.getByText('Email já cadastrado')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Criar' })).toBeVisible()
    await expect(page.getByLabel('Nome:')).toHaveValue(nomeTentativa)
    await expect(page.getByLabel('Email:')).toHaveValue(email)
    await page.reload()
    const linha = page.getByRole('row').filter({ hasText: email })
    await expect(linha).toBeVisible()
    await expect(linha).toContainText(nomeOriginal)
    await expect(linha).not.toContainText(nomeTentativa)
    await expect(linha).toHaveCount(1)
  })
})
