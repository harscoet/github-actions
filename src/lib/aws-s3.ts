import {ListObjectsCommand, S3Client, GetObjectCommand, GetObjectCommandInput} from '@aws-sdk/client-s3'
import { Readable } from 'stream'

export class AwsS3 {
  private client: S3Client;

  constructor(region?: string) {
    this.client = new S3Client({region: region || 'eu-west-1'})
  }

  public async getCertificates(
    bucket: string,
    domain: string
  ): Promise<AwsS3.Certificate> {
    const command = new ListObjectsCommand({
      Bucket: bucket,
      Prefix: domain,
      Delimiter: 'kong/'
    })

    const output = await this.client.send(command)

    const objects = (output.Contents ?? [])
      .sort(
        (a, b) =>
          (a.LastModified?.getTime() ?? 0) - (b.LastModified?.getTime() ?? 0)
      )
      .slice(-2)

    const bodies = await Promise.all(objects.map(async x => ({
      key: x.Key,
      body: await this.readObjectAsString({
        Bucket: bucket,
        Key: x.Key
      }),
    })))

    return bodies.reduce((acc, x) => {
      const filename = x.key?.split('/').pop()
      const kind = filename?.split('-')[0]

      return !filename || !kind ? acc : {
        ...acc,
        [kind]: x.body
      }
    }, {} as AwsS3.Certificate)
  }

  private async readObjectAsString(input: GetObjectCommandInput) {
    const output = await this.client.send(new GetObjectCommand(input))

    let body = ''
    for await (const chunk of output.Body as Readable) {
      body += chunk
    }

    return body
  }
}

export namespace AwsS3 {
  export interface Certificate {
    privkey: string
    fullchain: string
  }
}
