var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import * as fs from "fs";
import * as path from "path";
import Airtable from "airtable";
import { log } from "./log";
import _ from 'lodash';
const getBase = (base) => (table) => new Promise((res, rej) => {
    base(table)
        .select({
        maxRecords: 1000,
        view: "Grid view",
    })
        .firstPage((err, records) => {
        if (err)
            return rej(err);
        res(records);
    });
});
const handleRecord = (languages, table = "", record) => {
    const langKeys = Object.keys(languages);
    if (!languages[langKeys[0]][table])
        langKeys.forEach((key) => (languages[key][table] = {}));
    langKeys.forEach((key) => {
        const searchKey = (record.get("key") || "").replace(/\s/g, "_");
        languages[key][table][searchKey] = record.get(key);
    });
};
export const parse = (apiKey, baseId) => __awaiter(void 0, void 0, void 0, function* () {
    log("Contacting Airtable", "🔍", 2, 4);
    const base = new Airtable({ apiKey }).base(baseId);
    const records = getBase(base);
    const tableFetch = yield records("TABLES");
    const tables = tableFetch.map((record) => record.get("name"));
    const meta = yield records("Lng");
    const fields = Object.assign({}, meta[0].fields);
    delete fields.key;
    const languageKeys = Object.keys(fields);
    const languages = languageKeys.reduce((acc, key) => (Object.assign(Object.assign({}, acc), { [key]: {} })), {});
    meta.forEach((record) => handleRecord(languages, "lng", record));
    log("Retreiving translation", "🚡", 3, 4);
    yield Promise.all(tables.map((table) => __awaiter(void 0, void 0, void 0, function* () {
        const fields = yield records(String(table));
        fields.forEach((record) => handleRecord(languages, String(table), record));
    })));
    return languages;
});
const createFile = (filepath, content, beautify = false) => new Promise((res) => {
    let newObj = {};
    const keys = Object.keys(content);
    keys.forEach((key) => {
        newObj[key] = splitKeys(content[key]);
    });
    const data = {
        current: JSON.stringify(newObj, null, beautify ? 2 : 0)
    };
    fs.writeFile(`${filepath}.json`, data.current, { encoding: "utf8" }, res);
});
const splitKeys = (values) => {
    const keys = Object.keys(values);
    let returnObj = {};
    keys.forEach(key => {
        const value = values[key];
        _.set(returnObj, key, value);
    });
    console.log("RET", returnObj);
    return returnObj;
};
const splitter = (inputPath, value) => {
    const path = inputPath.split('.');
    let baseObj = {};
    console.log("split", inputPath, path);
    if (path.length == 1)
        return value;
    for (var i = 0; i < path.length; i++) {
        baseObj[path[i]] = splitter(path[i], value);
    }
    return baseObj;
};
export const generate = (languages, dir, beautify = false) => __awaiter(void 0, void 0, void 0, function* () {
    const dirPath = path.resolve(dir);
    if (!fs.existsSync(dirPath))
        fs.mkdirSync(dirPath, { recursive: true });
    log("Writing files", "🖊", 4, 4);
    yield Promise.all(Object.keys(languages).map((key) => createFile(`${dirPath}/${key}`, languages[key], beautify)));
});
export const generateTranslation = (apikey, baseId, { output = ".", beutify = false }) => __awaiter(void 0, void 0, void 0, function* () {
    const languages = yield parse(apikey, baseId);
    console.log("Langs", languages);
    generate(languages, output, beutify);
});
