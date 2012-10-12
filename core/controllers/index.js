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
	  res.render('index.jade', {      
      lycees:   data.lycees,
      filieres: data.filieres
    });
	});


  app.get('/filieres.json', function(req, res) {

    var list = data.filieres;

    if(req.query.filter) {
      // Field to use in the search
      var options = { extract: function(el) { return el["filiere-ppi"] + " / " + el["sous-filiere-ppi"]; } };
      // Fuzzy search
      list = fuzzy.filter(req.query.filter, list, options);
    }

    res.json(list);
  });

  app.get('/lycees.json', function(req, res) {

    var list = data.lycees;

    if(req.query.filter) {
      // Field to use in the search
      var options = { extract: function(el) { return el.nom; } };
      // Fuzzy search
      list = fuzzy.filter(req.query.filter, list, options);
    }

    res.json(list);    
  });

};