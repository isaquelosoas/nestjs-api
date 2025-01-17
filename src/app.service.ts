import { Injectable } from '@nestjs/common';
import {
  CreateBucketCommand,
  PutObjectCommand,
  ListObjectsV2Command,
  S3Client,
  GetObjectCommandOutput,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { GetParameterCommand, SSMClient } from '@aws-sdk/client-ssm';

@Injectable()
export class AppService {
  private readonly awsS3Client = new S3Client({ region: 'us-east-1' });
  private bucketName = '';

  constructor() {
    this.createBucket();
  }

  async getImages(prefix: string, continuationToken?: string): Promise<any[]> {
    try {
      const { Contents } = await this.awsS3Client.send(
        new ListObjectsV2Command({
          Bucket: this.bucketName,
          Prefix: prefix,
          MaxKeys: 5,
          ContinuationToken: continuationToken,
        }),
      );
      if (Contents && Contents.length > 0) {
        const getObjectPromise = await Promise.all(
          Contents.map(async (content) => {
            const getObjectCommand = new GetObjectCommand({
              Bucket: this.bucketName,
              Key: content.Key,
            });
            return await this.awsS3Client.send(getObjectCommand);
          }),
        ).then((results) => {
          return results.map((result, index) => {
            return {
              key: Contents[index].Key,
              url: result.Metadata,
            };
          });
        });
      
        return ;
      }
      return [];
    } catch (err) {
      console.log(err);
      return [];
    }
  }

  async createBucket(): Promise<string> {
    if (!this.bucketName) {
      const ssmClient = new SSMClient({ region: 'us-east-1' });

      try {
        const paramCommand = new GetParameterCommand({
          Name: 'bucketname',
        });
        const response = await ssmClient.send(paramCommand);
        this.bucketName = response.Parameter?.Value;
      } catch (err) {
        this.bucketName = process.env.AWS_S3_BUCKET_NAME;
      }
    }
    await this.awsS3Client.send(
      new CreateBucketCommand({
        Bucket: this.bucketName,
      }),
    );

    return 'bucket created';
  }

  async saveImage(
    file: Express.Multer.File,
    prefix: string = '',
  ): Promise<string> {
    await this.awsS3Client.send(
      new PutObjectCommand({
        Bucket: this.bucketName,
        Key: `${prefix}/${file.originalname}`,
        Body: file.buffer,
      }),
    );
    return 'image saved';
  }
}
