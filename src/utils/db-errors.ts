import { DrizzleQueryError } from 'drizzle-orm/errors'
import { DatabaseError } from 'pg'

const POSTGRES_ERROR_CODES: Record<string, { status: number; message: string }> = {
  '23505': { status: 409, message: 'Registro duplicado' },
  '23503': { status: 400, message: 'Violação de chave estrangeira' },
  '23502': { status: 400, message: 'Campo obrigatório não pode ser nulo' },
  '23514': { status: 400, message: 'Violação de restrição de verificação' },
  '22P02': { status: 400, message: 'Formato de dados inválido' },
  '08006': { status: 503, message: 'Falha na conexão com o banco de dados' },
  '08003': { status: 503, message: 'Conexão com o banco de dados não existe' },
  '08001': { status: 503, message: 'Falha ao conectar com o banco de dados' },
  '57P01': { status: 503, message: 'Banco de dados encerrou a conexão anormalmente' },
  '42703': { status: 503, message: 'Coluna não existe no banco de dados' },
}

export function isDbError(error: unknown): error is DrizzleQueryError {
  return error instanceof DrizzleQueryError
}

export function getDbError(error: DrizzleQueryError): { status: number; message: string; detail?: string } {
  const cause = error.cause as DatabaseError | undefined

  if (cause && 'code' in cause && typeof cause.code === 'string') {
    const mapped = POSTGRES_ERROR_CODES[cause.code]
    if (mapped) {
      return {
        status: mapped.status,
        message: mapped.message,
        detail: cause.detail,
      }
    }
  }

  return { status: 500, message: 'Erro interno do servidor' }
}
