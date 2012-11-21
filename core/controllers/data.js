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

  // Create the fusiontable client
  googleapis.load('fusiontables','v1', function(err, c) {
    // No error
    if(err == null) {
      // Record the client
      client = c;
      // Sets API key
      client.setApiKey('AIzaSyALQzqhaM30UDeVoDQ8ZBAW2LAqVtNQKl8');    

      // Get the two dataset
      async.parallel(
        {
          lycees: getLycees,
          plusLycees: getPlusLycees
        // Save the dataset as exportable values
        }, function(err, res) {                  
          module.exports.lycees  = res.lycees;    
          module.exports.plusLycees  = res.plusLycees;          
        }
      );
    }
  });

};
 
/**
 * Get the lycées dataset
 * @param  {Function} callback Callback function 
 */
var getLycees = module.exports.getLycees = function(callback) {
  getTable("1G5tXy-DRGrKgF-nXWEQ_LvxCboI1aLE6w0JuHok", callback);
}; 
/**
 * Get the "plus lycées" dataset
 * @param  {Function} callback Callback function 
 */
var getPlusLycees = module.exports.getPlusLycees = function(callback) {
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

  // Checks the client
  if(!client) return callback({error: "No client available"}, null);
  var query = [];
  query.push("SELECT * ");
  query.push("FROM " + escape(key))
  //query.push("WHERE 'Code Nature UAI' NOT EQUAL TO '' ");
  query.push("LIMIT 5002 ");

  // Creates a batch request
  client
    .newBatchRequest()
    .add('fusiontables.query.sql', { sql: query.join("\n") })
    .execute(null, function(err, res, headers) {
      
      // Spread the error
      if(res == null || !res.length || res[0] == null) return callback(err, null);

      // For each rows in the given dataset
      for(var index in res[0].rows) {
        // Transforms the array of data into an object according the columns' names
        res[0].rows[index] = objectify(res[0].rows[index], res[0].columns);        
      }               

      // Sends the dataset objectified
      return callback(null, res[0].rows);

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