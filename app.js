/**
 * @fileOverview Main application script that initialize and configure 
 * the Express Framework, the database ORM (sequelize), the multi-language
 * support, the configuration loader and the user authentification.
 *
 * Also, that script loads every controllers (from /core/controllers), 
 * data models (from /core/models) and custom missions (from /custom).
 *
 * @name app
 * @author  Pirhoo <pirhoo@jplusplus.org>
 */

/**
 * Express Framework
 * @type {Object}
 */
var express        = require('express')
/**
 * Filesystem manager
 * @type {Object}
 */
, fs             = require('fs')
/**
 * Less middle ware
 * @type {Object}
 */
, lessMiddleware = require("less-middleware")
/**
 * Environement configuration from 
 * a singleton instance of Config.
 *
 * The configurationfile is now accessible 
 * from global.NODE_CONFIG.
 * 
 * @type {Object}
 */
, config         = require("config")
/**
 * Memcached class to instanciate a memcached client
 * @type {Object}
 */
, memjs          = require('memjs')
/**
 * Authentification module  
 * @type {Object}
 */
, passport       = require("passport")
/**
 * Underscore librairie
 * @type {Object}
 */
, _ = require("underscore");


/**
 * @type {Object}
 */
var app = null;

/**
 * Loads all requires automaticly from a directory
 * @param  {String} dirname   Directory where look for the file
 * @param  {Object} where     Object where save the instances
 * @param  {Boolean} instance Should we instanciate each module ? 
 */
function loadAllRequires(dirname, where, instance) {  
  // Change the root of the directory to analyse following the given parameter
  var dir = dirname || __dirname;
  // Var to record the require
  where = typeof(where) === "object" ? where : {};
  
  // Grab a list of our route files/directories
  fs.readdirSync(dir).forEach(function(name){

    // Find the file path
    var path = dir + '/' + name
    // Query the entry
     , stats = fs.lstatSync(path)
    // Name simplitfy
     , slug  = name.replace(/(\.js)/, "");     

    // If it's a directory...
    if( stats.isDirectory() ) {
      // Recursive calling
      loadAllRequires(path, where, instance);      
    // If it's a regular file...
    } else {      
      // Require the module with app in parameter
      where[slug] = instance ? require(path)(app) : require(path);
    }
  });
}


/**
 * Boots the app
 * @return {Object} The app instance
 */
exports.boot = function(){

  // Creates Express server
  app = module.exports = express();   
  
  // Configuration
  app.configure(function(){
    
    app.set('views', __dirname + '/core/views');
    app.set('view engine', 'jade');
    
    /************************************
     * Client requests
     ************************************/  
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(express.cookieParser(config.salts.cookies));
    app.use(express.session());   

    // Less middle ware to auto-compile less files
    app.use(lessMiddleware({
      src: __dirname + '/core/public',
      // Compress the files
      compress: true
    }));

    // Public directory
    // This line must be above the passport binding
    // to avoid multiple Passport deserialization.
    app.use(express.static(__dirname + '/core/public'));


    /************************************
     * User authentification
     ************************************/ 

    // Authentification with passport
    app.use(passport.initialize());
    app.use(passport.session());  

    // Passport session setup.
    // To support persistent login sessions, Passport needs to be able to
    // serialize users into and deserialize users out of the session. Typically,
    // this will be as simple as storing the user ID when serializing, and finding
    // the user by ID when deserializing. However, since this example does not
    // have a database of user records, the complete Twitter profile is serialized
    // and deserialized.
    passport.serializeUser(function(user, done) {
      done(null, user);
    });

    passport.deserializeUser(function(obj, done) {
      done(obj);
    });


    /************************************
     * Views helpers
     ************************************/   
    // Register helpers for use in view's
    app.locals({    
      // Configuration variables
      config: config
    });

    app.use(function(req, res, next) {
      // Current user
      res.locals.user = req.user || false;
      // Register underscore
      res.locals._ = _;

      next();
    });

    /************************************
     * Cache client
     ************************************/    
    var memcachedOptions = {      
      username : config.memcached.username,
      password : config.memcached.password,
      expires  : config.memcached.expires
    }
    // Creates the memcached client
    app.memcached = new memjs.Client.create(config.memcached.servers, memcachedOptions);
    app.memcached.flush();

    /*****************************************
     * Models, views and mission encapsulation
     *****************************************/  
    app.controllers = {};
    // Load all controllers from the /controllers directory
    loadAllRequires(__dirname + "/core/controllers", app.controllers, true);

    /************************************
     * Configure router      
     ************************************/   
    // @warning Needs to be after the helpers
    app.use(app.router);

  });


  app.configure('development', function(){
    app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
  });

  app.configure('production', function(){
    app.use( express.errorHandler() );
  });


  return app;

};



/************************************
 * Creates the app and listen on
 * the default port.
 ************************************/  
exports.boot().listen(process.env.PORT || config.port, function(){
  console.log("Express server listening on port %d in %s mode", this.address().port, app.settings.env);
});
