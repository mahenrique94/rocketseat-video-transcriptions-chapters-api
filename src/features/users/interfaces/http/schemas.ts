import { z } from 'zod/v4'

export const signUpSchema = z
  .object({
    firstName: z.string().describe('Primeiro nome'),
    lastName: z.string().describe('Sobrenome'),
    email: z.string().describe('E-mail'),
    password: z.string().describe('Senha'),
    confirmPassword: z.string().describe('Confirmação da senha'),
  })
  .describe('Dados de cadastro de usuário')
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não conferem',
    path: ['confirmPassword'],
  })

export const signInSchema = z
  .object({
    email: z.string().describe('E-mail'),
    password: z.string().describe('Senha'),
  })
  .describe('Dados de autenticação de usuário')

export const userResponseSchema = z
  .object({
    id: z.string().describe('ID único do usuário'),
    firstName: z.string().describe('Primeiro nome'),
    lastName: z.string().describe('Sobrenome'),
    email: z.string().describe('E-mail'),
    createdAt: z.date().describe('Data de criação'),
    updatedAt: z.date().describe('Data de atualização'),
    active: z.boolean().describe('Se o usuário está ativo'),
    role: z.enum(['user', 'admin']).describe('Perfil de acesso do usuário'),
    confirmationToken: z.string().describe('Token para confirmar a conta'),
  })
  .describe('Usuário criado')

export const signInResponseSchema = z
  .object({
    token: z.string().describe('JWT de autenticação'),
    refreshToken: z.string().describe('Refresh token para renovar a sessão'),
  })
  .describe('Resultado da autenticação')

export const refreshTokenSchema = z
  .object({
    refreshToken: z.string().describe('Refresh token'),
  })
  .describe('Dados para renovar o token de acesso')

export const refreshTokenResponseSchema = z
  .object({
    token: z.string().describe('Novo JWT de autenticação'),
    refreshToken: z.string().describe('Novo refresh token'),
  })
  .describe('Resultado da renovação do token de acesso')

export const signOutResponseSchema = z
  .object({
    message: z.string().describe('Mensagem de confirmação'),
  })
  .describe('Resultado do encerramento de sessão')

export const confirmAccountBodySchema = z
  .object({
    token: z.string().min(1).describe('Token de confirmação da conta'),
  })
  .describe('Dados de confirmação de conta')

export const confirmAccountResponseSchema = z
  .object({
    message: z.string().describe('Mensagem de confirmação'),
  })
  .describe('Resultado da confirmação de conta')
