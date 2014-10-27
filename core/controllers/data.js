/**
 * Google API client
 * @type {Object}
 */
var googleapis = require('googleapis');

/**
 * Async librairie
 * @type {Object}
 */
var async = require('async');

/**
 * File interface
 * @type {Object}
 */
var fs = require("fs");

/**
 * Path interface
 * @type {Object}
 */
var path = require("path");

/**
 * API Client
 * @type {Boolean}
 */
var client = false;

/**
 * Recorded dataset
 * @type {Array}
 */
module.exports.filieres = module.exports.lycees = [];

/**
 * @author Pirhoo
 *
 */
module.exports = function(app) {

  module.exports.lycees     = require("../data/lycees.json");
  module.exports.plusLycees = require("../data/plus-lycees.json");
  module.exports.cities     = require("../data/cities.json");

  return;
  // Get the two dataset
  async.parallel(
    {
      lycees: getLycees,
      plusLycees: getPlusLycees
    // Save the dataset as exportable values
    }, function(err, res) {
      if(err) return;
      if(res.lycees != null && res.lycees.length) {
        console.log(" ✔ 'Lycees' saved");
        module.exports.lycees  = res.lycees;
        var filename = path.join(__dirname, "../data/lycees.json");
        fs.writeFile(filename, JSON.stringify(res.lycees, null, 4) );
      }
      if(res.plusLycees != null && res.plusLycees.length) {
        console.log(" ✔ 'Plus lycees' saved");
        module.exports.plusLycees  = res.plusLycees;
        var filename = path.join(__dirname, "../data/plus-lycees.json");
        fs.writeFile(filename, JSON.stringify(res.plusLycees, null, 4) );
      }
    }
  );
};

/**
 * Get the lycées dataset
 * @param  {Function} callback Callback function
 */
var getLycees = module.exports.getLycees = function(callback) {
  console.log(" ⚫ 'Lycees' loading");
  getTable("1G5tXy-DRGrKgF-nXWEQ_LvxCboI1aLE6w0JuHok", callback);
};
/**
 * Get the "plus lycées" dataset
 * @param  {Function} callback Callback function
 */
var getPlusLycees = module.exports.getPlusLycees = function(callback) {
  console.log(" ⚫ 'Plus lycees' loading");
  getTable("1hQJkpIB-nbiKBLTgGkgHwwJH1QGGmG5hTpQzDwE", callback);
};


/**
 * Get a table
 * @param  {String} key Fusion table key
 * @param  {Function} callback Callback function
 */
var getTable = module.exports.getTable = function(key, callback) {

  // Avoid callback fail
  callback = callback || function() {};
  // Google API key
  var API_KEY = 'AIzaSyBstMlh1qxkkJoFJ_-7sJh5H6lGG3t-w3o';
  // Googlefusion client
  var client = googleapis.fusiontables("v1");

  var query = [];
  query.push("SELECT * ");
  query.push("FROM " + escape(key));
  query.push("LIMIT 5002 ");

  // Creates a batch request
  client.query.sql({ auth: API_KEY, sql: query.join("\n") }, function(err, res) {
    // Spread the error
    if(res == null || res.rows == null || !res.rows.length) return callback(err, null);
    // For each rows in the given dataset
    for(var index in res.rows) {
      // Transforms the array of data into an object according the columns' names
      res.rows[index] = objectify(res.rows[index], res.columns);
    }
    // Sends the dataset objectified
    return callback(null, res.rows);
  });

};

/**
 * Transform an array to an object following the given columns names
 * @param  {Array} row     Array to transform
 * @param  {Array} columns Fields names
 * @return {Object}        The array after transformation
 */
function objectify(row, fields) {

  var obj = {};

  // Fetchs the row
  for(var index in row) {
    // Slugify the name
    var slug = slugify(fields[index])
    // Record the value within the right field name
    obj[slug] = row[index];
  }

  return obj;
}

/**
 * Slugify the given string
 * @src http://dense13.com/blog/2009/05/03/converting-string-to-slug-javascript/
 * @param  {String} str String to slugify
 * @return {String}     String slugified
 */
function slugify(str) {

  str = str.replace(/^\s+|\s+$/g, ''); // trim
  str = str.toLowerCase();

  // remove accents, swap ñ for n, etc
  var from = "àáäâèéëêìíïîòóöôùúüûñç·/_,:;";
  var to   = "aaaaeeeeiiiioooouuuunc------";
  for (var i=0, l=from.length ; i<l ; i++) {
    str = str.replace(new RegExp(from.charAt(i), 'g'), to.charAt(i));
  }

  str = str.replace(/[^a-z0-9 -]/g, '') // remove invalid chars
           .replace(/\s+/g, '-') // collapse whitespace and replace by -
           .replace(/-+/g, '-'); // collapse dashes

  return str;
}