import { CustomAuthorizerEvent, CustomAuthorizerResult } from 'aws-lambda'
import 'source-map-support/register'
import { decode, verify } from 'jsonwebtoken'
import { createLogger } from '../../utils/logger'
import { JwtPayload } from '../../auth/JwtPayload'
import { JwksService } from '../../services/jwksService'
const logger = createLogger('auth')
const jwksUrl = 'https://lucas-brogni.us.auth0.com/.well-known/jwks.json'

export const handler = async (
  event: CustomAuthorizerEvent
): Promise<CustomAuthorizerResult> => {
  logger.info('Authorizing a user', event.authorizationToken)
  try {
    const jwtToken = await verifyToken(event.authorizationToken)
    logger.info('User was authorized', jwtToken)

    return {
      principalId: jwtToken.sub,
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Allow',
            Resource: '*'
          }
        ]
      }
    }
  } catch (e) {
    logger.error('User not authorized', { error: e.message })

    return {
      principalId: 'user',
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Deny',
            Resource: '*'
          }
        ]
      }
    }
  }
}

async function verifyToken(authHeader: string): Promise<JwtPayload> {
  const token = getToken(authHeader)
  const jwt = decode(token, { complete: true })
  const client = new JwksService({
    jwksUri: jwksUrl
  })

  const [cert] = await client.getSigningKeys()
  verify(token, cert.publicKey, { algorithms: ['RS256'] }) as JwtPayload

  return jwt as JwtPayload
}

function getToken(authHeader: string): string {
  if (!authHeader) throw new Error('No authentication header')

  if (!authHeader.toLowerCase().startsWith('bearer '))
    throw new Error('Invalid authentication header')

  const split = authHeader.split(' ')
  return split[1]
}
