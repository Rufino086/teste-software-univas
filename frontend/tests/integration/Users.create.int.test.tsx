import { describe, it, expect } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import Users from '../../src/components/Users'
import { server } from '../msw/server'

describe('Users — criação (RF08 / RF09)', () => {
  it('RF08 caso 1: envia os dados e exibe o usuário após recarregar a lista', async () => {
    const user = userEvent.setup()
    let enviados: unknown
    let criada = false
    server.use(
      http.get('*/api/users', () => HttpResponse.json({ success: true, count: criada ? 1 : 0, data: criada ? [{ id: 'u2', name: 'Bruna Lima', email: 'bruna@email.com', createdAt: '2026-11-01T10:00:00.000Z', tasks: [] }] : [] })),
      http.post('*/api/users', async ({ request }) => {
        enviados = await request.json()
        criada = true
        return HttpResponse.json({ success: true, data: { id: 'u2', name: 'Bruna Lima', email: 'bruna@email.com' } }, { status: 201 })
      })
    )

    render(<Users />)
    await user.click(await screen.findByRole('button', { name: 'Adicionar Usuário' }))
    await user.type(screen.getByLabelText('Nome:'), 'Bruna Lima')
    await user.type(screen.getByLabelText('Email:'), 'bruna@email.com')
    await user.click(screen.getByRole('button', { name: 'Criar' }))

    const linha = (await screen.findByText('Bruna Lima')).closest('tr')!
    expect(within(linha).getByText('bruna@email.com')).toBeInTheDocument()
    expect(enviados).toEqual({ name: 'Bruna Lima', email: 'bruna@email.com' })
    expect(screen.queryByRole('button', { name: 'Criar' })).not.toBeInTheDocument()
  })

  it.fails('RF09 caso 1: informa conflito e mantém o formulário preenchido quando email já existe', async () => {
    const user = userEvent.setup()
    let enviados: unknown
    server.use(
      http.get('*/api/users', () => HttpResponse.json({ success: true, count: 0, data: [] })),
      http.post('*/api/users', async ({ request }) => {
        enviados = await request.json()
        return HttpResponse.json({ success: false, error: 'Email already exists' }, { status: 409 })
      })
    )

    render(<Users />)
    await user.click(await screen.findByRole('button', { name: 'Adicionar Usuário' }))
    await user.type(screen.getByLabelText('Nome:'), 'Bruna Lima')
    await user.type(screen.getByLabelText('Email:'), 'bruna@email.com')
    await user.click(screen.getByRole('button', { name: 'Criar' }))

    expect(await screen.findByText('Email já cadastrado')).toBeInTheDocument()
    expect(screen.getByLabelText('Nome:')).toHaveValue('Bruna Lima')
    expect(screen.getByLabelText('Email:')).toHaveValue('bruna@email.com')
    expect(enviados).toEqual({ name: 'Bruna Lima', email: 'bruna@email.com' })
  })
})
