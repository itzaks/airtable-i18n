import * as util from "util";
import * as fs from "fs";
import * as path from "path";
import Airtable, { Base, FieldSet, Records } from "airtable";
import {log} from "./log";
import _ from 'lodash'


const getBase = (base: Base) => (table: string): Promise<Records<FieldSet>
> =>
  new Promise((res, rej) => {
    base(table)
      .select({
        maxRecords: 1000,
        view: "Grid view",
      })
      .firstPage((err, records) => {
        if (err) return rej(err);
        res(records);
      })
  })

const handleRecord = (languages, table = "", record) => {
  const langKeys = Object.keys(languages)

  if (!languages[langKeys[0]][table])
    langKeys.forEach((key) => (languages[key][table] = {}));

  langKeys.forEach((key) => {
    const searchKey = (record.get("key") || "").replace(/\s/g, "_")
    languages[key][table][searchKey] = record.get(key)
  });
};

export const parse = async (apiKey: string, baseId: string) => {
  log("Contacting Airtable", "🔍", 2, 4);
  const base = new Airtable({ apiKey }).base(baseId);
  const records = getBase(base)

  const tableFetch = await records("TABLES")

  const tables = tableFetch.map((record) => record.get("name"));
  const meta = await records("Lng");
  const fields = { ...meta[0].fields };

  delete fields.key;
  const languageKeys = Object.keys(fields);

  const languages = languageKeys.reduce((acc, key) => ({ 
    ...acc, 
    [key]: {} 
  }), {})

  meta.forEach((record) => handleRecord(languages, "lng", record));

  log("Retreiving translation", "🚡", 3, 4);

  await Promise.all(
    tables.map(async (table) => {
      const fields = await records(String(table))
      fields.forEach((record) => handleRecord(languages, String(table), record))
    })
  )
  return languages
};

const createFile = (filepath, content: object, beautify = false) =>
  new Promise((res) => {
    let newObj = {}
    const keys = Object.keys(content)

    keys.forEach((key) => {
      newObj[key] = splitKeys(content[key])
    })

    const data = { 
      current: JSON.stringify(newObj, null, beautify ? 2 : 0)
    }

    fs.writeFile(`${filepath}.json`, data.current, { encoding: "utf8" }, res)
  })


const splitKeys = (values: Record<string, string>) => {
  const keys = Object.keys(values)
  let returnObj = {}
  keys.forEach(key => {
    const value = values[key]
    _.set(returnObj, key, value)
  })

  console.log("RET", returnObj)

  return returnObj
}

const splitter = (inputPath: string, value: string) => {
  const path = inputPath.split('.')
  let baseObj = {}

  console.log("split", inputPath, path)

  if(path.length == 1)
    return value

  for (var i = 0; i < path.length; i++) {
    baseObj[path[i]] = splitter(path[i], value)
  }

  return baseObj
}

export const generate = async (languages, dir, beautify = false) => {
  const dirPath = path.resolve(dir);
  if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });

  log("Writing files", "🖊", 4, 4);
  await Promise.all(
    Object.keys(languages).map((key) =>
      createFile(`${dirPath}/${key}`, languages[key], beautify)
    )
  )
}

export const generateTranslation = async (apikey, baseId, { output = ".", beutify = false }) => {
  const languages = await parse(apikey, baseId);
  console.log("Langs", languages)
  generate(languages, output, beutify)
}