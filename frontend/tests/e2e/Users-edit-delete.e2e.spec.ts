import { test, expect, emailUnico, unico } from './support/fixtures'

test.describe('J03 — Edição de usuário', () => {
  test('atualiza o nome do usuário e mantém a alteração após recarregar', async ({ page, dados }) => {
    const email = emailUnico('j03')
    const nomeAnterior = unico('Nome anterior J03')
    const nomeNovo = unico('Nome novo J03')
    await dados.criarUsuario({ name: nomeAnterior, email })

    await page.goto('/users')
    const linha = page.getByRole('row').filter({ hasText: email })
    await linha.getByRole('button', { name: 'Editar' }).click()
    await page.getByLabel('Nome:').fill(nomeNovo)
    await page.getByRole('button', { name: 'Atualizar' }).click()

    await expect(linha).toContainText(nomeNovo)
    await expect(linha).not.toContainText(nomeAnterior)
    await page.reload()
    const linhaRecarregada = page.getByRole('row').filter({ hasText: email })
    await expect(linhaRecarregada).toContainText(nomeNovo)
    await expect(linhaRecarregada).not.toContainText(nomeAnterior)
  })
})

test.describe('J04 — Exclusão de usuário', () => {
  test('remove o usuário após confirmar e mantém a remoção após recarregar', async ({ page, dados }) => {
    const email = emailUnico('j04-confirmar')
    await dados.criarUsuario({ name: unico('Usuário J04'), email })

    await page.goto('/users')
    const linha = page.getByRole('row').filter({ hasText: email })
    page.once('dialog', (dialog) => dialog.accept())
    await linha.getByRole('button', { name: 'Excluir' }).click()
    await expect(linha).toHaveCount(0)
    await page.reload()
    await expect(page.getByRole('row').filter({ hasText: email })).toHaveCount(0)
  })

  test('mantém o usuário após cancelar a confirmação', async ({ page, dados }) => {
    const email = emailUnico('j04-cancelar')
    await dados.criarUsuario({ name: unico('Usuário J04'), email })

    await page.goto('/users')
    const linha = page.getByRole('row').filter({ hasText: email })
    page.once('dialog', (dialog) => dialog.dismiss())
    await linha.getByRole('button', { name: 'Excluir' }).click()
    await expect(linha).toBeVisible()
    await page.reload()
    await expect(page.getByRole('row').filter({ hasText: email })).toBeVisible()
  })
})
