import Axios from 'axios'

export class JwksService {
  private options: any

  constructor(options) {
    this.options = { strictSsl: true, ...options }
  }

  async getJwks() {
    const { data } = await Axios.get(this.options.jwksUri, {
      headers: {
        'Content-Type': 'application/json'
      }
    })

    return data.keys
  }

  async getSigningKeys() {
    const keys = await this.getJwks()
    if (!keys || !keys.length) {
      throw new Error('The JWKS endpoint did not contain any keys')
    }

    return keys
      .filter(
        (key) =>
          key.use === 'sig' && // JWK property `use` determines the JWK is for signature verification
          key.kty === 'RSA' && // We are only supporting RSA (RS256)
          key.kid && // The `kid` must be present to be useful for later
          ((key.x5c && key.x5c.length) || (key.n && key.e)) // Has useful public keys
      )
      .map((key) => {
        return { kid: key.kid, nbf: key.nbf, publicKey: certToPEM(key.x5c[0]) }
      })
  }
}

export function certToPEM(cert) {
  cert = cert.match(/.{1,64}/g).join('\n')
  cert = `-----BEGIN CERTIFICATE-----\n${cert}\n-----END CERTIFICATE-----\n`
  return cert
}
