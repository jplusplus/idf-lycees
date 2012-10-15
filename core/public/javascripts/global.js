new (function(window, undefined) {

  var that = this;
  var tableLyceesId = '1ljq-Vv1v3n903P29q4gR6VvmHSljiT-78Bz72W0',
    tableFilieresId = '1CCsbIRHaNNlxZ1UFqESl-zW9wlbS8IbP_IqfHGQ';

  /**
   * Submit the form lyceeFilter and update the map   
   */
  that.lyceeFilter = function(event) {
    event.preventDefault();
    if(event.type == "submit") return;

    var filter = that.el.$lyceeFilter.find("[name=lycee]").val();
    if(filter != "") {
      $.getJSON("/lycees.json", { filter : filter }, function(data) {

        var ids = [];
        for(var index in data) {
          if( data[index].score > 10 )
            ids.push("'"+data[index].original.uai+"'");
        }
        
        that.initMarkerLayer(true, "UAI IN(" + ids.join(",") + ")");
      });
    } else {
      that.initMarkerLayer();
    }
  };

  /**
   * Submit the form placeFilter and update the map   
   */
  that.placeFilter = function(event) {
    event.preventDefault();
    // Show all markers
    if(!that.allMarkers) that.initMarkerLayer(false);

    // Gets the adresse
    var address = that.el.$placeFilter.find("[name=place]").val();
    // Geocode this adress
    that.geocoder.geocode( { 'address': address}, function(results, status) {
      // If the geocoding succeed
      if (status == google.maps.GeocoderStatus.OK) {
        // Centers and zoom the maps
        that.map.setCenter(results[0].geometry.location);
        that.map.setZoom(10);
      } else {
        alert('Geocode was not successful for the following reason: ' + status);
      }
    });
  };

  /**
   * Submit the form filiereFilter and update the map   
   */
  that.filiereFilter = function(event) {
    event.preventDefault();

    var disableNext = false;
    // Disabled every input after the first one that is empty
    that.el.$filiereFilter.find(":input").each(function(i, item) {
      $(this).attr("disabled", disableNext).parents(".row-fluid").toggleClass("hide", disableNext);      
      disableNext = disableNext || $(this).val() == "";
    });

    // Current selected filiere
    var filiere       = that.el.$filiereFilter.find(":input[name='filiere']").val();
    // Sous-filiere select box
    var $sousFilieres = that.el.$filiereFilter.find(":input[name='sous-filiere']");  
    // An empty option for default value
    var $emptyOption  = $("<option>").attr("value", "").html("--")  

    // Backup the sous-filieres list of options
    that.$sousFilieresOptions = that.$sousFilieresOptions || $sousFilieres.find("option").clone();    
    // Filters every useless sous-filieres option
    var $newOptions = that.$sousFilieresOptions.filter("[data-filiere='" + filiere  + "'][value!='']");
    // Add an empty option
    $sousFilieres.empty().append( $emptyOption.clone() );
    // Restore the sous-filieres
    if( $newOptions.length ) $sousFilieres.append( $newOptions );
  };

  that.resetFilter = function(event) {
    $(this).parents(".row-fluid").find("select").val("").trigger("change");
  }

  /**
   * Load and pre-compile the jade templates files
   */
  that.initTemplates = function() {
    that.templates = {};

        var dir = "/templates/",
      templates = {"lycee":"lycee.jade"},
    jadeOptions = {};

    for(var key in templates) {
      $.get(dir + templates[key], function(data) {
        that.templates[key] = jade.compile(data, jadeOptions);
      });
    }
  };


  /**
   * Create the map, init the first markers and the geocoder   
   */
  that.initMaps = function() {

    // Defines the map style
    var mapStyle =  [
      {              
        featureType: 'all',
        stylers: [
          {saturation: -90},
          {gamma: 1}
        ]
      }
    ];

    // Defines the map options
    var mapOptions = {
      center    : new google.maps.LatLng(48.850258, 2.647705),
      zoom      : 10,
      mapTypeId : google.maps.MapTypeId.ROADMAP,
      styles    : mapStyle
    };

    // Creates the Map in the #map container with the above options
    that.map = new google.maps.Map( that.el.$map[0] , mapOptions);  
    // Creates the geocoder
    that.geocoder = new google.maps.Geocoder();
    // Add every markers on the map
    that.initMarkerLayer(true);
  };

  /**
   * Insert the marker on the map
   * @param  {Boolean} fitBound Should we ajust the zoom and the pane to the markers ?
   * @param  {String}  where    Where clause string in the request
   */
  that.initMarkerLayer = function(fitBound, where) {

    // Ajust the zoom by default
    fitBound = typeof fitBound == "undefined" ? true : fitBound;
    // Default where clause is empty
    where = where || "";
    // To know if the map show every points or not
    that.allMarkers = (where == "");

    // Clear the marker only if we change the state
    that.clearMarkers();

    // Create the request to get all Lycées
    var queryText = "SELECT Geocode(Geo), UAI FROM " + tableLyceesId + (where != "" ? " WHERE " + where : "");
    // Create URL
    var url = 'https://www.googleapis.com/fusiontables/v1/query?callback=?',
    params  = {
      sql      : queryText,
      key      : "AIzaSyAm9yWCV7JPCTHCJut8whOjARd7pwROFDQ"
    };

    // Get the data
    $.getJSON(url, params, function(response, status) {

      // No data
      if(status != "success" || !response.rows) return;
      // Fetch every line 
      for(var i in response.rows) {                     
        // Get the geocode
        var geo = response.rows[i][0].split(" "),
         marker = that.addMarker(geo, response.rows[i][1] );

        // Saves the marker id
        if(marker) marker.uai = response.rows[i][1];
      }

      if(fitBound) that.adjustMapZoom();
    });

  };



  that.addMarker = function(geo, id) {

    if(geo[0] == 0 || geo[1] == 0) return;

    var marker = new google.maps.Marker({
      map:that.map,
      icon: "http://cdn1.iconfinder.com/data/icons/splashyIcons/marker_rounded_grey_4.png",
      position: new google.maps.LatLng(geo[0], geo[1])
    });

    // Add the marker to the list of marker
    that.markers.push(marker);
    // Bind a function to the click on the marker
    google.maps.event.addListener(marker, 'click', that.markerClick);

    return marker;
  };

  that.clearMarkers = function() { 
    
    if(typeof that.markers == "undefined") return that.markers = [];

    for( var key in that.markers ){           
      that.markers[key].setMap(null)
    }
    that.markers = [];
  };

  that.markerClick = function() {
    // Load the lycee
    $.getJSON("/lycees/" + this.uai + ".json", function(data) {
      // Compile the template with the lycee
      var html = that.templates.lycee({ lycee: data });
      // Populate the second card with the lycee
      that.el.$menu.find(".card:eq(1) .lycee").html(html);
      // Scroll to the lycee
      that.el.$menu.scrollTo(".card:eq(1)", 600);
    });
  };

  that.adjustMapZoom = function() {       

    var bounds = new google.maps.LatLngBounds();

    for( var key in that.markers ){           
      bounds.extend( that.markers[key].getPosition() );            
    }    

    // Fit the map according to the overlay just if we have more than 0 zero marker 
    that.map.fitBounds(bounds);
  };


  that.initElements = function() {
    that.el = {
      $map            : $("#map"),
      $menu           : $("#menu"),
      $lyceeFilter    : $("#lyceeFilter"),
      $placeFilter    : $("#placeFilter"),
      $filiereFilter  : $("#filiereFilter")
    };
  };

  that.initEvents = function() {

    // Toggle the forms
    that.el.$menu.on("click", "legend", function() {
      var $fieldset = $(this).parents("fieldset");
      // Toggle the current fieldset      
      $fieldset.toggleClass("hidden");
      // Close the others in this card
      $(this).parents(".card").find("fieldset").not( $fieldset ).addClass("hidden");
    });

    // Submit filter forms
    that.el.$lyceeFilter.on("change submit", that.lyceeFilter);
    that.el.$placeFilter.on("submit", that.placeFilter);
    that.el.$filiereFilter.on("change", that.filiereFilter);
    that.el.$filiereFilter.on("click", ".reset", that.resetFilter);
    that.el.$menu.on("click", ".back", function() { that.el.$menu.scrollTo(".card:eq(0)", 600) });

    // No scroll, anywhere
    $('body').bind("touchmove", {}, function(event){
      event.preventDefault();
    });

    // Get all lycées to setup the autocomplete
    $.getJSON("/lycees.json", function(data) {

      // Puts every lycee in an array of string
      for(var index in data) {
        data[index].slug = slugify(data[index].nom);
      }

      that.lyceesList = data;
      
      // Setup the autocomplete with the array of string as data source
      that.el.$lyceeFilter.find(":input[name=lycee]").typeahead({
        // The data source to use
        source: function(txt, callback) {
          // Slugify the search
          txt = slugify(txt);
          // Fuzzy search with the slug on the lycee list
          var res = $(that.lyceesList).map(function(i,lycee){ 
            // In case of match, returns the lycee's name
            if(lycee.slug.toLowerCase().indexOf(txt.toLowerCase())!=-1){ return lycee.nom } 
          }).get();
          // Return the data source filtered
          callback(res);
        },
        // Accepts every data (already filtered by the source function)
        matcher: function() { return true },
        // Disable hiligth
        highlighter: function(item) { return item }
      });

    });

    

  };

  
  $(that.init = function() {          
    
    that.initElements();
    that.initEvents();  
    that.initTemplates();  
    that.initMaps();



    /*
    // Create the request to get all Lycées
    var queryText = [];
    queryText.push('SELECT * ');
    queryText.push("FROM " + tableFilieresId + " AS filieres");
      queryText.push("LEFT OUTER JOIN " + tableLyceesId + " AS lycees");
        queryText.push("ON filieres.UAI = lycees.UAI");        
    queryText.push('WHERE lycees.ACA = "Paris" ');

    

    console.log(queryText.join("\n"));

    // Create URL
    var url = 'https://www.googleapis.com/fusiontables/v1/query?callback=?',
    params  = {
      sql      : queryText.join(" "),
      key      : "AIzaSyAm9yWCV7JPCTHCJut8whOjARd7pwROFDQ"
    };

    // Get the data
    $.getJSON(url, params, function(response, status) {
      console.log(response);
      // No data
      if(status != "success" || !response.rows) return;
      console.log(response.rows[0]);
      // Fetch every line 
      for(var i in response.rows) {                     
        // Get the geocode
        var geo = response.rows[i][0].split(" ");
      }

    });
     */

  });


})(window);