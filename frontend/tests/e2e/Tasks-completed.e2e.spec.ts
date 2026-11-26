import { test, expect, emailUnico, unico } from './support/fixtures'

test.describe('J08 — Tarefa concluída', () => {
  test('recusa reabrir tarefa concluída e mantém COMPLETED após recarregar', async ({ page, dados }) => {
    // Defeito RNF01: controles de Tarefas não têm rótulos acessíveis.
    test.fail(true, 'RNF01: seletor Status não associado ao rótulo impede seleção por nome acessível.')
    const usuario = await dados.criarUsuario({ name: unico('Usuário J08'), email: emailUnico('j08') })
    const categoria = await dados.criarCategoria({ name: unico('Categoria J08') })
    const titulo = unico('Tarefa concluída J08')
    await dados.criarTarefa({
      title: titulo,
      userId: usuario.id,
      categoryId: categoria.id,
      status: 'COMPLETED'
    })

    await page.goto('/tasks')
    const linha = page.getByRole('row').filter({ hasText: titulo })
    await linha.getByRole('button', { name: 'Editar' }).click()
    await page.getByLabel('Status:').selectOption('PENDING')
    await page.getByRole('button', { name: 'Atualizar' }).click()

    await expect(page.getByText('Erro ao salvar tarefa')).toBeVisible()
    await expect(linha).toContainText('COMPLETED')
    await page.reload()
    await expect(page.getByRole('row').filter({ hasText: titulo })).toContainText('COMPLETED')
  })
})
