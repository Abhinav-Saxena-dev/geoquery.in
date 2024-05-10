import { Controller, Get, Logger, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { GeorevService } from './georev.service';
import { formatGeorevSuccessResponse } from '../..//utils/serializer/success';

@ApiTags('/georev')
@Controller('georev')
export class GeorevController {
  private readonly logger = new Logger(GeorevController.name);

  constructor(private readonly geoRevService: GeorevService){}

  @Get()
  async getGeoRev(@Query('lat') lat: string, @Query('lon') lon: string) {
    try {
      if (!lat || !lon) {
        this.logger.error(`lat lon query missing`);
        return { status: 'fail', error: `lat lon query missing` };
      }

      const resp = this.geoRevService.getGeoRev(lat, lon);

      if (!resp) {
        this.logger.error(`No GeoLocation found for lat: ${lat}, lon: ${lon}`);
        return {
          status: 'fail',
          error: `No GeoLocation found for lat: ${lat}, lon: ${lon}`,
        };
      }

      this.logger.log(`GeoRev Success Response: ${JSON.stringify(resp)}`);
      return formatGeorevSuccessResponse(resp);
    } catch (error) {
      this.logger.error(`Error processing lat lon: ${error.name}`);
      return { status: 'fail', error: error.message };
    }
  }
}
