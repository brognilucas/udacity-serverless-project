import * as AWS from 'aws-sdk'
import { createLogger } from '../utils/logger'

const logger = createLogger('imageService')

const s3 = new AWS.S3({
  signatureVersion: 'v4'
})

const bucketName = process.env.IMAGES_S3_BUCKET
const urlExpiration = parseInt(process.env.SIGNED_URL_EXPIRATION)

export class ImageService {
  static getSignedUrl(todoId: string, userId: string) {
    return s3.getSignedUrl('putObject', {
      Bucket: bucketName,
      Key: `${todoId}_${userId}`,
      Expires: urlExpiration
    })
  }

  static getDownloadUrl(todoId: string, userId: string): string {
    const key = `${todoId}_${userId}`

    logger.info('Generating new url')
    const url = s3.getSignedUrl('getObject', {
      Bucket: bucketName,
      Key: key,
      Expires: urlExpiration
    })

    return url
  }

  static async deleteImage(todoId: string, userId: string) {
    await s3
      .deleteObject({
        Bucket: bucketName,
        Key: `${todoId}_${userId}`
      })
      .promise()
  }
}
