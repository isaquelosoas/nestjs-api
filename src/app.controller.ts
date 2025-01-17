import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { AppService } from './app.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { GetObjectCommandOutput } from '@aws-sdk/client-s3';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('images')
  async getImage(
    @Query('prefix') prefix: string,
    @Query('continuationToken') continuationToken: string,
  ): Promise<GetObjectCommandOutput[]> {
    return await this.appService.getImages(prefix, continuationToken);
  }

  @Post('bucket')
  async createBucket(): Promise<string> {
    try {
      return await this.appService.createBucket();
    } catch {
      return 'error';
    }
  }

  @Post('image')
  @UseInterceptors(FileInterceptor('file')) // 'file' is the name of the input field
  async saveImage(
    @UploadedFile() file: Express.Multer.File,
    @Body('prefix') prefix: string,
  ): Promise<string> {
    return this.appService.saveImage(file, prefix);
  }
}
