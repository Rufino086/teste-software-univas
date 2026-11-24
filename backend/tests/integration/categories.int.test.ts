import { describe, it, expect, beforeEach, afterAll } from 'vitest'
import request from 'supertest'
import app from '../../src/app'
import { prisma, resetDb, seedUserAndCategory } from './helpers/db'

describe('API03 / API04 — categorias', () => {
  beforeEach(async () => { await resetDb() })
  afterAll(async () => { await prisma.$disconnect() })

  it('API03 caso 1: remove categoria sem tarefas', async () => {
    const { category } = await seedUserAndCategory()
    const res = await request(app).delete(`/api/categories/${category.id}`)
    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({ success: true, message: expect.any(String) })
    expect(await prisma.category.findUnique({ where: { id: category.id } })).toBeNull()
  })

  it('API03 caso 2: impede remover categoria com uma tarefa', async () => {
    const { user, category } = await seedUserAndCategory()
    const task = await prisma.task.create({ data: { title: 'Entrega', userId: user.id, categoryId: category.id } })
    const res = await request(app).delete(`/api/categories/${category.id}`)
    expect(res.status).toBe(400)
    expect(res.body).toMatchObject({ success: false, error: expect.any(String) })
    expect(await prisma.category.findUnique({ where: { id: category.id } })).not.toBeNull()
    expect(await prisma.task.findUnique({ where: { id: task.id } })).not.toBeNull()
  })

  it('API03 caso 3: responde 404 para categoria inexistente', async () => {
    const res = await request(app).delete('/api/categories/inexistente')
    expect(res.status).toBe(404)
    expect(res.body).toMatchObject({ success: false, error: expect.any(String) })
    expect(await prisma.category.count()).toBe(0)
    expect(await prisma.task.count()).toBe(0)
  })

  it('API04 caso 1: cria categoria com nome inédito', async () => {
    const res = await request(app).post('/api/categories').send({ name: 'Estudos' })
    expect(res.status).toBe(201)
    expect(res.body.success).toBe(true)
    expect(res.body.data).toMatchObject({ name: 'Estudos' })
    expect(await prisma.category.count({ where: { name: 'Estudos' } })).toBe(1)
  })

  it.fails('API04 caso 2: rejeita nome duplicado após normalização', async () => {
    await prisma.category.create({ data: { name: ' trabalho ' } })
    const res = await request(app).post('/api/categories').send({ name: 'Trabalho' })
    expect(res.status).toBe(409)
    expect(res.body).toMatchObject({ success: false, error: expect.any(String) })
    expect(await prisma.category.count()).toBe(1)
  })
})
