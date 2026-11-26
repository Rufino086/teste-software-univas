import { test, expect, emailUnico, unico } from './support/fixtures'

test.describe('J05 — Cadastro, edição e exclusão de categoria', () => {
  test('cria categoria pela tela e mantém os dados após recarregar', async ({ page, dados }) => {
    // Defeito RNF01: os campos de Categoria não têm rótulo acessível.
    test.fail(true, 'RNF01: campos de categoria não associados aos rótulos impedem preencher por nome acessível.')
    const nome = unico('Categoria J05 criar')
    const descricao = unico('Descrição J05')
    await page.goto('/categories')
    await page.getByRole('button', { name: 'Adicionar Categoria' }).click()
    await page.getByLabel('Nome:').fill(nome)
    await page.getByLabel('Descrição:').fill(descricao)
    await page.getByRole('button', { name: 'Criar' }).click()
    await dados.registrarCategoriaPorNome(nome)

    const linha = page.getByRole('row').filter({ hasText: nome })
    await expect(page.getByRole('button', { name: 'Criar' })).toBeHidden()
    await expect(linha).toContainText(descricao)
    await page.reload()
    await expect(page.getByRole('row').filter({ hasText: nome })).toContainText(descricao)
  })

  test('edita categoria e mantém os novos valores após recarregar', async ({ page, dados }) => {
    // Defeito RNF01: os campos de Categoria não têm rótulo acessível.
    test.fail(true, 'RNF01: campos de categoria não associados aos rótulos impedem preencher por nome acessível.')
    const nomeAnterior = unico('Categoria J05 anterior')
    const nomeNovo = unico('Categoria J05 nova')
    const descricaoAnterior = unico('Descrição anterior J05')
    const descricaoNova = unico('Descrição nova J05')
    await dados.criarCategoria({ name: nomeAnterior, description: descricaoAnterior })

    await page.goto('/categories')
    const linha = page.getByRole('row').filter({ hasText: nomeAnterior })
    await linha.getByRole('button', { name: 'Editar' }).click()
    await page.getByLabel('Nome:').fill(nomeNovo)
    await page.getByLabel('Descrição:').fill(descricaoNova)
    await page.getByRole('button', { name: 'Atualizar' }).click()

    const linhaAtualizada = page.getByRole('row').filter({ hasText: nomeNovo })
    await expect(linhaAtualizada).toContainText(descricaoNova)
    await expect(linhaAtualizada).not.toContainText(descricaoAnterior)
    await page.reload()
    const linhaRecarregada = page.getByRole('row').filter({ hasText: nomeNovo })
    await expect(linhaRecarregada).toContainText(descricaoNova)
    await expect(linhaRecarregada).not.toContainText(nomeAnterior)
  })

  test('exclui categoria sem tarefas após confirmação e mantém a exclusão após recarregar', async ({ page, dados }) => {
    const nome = unico('Categoria J05 excluir confirmar')
    await dados.criarCategoria({ name: nome })

    await page.goto('/categories')
    const linha = page.getByRole('row').filter({ hasText: nome })
    page.once('dialog', (dialog) => dialog.accept())
    await linha.getByRole('button', { name: 'Excluir' }).click()
    await expect(linha).toHaveCount(0)
    await page.reload()
    await expect(page.getByRole('row').filter({ hasText: nome })).toHaveCount(0)
  })

  test('mantém categoria após cancelar a confirmação de exclusão', async ({ page, dados }) => {
    const nome = unico('Categoria J05 excluir cancelar')
    await dados.criarCategoria({ name: nome })

    await page.goto('/categories')
    const linha = page.getByRole('row').filter({ hasText: nome })
    page.once('dialog', (dialog) => dialog.dismiss())
    await linha.getByRole('button', { name: 'Excluir' }).click()
    await expect(linha).toBeVisible()
    await page.reload()
    await expect(page.getByRole('row').filter({ hasText: nome })).toBeVisible()
  })

  test('cancela o formulário sem criar categoria', async ({ page }) => {
    // Defeito RNF01: os campos de Categoria não têm rótulo acessível.
    test.fail(true, 'RNF01: campos de categoria não associados aos rótulos impedem preencher por nome acessível.')
    const nome = unico('Categoria J05 cancelar formulário')
    await page.goto('/categories')
    await page.getByRole('button', { name: 'Adicionar Categoria' }).click()
    await page.getByLabel('Nome:').fill(nome)
    await page.getByLabel('Descrição:').fill(unico('Descrição J05 cancelada'))
    await page.getByRole('button', { name: 'Cancelar' }).click()

    await expect(page.getByRole('button', { name: 'Criar' })).toBeHidden()
    await expect(page.getByRole('row').filter({ hasText: nome })).toHaveCount(0)
    await page.reload()
    await expect(page.getByRole('row').filter({ hasText: nome })).toHaveCount(0)
  })
})

test.describe('J06 — Exclusão de categoria em uso', () => {
  test('recusa excluir categoria com tarefa e mantém a categoria após recarregar', async ({ page, dados }) => {
    const nomeCategoria = unico('Categoria J06')
    const usuario = await dados.criarUsuario({ name: unico('Usuário J06'), email: emailUnico('j06') })
    const categoria = await dados.criarCategoria({ name: nomeCategoria })
    await dados.criarTarefa({ title: unico('Tarefa J06'), userId: usuario.id, categoryId: categoria.id })

    await page.goto('/categories')
    const linha = page.getByRole('row').filter({ hasText: nomeCategoria })
    page.once('dialog', (dialog) => dialog.accept())
    await linha.getByRole('button', { name: 'Excluir' }).click()

    await expect(page.getByText('Erro ao excluir categoria')).toBeVisible()
    await expect(linha).toBeVisible()
    await page.reload()
    await expect(page.getByRole('row').filter({ hasText: nomeCategoria })).toBeVisible()
  })
})
