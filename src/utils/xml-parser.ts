const xml2js = require('xml2js');

const parser = new xml2js.Parser({
  explicitArray: false
});

export class XmlParser {
  static parse(rawXml) {
    return new Promise((resolve, reject) => {
      parser.parseString(rawXml, (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
  }
}