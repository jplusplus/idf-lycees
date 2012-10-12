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

    data.filieres = data.filieres || [];		

    // Select distinct filieres
    var filieres =  distinct(
                      data.filieres,
                      function(doc) {
                        return doc["filiere-ppi"];
                      }
                    );

    // Select distinct sous-filieres
    var sousFilieres =  distinct(
                          data.filieres,
                          function(doc) {
                            return doc["sous-filiere-ppi"];
                          }
                        );

	  res.render('index.jade', {      
      lycees:   data.lycees,
      sousFilieres: sousFilieres,
      filieres: filieres
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

  app.get('/lycees/:uai.json', function(req, res) {
    var lycee = _.find(data.lycees, function(doc) { return doc.uai == req.params.uai });
    if(lycee) {
      lycee.filieres = _.filter(data.filieres, function(doc) { return doc.uai == lycee.uai })
      res.json(lycee);
    } else {
      res.json(404, { "error" : "Not found" });
    }
  });

};

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