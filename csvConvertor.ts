import * as fs from 'fs';
import { fileURLToPath } from 'url';
import * as path from 'path';
import csv from 'csv-parser';

type RateRecord = {
  rate_id: string;
  country_code: string;
  std_rate: string;
  reduced_rate: string;
  description: string;
  dial_plan: string;
  charging_block_id: string;
  access_code: string;
};

const csvFilePath = path.join(__dirname, 'csv.csv');
const jsonFilePath = path.join(__dirname, 'output.json');

const results: RateRecord[] = [];

fs.createReadStream(csvFilePath)
  .pipe(csv())
  .on('data', (data) => results.push(data))
  .on('end', () => {
    fs.writeFileSync(jsonFilePath, JSON.stringify(results, null, 2));
    console.log('CSV file successfully converted to JSON and saved to output.json');
  });
