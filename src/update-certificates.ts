import * as core from '@actions/core'
import * as glob from '@actions/glob'
import * as sops from './lib/sops'
import {AwsS3} from './lib/aws-s3'
import {parse as parsePath} from 'path'

export async function updateCertificates(workspace: string): Promise<void> {
  const bucket = core.getInput('aws_s3_bucket') || process.env.BUCKET
  const s3 = new AwsS3(core.getInput('aws_s3_region'))

  if (!bucket) {
    throw new Error('Bucket is required')
  }

  const fileSuffix = '-tls.enc.yaml'
  const globber = await glob.create(`${workspace}/resources/*${fileSuffix}`)

  for (const filepath of (await globber.glob()).slice(0, 1)) {
    const domain = parsePath(filepath).base.replace(fileSuffix, '')

    if (!domain) {
      continue
    }

    const [certificateFromS3, fullchain, privateKey] = await Promise.all([
      s3.getCertificates(bucket, domain),
      sops.extract('full_chain', filepath),
      sops.extract('private_key', filepath)
    ])

    if (certificateFromS3.fullchain !== fullchain) {
      core.info(`PrivateKey ${privateKey}`)
    }
  }

  try {
    core.setOutput('time', new Date().toTimeString())
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}
