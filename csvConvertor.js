import * as fs from 'fs';
import { fileURLToPath } from 'url';
import * as path from 'path';
import csv from 'csv-parser';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const csvFilePath = path.join(__dirname, 'csv.csv');
const jsonFilePath = path.join(__dirname, 'output.json');

const results = [];

fs.createReadStream(csvFilePath)
    .pipe(csv())
    .on('data', (data) => {
      const transformedData = {
        rateId: data.rate_id,
        countryCode: Number(data.country_code),
        standardRate: Number(data.std_rate),
        reducedRate: Number(data.reduced_rate),
        description: data.description,
        dialPlan: data.dial_plan,
        chargingBlockId: data.charging_block_id,
        accessCode: data.access_code
      };
      results.push(transformedData);
    })
    .on('end', () => {
      fs.writeFileSync(jsonFilePath, JSON.stringify(results, null, 2));
      console.log('CSV file successfully converted to JSON and saved to output.json');
    });