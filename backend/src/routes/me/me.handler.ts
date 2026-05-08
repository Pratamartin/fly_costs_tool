import type { IndexRoute, UpdateRoute } from './me.route'
import type { AppRouteHandler } from '@/lib/type'
import * as codes from 'stoker/http-status-codes'
import * as phrases from 'stoker/http-status-phrases'
import { USER_ERROR_CODES } from '@/constants/user.constant'
import { UserSchema } from '@/schemas/user.schema'
import { getUserById, updateUser } from '@/services/user.service'

export const index: AppRouteHandler<IndexRoute> = async (c) => {
  const { sub } = c.get('jwtPayload')

  const userProfile = await getUserById(sub)

  if (!userProfile) {
    return c.json({ message: 'Usuário não encontrado no sistema' }, codes.NOT_FOUND)
  }

  return c.json(userProfile, codes.OK)
}

export const update: AppRouteHandler<UpdateRoute> = async (c) => {
  const { sub } = c.get('jwtPayload')
  const data = c.req.valid('json')

  const result = await updateUser(sub, data)

  if ('error' in result) {
    switch (result.error) {
      case USER_ERROR_CODES.CPF_ALREADY_USED:
        return c.json(
          { message: 'O CPF informado já está em uso por outro usuário.' },
          codes.CONFLICT,
        )

      case USER_ERROR_CODES.PROFILE_UPDATE_NOT_ALLOWED:
        return c.json(
          { message: 'Acesso negado: Apenas alunos podem atualizar dados de perfil.' },
          codes.FORBIDDEN,
        )

      case phrases.NOT_FOUND:
        return c.json(
          { message: 'O usuário não foi encontrado no sistema.' },
          codes.NOT_FOUND,
        )
    }
  }
  const parsed = UserSchema.parse(result)
  return c.json(parsed, codes.OK)
}
