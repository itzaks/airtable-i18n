#!/usr/bin/node --es-module-specifier-resolution=node

import program from 'commander'
import * as path from "path";
import { log } from './log'
import { parse, generate } from './index'
import dotenv from 'dotenv'

program
	.version("1.0.1")
	.option("-d, --directory <directory>", "specify output directory")
	.option("-a, --api <apikey>", "specify airtable apikey")
	.option("-t, --base <baseid>", "specify base id")
	.option("-b, --beautify", "Beautify generated files")
	.option("-f, --format <fileformat>", "Format of the output files")
	.option("-e, --env <path>", "Path to .env file")
	.option("-i, --index", "create index.js file with default exports")
	.parse(process.argv);

dotenv.config({ path: path.resolve(program.opts().env || './.env' )})


const options = {
	directory: process.env.AIRTABLE_I18N_DIRECTORY || program.opts().directory || '.',
	api: process.env.AIRTABLE_I18N_API_KEY || program.opts().api,
	base: process.env.AIRTABLE_I18N_BASE_ID || program.opts().base,
	beautify: program.opts().beautify,
};


 
// const countdown = new CLI.Spinner('Contacting Airtable (1/2) ', ['⣾','⣽','⣻','⢿','⡿','⣟','⣯','⣷']);
// countdown.start();

(async () => {
  try {
    log('Creating translations', '🔧', 1, 4);
    if (!options.api) throw new Error('Missing airtable API key.');
    if (!options.base) throw new Error('Missing airtable base id.');

    const languages = await parse(options.api, options.base)
		console.log("LANGS", languages);

    await generate(languages, options.directory, Boolean(options.beautify));

    console.log(`🚂  Successfuly generated translations`);
  } catch (error) {
    console.log('Failed to generate files: ', error.message);
  }
})();