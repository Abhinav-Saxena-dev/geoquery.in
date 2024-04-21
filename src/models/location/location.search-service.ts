import { Injectable } from '@nestjs/common';
const Fuse = require('fuse.js');
import * as fs from 'fs';

enum Level {
  STATE = 'state',
  DISTRICT = 'district',
  SUBDISTRICT = 'subDistrict',
  VILLAGE = 'village',
}

@Injectable()
export class LocationSearchService {
  private villagePreprocessedData: any[];
  private subDistrictPreprocessedData: any[];
  private districtPreprocessedData: any[];
  private statePreProcessedData: any[];

  constructor(filePath: string) {
    this.villagePreprocessedData = [];
    this.subDistrictPreprocessedData = [];
    this.districtPreprocessedData = [];
    this.statePreProcessedData = [];

    const jsonData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

    jsonData.forEach((stateData: any) => {
      stateData.districts.forEach((districtData: any) => {
        districtData.subDistricts.forEach((subDistrictData: any) => {
          subDistrictData.villages.forEach((village: any) => {
            if (village !== null) {
              this.villagePreprocessedData.push({
                state: stateData.state,
                district: districtData.district,
                subDistrict: subDistrictData.subDistrict,
                village,
              });
            }
          });
          this.subDistrictPreprocessedData.push({
            state: stateData.state,
            district: districtData.district,
            subDistrict: subDistrictData.subDistrict,
          });
        });
        this.districtPreprocessedData.push({
          state: stateData.state,
          district: districtData.district,
        });
      });
      this.statePreProcessedData.push({
        state: stateData.state,
      });
    });
  }

  fuzzySearch(level: Level, query: string, filters: any[] | null): any[] {
    return this.querySearch(level, query, 0.1, 0, filters);
  }

  search(level: Level, query: string, filters: any[] | null): any[] {
    return this.querySearch(level, query, 0.0, 0, filters);
  }

  private querySearch(
    searchLevel: Level | any,
    query: string,
    threshold: number,
    distance: number = 0,
    filters: any[] | null,
  ): any[] {
    const options = {
      keys: [searchLevel.name],
      threshold,
      distance,
      isCaseSensitive: false,
    };
    let processedData: any[];

    switch (searchLevel.name) {
      case Level.STATE:
        processedData = this.statePreProcessedData;
        break;
      case Level.DISTRICT:
        processedData = this.districtPreprocessedData;
        break;
      case Level.SUBDISTRICT:
        processedData = this.subDistrictPreprocessedData;
        break;
      case Level.VILLAGE:
        processedData = this.villagePreprocessedData;
        break;
      default:
        processedData = [];
        break;
    }

    if (filters !== null) {
      for (let nodeDepth = 0; nodeDepth < searchLevel.depth; nodeDepth++) {
        for (const filter of filters) {
          if (filter.level.depth !== nodeDepth) continue;
          let filteredData = [];
          for (let index = 0; index < processedData.length; index++) {
            if (
              processedData[index][`${filter.level.name}`]
                .toLowerCase()
                .includes(filter.query.toLowerCase())
            ) {
              filteredData.push(processedData[index]);
            }
          }
          processedData = filteredData;
        }
      }
    }

    const fuse = new Fuse(processedData, options);
    const result = fuse.search(query);

    return result.map((entry) => ({ ...entry.item }));
  }
}
