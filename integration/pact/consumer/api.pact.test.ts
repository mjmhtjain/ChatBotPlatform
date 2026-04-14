import path from 'path'
import axios from 'axios'
import { PactV3, MatchersV3 } from '@pact-foundation/pact'

const { like, regex } = MatchersV3

const provider = new PactV3({
  consumer: 'frontend',
  provider: 'backend',
  dir: path.resolve(__dirname, '../pacts'),
})

const AUTH_HEADER = { Authorization: like('Bearer some-jwt-token') }

// ── Auth interactions ──────────────────────────────────────────────────────

describe('POST /api/auth/login', () => {
  it('returns 200 with access_token on valid credentials', () => {
    return provider
      .given('valid credentials exist')
      .uponReceiving('a valid login request')
      .withRequest({
        method: 'POST',
        path: '/api/auth/login',
        headers: { 'Content-Type': 'application/json' },
        body: { email: 'user@gmail.com', password: 'password' },
      })
      .willRespondWith({
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: { access_token: like('some-jwt-token') },
      })
      .executeTest(async (mockServer) => {
        const response = await axios.post(`${mockServer.url}/api/auth/login`, {
          email: 'user@gmail.com',
          password: 'password',
        })
        expect(response.status).toBe(200)
        expect(response.data.access_token).toBeTruthy()
      })
  })

  it('returns 401 on wrong password', () => {
    return provider
      .given('valid credentials exist')
      .uponReceiving('a login request with wrong password')
      .withRequest({
        method: 'POST',
        path: '/api/auth/login',
        headers: { 'Content-Type': 'application/json' },
        body: { email: 'user@gmail.com', password: 'wrongpassword' },
      })
      .willRespondWith({ status: 401 })
      .executeTest(async (mockServer) => {
        await expect(
          axios.post(`${mockServer.url}/api/auth/login`, {
            email: 'user@gmail.com',
            password: 'wrongpassword',
          })
        ).rejects.toMatchObject({ response: { status: 401 } })
      })
  })
})

// ── Projects interactions ──────────────────────────────────────────────────

describe('GET /api/projects', () => {
  it('returns 200 with empty array when user has no projects', () => {
    return provider
      .given('user has no projects')
      .uponReceiving('a request to list projects')
      .withRequest({
        method: 'GET',
        path: '/api/projects',
        headers: AUTH_HEADER,
      })
      .willRespondWith({
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: [],
      })
      .executeTest(async (mockServer) => {
        const response = await axios.get(`${mockServer.url}/api/projects`, {
          headers: { Authorization: 'Bearer some-jwt-token' },
        })
        expect(response.status).toBe(200)
        expect(response.data).toEqual([])
      })
  })
})

describe('POST /api/projects', () => {
  it('returns 201 with project object on create', () => {
    return provider
      .given('user has no projects')
      .uponReceiving('a request to create a project')
      .withRequest({
        method: 'POST',
        path: '/api/projects',
        headers: { ...AUTH_HEADER, 'Content-Type': 'application/json' },
        body: { name: 'My Project' },
      })
      .willRespondWith({
        status: 201,
        headers: { 'Content-Type': 'application/json' },
        body: {
          id: like('some-uuid'),
          name: 'My Project',
          owner_email: like('user@gmail.com'),
          created_at: like('2024-01-01T00:00:00Z'),
          updated_at: like('2024-01-01T00:00:00Z'),
        },
      })
      .executeTest(async (mockServer) => {
        const response = await axios.post(
          `${mockServer.url}/api/projects`,
          { name: 'My Project' },
          { headers: { Authorization: 'Bearer some-jwt-token' } }
        )
        expect(response.status).toBe(201)
        expect(response.data.name).toBe('My Project')
        expect(response.data.id).toBeTruthy()
      })
  })
})

describe('PATCH /api/projects/:id', () => {
  it('returns 200 with renamed project', () => {
    return provider
      .given('user has one project')
      .uponReceiving('a request to rename a project')
      .withRequest({
        method: 'PATCH',
        path: regex('/api/projects/test-project-id', '/api/projects/[\\w-]+'),
        headers: { ...AUTH_HEADER, 'Content-Type': 'application/json' },
        body: { name: 'Renamed Project' },
      })
      .willRespondWith({
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: {
          id: like('some-uuid'),
          name: 'Renamed Project',
          owner_email: like('user@gmail.com'),
          created_at: like('2024-01-01T00:00:00Z'),
          updated_at: like('2024-01-01T00:00:00Z'),
        },
      })
      .executeTest(async (mockServer) => {
        const response = await axios.patch(
          `${mockServer.url}/api/projects/test-project-id`,
          { name: 'Renamed Project' },
          { headers: { Authorization: 'Bearer some-jwt-token' } }
        )
        expect(response.status).toBe(200)
        expect(response.data.name).toBe('Renamed Project')
      })
  })
})

describe('DELETE /api/projects/:id', () => {
  it('returns 204 on delete', () => {
    return provider
      .given('user has one project')
      .uponReceiving('a request to delete a project')
      .withRequest({
        method: 'DELETE',
        path: regex('/api/projects/test-project-id', '/api/projects/[\\w-]+'),
        headers: AUTH_HEADER,
      })
      .willRespondWith({ status: 204 })
      .executeTest(async (mockServer) => {
        const response = await axios.delete(
          `${mockServer.url}/api/projects/test-project-id`,
          { headers: { Authorization: 'Bearer some-jwt-token' } }
        )
        expect(response.status).toBe(204)
      })
  })
})
