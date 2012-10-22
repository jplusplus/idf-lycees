/**
 * Dataset helpers
 * @type {Object}
 */
var data = require("./data"),
/**
 * Fuzzy search
 * @type {Object}
 */
   fuzzy = require("fuzzy"),
/**
 * Underscore toolbelt
 * @type  {Object}
 */
       _ = require("underscore");

/**
 * @author Pirhoo
 * @description Home route binder
 *
 */
module.exports = function(app) {

	app.get('/', function(req, res){

    if(!data.lycees) return res.render('wait.jade');

	  res.render('index.jade', {      
      lycees       : getLycees(),
      filieres     : getFilieres(),
      sousFilieres : getSousFilieres()
    });
    
	});


  app.get('/filieres.json', function(req, res) {

    var list = getFilieres(); 

    if(req.query.filter) {
      // Field to use in the search
      var options = { extract: function(el) { return el["filiere-ppi"] + " / " + el["sous-filiere-ppi"]; } };
      // Fuzzy search
      list = fuzzy.filter(req.query.filter, list, options);
    }

    res.json(list);
  });

  app.get('/sous-filieres.json', function(req, res) {

    var list = getSousFilieres(); 

    if(req.query.filter) {
      // Field to use in the search
      var options = { extract: function(el) { return el["filiere-ppi"] + " / " + el["sous-filiere-ppi"]; } };
      // Fuzzy search
      list = fuzzy.filter(req.query.filter, list, options);
    }

    res.json(list);
  });


  app.get('/all.json', function(req, res) {    
    res.json(data.lycees || []);  
  });

  app.get('/lycees.json', function(req, res) {

    var list = getLycees(); 

    if(req.query.filter) {
      // Field to use in the search
      var options = { extract: function(el) { return el.nom; } };
      // Fuzzy search
      list = fuzzy.filter(req.query.filter, list, options);
    }

    res.json(list);    
  });

  app.get('/lycees/:uai.json', function(req, res) {    
    
    var lycee = _.find(getLycees(), function(d) { return d.uai == req.params.uai });

    if(lycee) {
      lycee.filieres = _.filter(data.lycees, function(d) { return d.uai == lycee.uai });      
      // lycee.sousFilieres = _.filter(data.lycees, function(d) { return d.uai == lycee.uai });           
      
      // Group by niveau
      lycee.filieres = _.groupBy(lycee.filieres, function(d) { return d["niveau"] });
      // For each niveau...
      _.each(lycee.filieres, function(niveau, key) {
        // ...group each niveau by filiere
        lycee.filieres[key] = _.groupBy(niveau, function(d) { return d["filiere-ppi"] });
      });
          

      res.json(lycee);
    } else {
      res.json(404, { "error" : "Not found" });
    }
  });

};

function getLycees() {
  // Avoids empty data set
  if(this.lycees && !this.lycees.length) this.lycees = false;
  // Loads the data once
  this.lycees = this.lycees || distinct( data.lycees, function(d) { return d["uai"] } );  
  // Remove some useless values
  _.each(this.lycees, function(lycee, key) {
    this.lycees[key] = _.omit(lycee, ["statut", "niveau", "filiere-ppi", "sous-filiere-ppi", "eff-scolaire-entrants-2011"]);
  });
  return this.lycees;
}

function getFilieres() {  
  // Avoids empty data set
  if(this.filieres && !this.filieres.length) this.filieres = false;  
  // Loads the data once
  this.filieres = this.filieres || distinct( data.lycees, function(d) { return d["filiere-ppi"] } );  
  // Sorts the list
  this.filieres = _.sortBy(this.filieres, "filiere-ppi"); 
  return this.filieres;
}

function getSousFilieres() {
  // Avoids empty data set
  if(this.sousFilieres && !this.sousFilieres.length) this.sousFilieres = false;
  // Loads the data once
  this.sousFilieres = this.sousFilieres || distinct( data.lycees, function(d) { return d["sous-filiere-ppi"] } );
  // Sorts the list
  this.sousFilieres = _.sortBy(this.sousFilieres, "sous-filiere-ppi"); 
  return this.sousFilieres;
}

function distinct(collection, map) {
  return _.map(
          _.groupBy(
            collection,
            map
          ),
          function(grouped){
            return grouped[0];
          }
        );
};