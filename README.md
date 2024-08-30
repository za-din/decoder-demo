# CDR Decoder

This project provides a robust CDR (Call Detail Record) decoding and processing system.

## Features

- Parses DLV files
- Processes international, landline, and mobile call records
- Applies time-based rates (standard and reduced)
- Generates JSON and CSV outputs

## Installation

1. Clone the repository
2. Run `npm install` to install dependencies

## Usage

### Running Tests

## File Structure

- `src/decoder.ts`: Main decoder logic
- `test/decoder.test.ts`: Test suite for the decoder
- `cdr.json`: CDR rates configuration
- `data.DLV`: Sample DLV file refer Google Chat Group for the file


### Running Tests
When the tests are completed, a CSV file is generated with the processed records. The CSV file includes the following fields:

- NETTYPE
- BILLTYPE
- SUBSCRIBER
- DESTINATION
- TYPE
- ECONOMICAL
- COUNTRYCODE
- ANSDATE
- ANSTIME
- ENDDATE
- ENDTIME
- CONVERSATIONTIME
- TOTALCHARGES


## Logic

This only apply for NON economical international calls
Current calculation of standard and reduced rates.
scenario 1 second from standard time and 1 second from reduced time which total is 2 seconds
example the standard rate is 0.06 and the reduced rate is 0.05
the total charge is 0.06 + 0.05 = 0.11

another approach while waiting for confirmed logic
Approach B
the rate follow which range time the call is in
so the 2 seconds 
then will be charged as 0.06 if the call is in the standard rate
0.05 if the call is in the reduced rate

lets try 60 seconds scenario
so it start 30 seconds in the standard rate and 30 seconds in the reduced rate
it is charged by minutes and any seconds will be round up to the next minute. 
so it will be 1 minute for the standard rate and 1 minute for the reduced rate
so the total charge is 0.06 + 0.05 = 0.11

lets try approach B
the rate follow which range time the call is in
so the 60 seconds
then will be charged as 0.06 if the call is in the standard rate
0.05 if the call is in the reduced rate









## TODO

INSERT INTO DATABASE

