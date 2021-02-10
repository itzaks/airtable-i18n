const fs = require('fs');
const path = require('path');
const Airtable = require('airtable');
const util = require('util');
const log = require('./log');

const getBase = (base) => (table) =>
  new Promise((res, rej) => {
    base(table)
      .select({
        maxRecords: 1000,
        view: 'Grid view',
      })
      .firstPage((err, records) => {
        if (err) return rej(err);
        res(records);
      });
  });

const handleRecord = (languages, table, record) => {
  table = table.toUpperCase();
  if (!languages[Object.keys(languages)[0]][table]) Object.keys(languages).forEach((key) => (languages[key][table] = {}));
  Object.keys(languages).forEach(key => (languages[key][table][record.get('key').toUpperCase().replace(/\s/g, '_')] = record.get(key)));
};

const parse = async (apiKey, baseId) => {
  log('Contacting Airtable', '🔍', 2, 4);
  const base = new Airtable({ apiKey }).base(baseId);
  const records = getBase(base);
  
  const tables = (await records('TABLES')).map((record) => record.get('name'));
  const meta = await records('Lng');
  const fields = { ...meta[0].fields };
  
  delete fields.key;
  const languageKeys = Object.keys(fields);
  
  const languages = languageKeys.reduce((acc, key) => ({ ...acc, [key]: {} }), {});
  
  meta.forEach((record) => handleRecord(languages, 'lng', record));
  log('Retreiving translation', '🚡', 3, 4);
  
  await Promise.all(tables.map(async (table) => (await records(table)).forEach((record) => handleRecord(languages, table, record))));
  return languages;
};

const createFile = (filepath, format, content, beautify = false) => new Promise((res) => {
  const data = { current: '' };
  if (format === 'json') data.current = JSON.stringify(content, null, beautify ? 2 : 0)
  else if (format === 'js') data.current = `module.exports = ${util.inspect(content)}`;
  fs.writeFile(`${filepath}.${format}`, data.current, { encoding: 'utf8' }, res)
})

const generate = async (languages, dir, beautify = false, format = 'js') => {
  const dirPath = path.resolve(dir);
  if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });

  Promise.all(Object.keys(languages).map(key => createFile(`${dirPath}/${key}`, format, languages[key], beautify)));
  log('Writing files', '🖊', 4, 4);
};

const generateTranslation = async (apikey, baseId, { output = '.', beutify = false, format = 'js' }) => {
  const languages = await parse(apikey, baseId);
  generate(languages, output, beutify, format);
}

module.exports = {
  parse,
  generate,
  generateTranslation,
};
