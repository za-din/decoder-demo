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


Next step
Next step ,Apply the economical and non economical logic.
select matching CDR result where is economical or non economical.
update the local charges, voice to voice, voice to mobile (domestic call)

