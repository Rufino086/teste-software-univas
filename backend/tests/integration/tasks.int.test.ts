import { describe, it, expect, beforeEach, afterAll } from 'vitest'
import request from 'supertest'
import app from '../../src/app'
import { prisma, resetDb, seedUserAndCategory } from './helpers/db'

describe('API05 — PUT /api/tasks/:id', () => {
  beforeEach(async () => { await resetDb() })
  afterAll(async () => { await prisma.$disconnect() })

  it('API05 caso 1: grava transição permitida de PENDING para IN_PROGRESS', async () => {
    const { user, category } = await seedUserAndCategory()
    const task = await prisma.task.create({ data: { title: 'Entrega', userId: user.id, categoryId: category.id, status: 'PENDING' } })
    const res = await request(app).put(`/api/tasks/${task.id}`).send({ status: 'IN_PROGRESS' })
    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({ success: true, data: { id: task.id, status: 'IN_PROGRESS' } })
    expect((await prisma.task.findUnique({ where: { id: task.id } }))?.status).toBe('IN_PROGRESS')
  })

  it.fails('API05 caso 2: rejeita transição proibida de COMPLETED para PENDING', async () => {
    const { user, category } = await seedUserAndCategory()
    const task = await prisma.task.create({ data: { title: 'Entrega', userId: user.id, categoryId: category.id, status: 'COMPLETED' } })
    const res = await request(app).put(`/api/tasks/${task.id}`).send({ status: 'PENDING' })
    expect(res.status).toBe(400)
    expect(res.body).toMatchObject({ success: false, error: expect.any(String) })
    expect((await prisma.task.findUnique({ where: { id: task.id } }))?.status).toBe('COMPLETED')
  })

  it('API05 caso 3: responde 404 para tarefa inexistente', async () => {
    const res = await request(app).put('/api/tasks/inexistente').send({ status: 'IN_PROGRESS' })
    expect(res.status).toBe(404)
    expect(res.body).toMatchObject({ success: false, error: expect.any(String) })
    expect(await prisma.task.count()).toBe(0)
  })
})
