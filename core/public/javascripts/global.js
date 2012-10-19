new (function(window, undefined) {

  var that        = this;
  var tableMerged = '1tKbe33RbVG_gkB-FHlkVWPPtE6HQLAmOkYLwXMM';
  var apiKey      = 'AIzaSyALQzqhaM30UDeVoDQ8ZBAW2LAqVtNQKl8';

  // Shoud we show the lycee's statut on the map ?
  that.showStatut = false;

  that.askForReset = that.reset = function() {
    if( confirm("Recommencer la visite ?") ) {      
      // Close the existing infowindow
      that.closeInfobox();
      // Empty all inputs and trigger a change event (to reset some form's)
      $(":input").val("").trigger("change");
      // Show all markers
      that.initMarkerLayer();      
      // Open the first form
      that.el.$menu.find("fieldset").addClass("hidden").eq(0).removeClass("hidden");
      // Move to the first card
      that.goToCard(0);
    }
  };

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
            ids.push("'" + data[index].original.uai + "'");
        }
        
        that.initMarkerLayer(true, "UAI IN(" + ids.join(",") + ")");
      });
    }
  };

  /**
   * Submit the form placeFilter and update the map   
   */
  that.placeFilter = function(event) {
    event.preventDefault();

    // Gets the adresse
    var address = that.el.$placeFilter.find("[name=place]").val();
    // Geocode this adress
    that.geocoder.geocode( { 'address': address}, function(results, statut) {
      // If the geocoding succeed
      if (statut == google.maps.GeocoderStatus.OK) {
        // Looks for the points 5 km arround the center
        var where = "ST_INTERSECTS(Geo, CIRCLE( LATLNG" + results[0].geometry.location.toString() + ", 5000) )";
        that.getPoints(where, function(err, points) {
          points = points || [];
          if(points.length == 0) return alert('Aucun résultat trouvé');
          // Show all markers
          if(!that.allMarkers) that.initMarkerLayer(false);
          // Centers and zoom the maps
          that.map.setCenter(results[0].geometry.location);
          // Adapts the zoom following the number of points
          that.map.setZoom( 
            // Take a value > 12
            Math.max( 
              // Take a value < 16
              Math.min(
                16, 
                // Linear function following the points number
                ~~(10+(points.length/10)) 
              ), 
              12
            )
          );
        });
      } else {
        alert('Aucun résultat trouvé');
      }
    });
  };

  /**
   * Submit the form filiereFilter and update the map   
   */
  that.filiereFilter = function(event) {
    event.preventDefault();
    var $input = $(event.target);

    // DETERMINES THE SOUS-FILIERES OPTIONS
    if( $input.is("[name='filiere']") ) {
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
    }


    // TOGGLE THE NEXT SELECT BOX IF IT'S NOT EMPTY 
    // AND THE PREVIOUS ONE HAS A VALUE

    var disableNext = false;
    // Disabled every input after the first one that is empty
    that.el.$filiereFilter.find(":input").each(function(i, item) {
      var $this = $(this);
      // Determine if the current selectbox is empty
      // (empty means "no option available")
      var isEmpty = $this.is("select") && ! $this.find("option[value!='']").length,
       isDisabled = disableNext || isEmpty;
      // Disables and hides the current field
      $this.attr("disabled", isDisabled).parents(".row-fluid").toggleClass("hide", disableNext);            
      // Should we disabled the next field ?
      disableNext = isDisabled || $this.val() == "";
      // Toggle the reset button if it has no value
      $this.parents(".row-fluid").find(".reset").toggleClass("hide", $this.val() == "");
    });

    // POPULATE THE WHERE CLAUSE ACCORING THE FORM    
    // Gets the whole form's values
    var values = {};
    $.each( that.el.$filiereFilter.serializeArray(), function(i, field) {
      // Removes empty values
      if(field.value != "") values[field.name] = field.value;
    });

    // Should we show the lycee's statut ?
    that.showStatut = _.has(values, "filiere");

    // Adds the where condition following the field names
    var where = "";
    $.each(values, function(field, value) {

      switch(field) {  

        case "level":
          var addWhere = " 'Niveau' = '" + value + "' ";
          break;
                
        case "filiere":
          var addWhere = " 'Filière PPI' = '" + value + "' ";
          break;

        case "sous-filiere":
          var addWhere = " 'Sous Filière PPI' = '" + value + "' ";
          break;
      }

      // Are we adding a condition ?
      if(addWhere) {
        // Is there a condition yet ?
        where += where != "" ? " AND " + addWhere : addWhere
      }

    });
    
    // Load the marker 
    that.initMarkerLayer(true, where);

  };

  that.resetFilter = function(event) {
    var $parent = $(this).parents(".row-fluid");
    // Emtpy the current and trigger a "change" event
    $parent.find("select").val("").trigger("change");
  };

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
      //styles    : mapStyle,
      panControl: true,
      zoomControl: true,
      mapTypeControl: false,
      scaleControl: true,
      streetViewControl: false,
      overviewMapControl: false
    };

    // Creates the Map in the #map container with the above options
    that.map = new google.maps.Map( that.el.$map[0] , mapOptions);  
    // Creates the geocoder
    that.geocoder = new google.maps.Geocoder();
    // Add every markers on the map
    that.initMarkerLayer(true);
    
    // Close the infobox when we click on the map
    google.maps.event.addListener(that.map, 'click', that.closeInfobox);

  };


  that.getPoints = function(where, callback) {

    callback = callback || function() {};
    // Default where clause is empty
    where = where || "";
    // Create the request to get all Lycées
    var query = [];
    query.push("SELECT Geo, UAI, Statut, NOM, ADRESSE, 'Présence internat'");
    query.push("FROM " + tableMerged);
    // Avoid bad entries
    query.push("WHERE 'Code Nature UAI' NOT EQUAL TO ''");
    // query.push("AND UAI NOT EQUAL TO '0931827F'");
    
    // Conditional WHERE clause
    if(where != "") {
      query.push("AND " + where);
    }
    query.push("LIMIT 20000");

    // Create URL
    var url = 'https://www.googleapis.com/fusiontables/v1/query?callback=?',
    params  = {
      sql      : query.join("\n"),
      key      : apiKey
    };

    // Get the data
    $.getJSON(url, params, function(response, statut) {
      // No data
      if(statut != "success" || !response.rows) return callback({ error: statut }, null);      

      callback(null, response.rows); 
    });
  };


  /**
   * Insert the marker on the map
   * @param  {Boolean}   fitBound     Should we ajust the zoom and the pane to the markers ?
   * @param  {String}    where        Where clause string in the request
   * @param  {Function}  callback     Callback function
   */
  that.initMarkerLayer = function(fitBound, where, callback) {

    callback = callback || function() {};
    
    // Close the existing infowindow
    that.closeInfobox();

    // Ajust the zoom by default
    fitBound = typeof fitBound == "undefined" ? true : fitBound;
    // Default where clause is empty
    where = where || "";
    // To know if the map show every points or not
    that.allMarkers = (where == "");

    // Clear the marker only if we change the state
    that.clearMarkers();

    that.getPoints(where, function(err, points) {

      if(err != null || !points || !points.length) return callback({ error: err }, null);
            
      // To removes every marker doublon 
      var pts = [];

      // Fetch every line 
      for(var i in points) {         

        // Embedable data for the marker
        var lycee = {
               geo : points[i][0].split(" "), // Position array of the lycee
               uai : points[i][1],            // Unique ID of the lycee
            statut : points[i][2],            // The statut of the lycee (Scolaire or Apprentissage)
              name : points[i][3],            // The name of the lycee
              addr : points[i][4],            // The address of the lycee
          internat : points[i][5] == "oui",            // Is there an internat ?
          filieres : [ points[i][2] ]         // An array of the differents filieres statut
        };

        // The marker already exists
        if( typeof that.markers[lycee.uai] != "undefined" ) {
          // Add the filiere to the list
          that.markers[lycee.uai].lycee.filieres.push(lycee.statut);
          // Update the marker icon
          that.changeMarkerIcon( that.markers[lycee.uai] );          
        } else {
          // Create the marker
          that.addMarker(lycee);          
        }

      }      

      // Ajusts the zoom to the new markers
      if(fitBound) that.adjustMapZoom();

      callback(null, points);    
    });

  };

 

  that.addMarker = function(lycee) {

    if(lycee.geo[0] == 0 || lycee.geo[1] == 0) return;

    var marker = new google.maps.Marker({
      map      : that.map,
      icon     : that.getMarkerIcon(lycee.statut),
      position : new google.maps.LatLng(lycee.geo[0], lycee.geo[1]),
      visible  : that.isLyceeVisible(lycee),
      zIndex   : -1
    });

    // Saves some data into a lycee attribut
    marker.lycee = lycee;

    // Add the marker to the list of marker
    that.markers[lycee.uai] = marker;

    // Bind a function to the click on the marker
    google.maps.event.addListener(marker, 'click', that.markerClick);

    return marker;
  };

  that.isLyceeVisible = function(lycee) {
    return ! that.el.$hasInternat.is(":checked") || lycee.internat;
  };

  that.clearMarkers = function() { 
    
    if(typeof that.markers == "undefined") return that.markers = {};

    for( var key in that.markers ){           
      that.markers[key].setMap(null);
    }
    that.markers = {};
  };

  that.updateMarkersVisibility = function() {
    for( var key in that.markers ){           
      that.markers[key].setVisible( that.isLyceeVisible(that.markers[key].lycee) );
    }
  };

  /**
   * Event fired by a click on a marker (create an info box)
   * @src http://google-maps-utility-library-v3.googlecode.com/svn/tags/infobox/1.1.9/docs/reference.html
   */
  that.markerClick = function(event) {    

    var marker = this;

    // Content of the info box
    var infoboxContent = [];
    infoboxContent.push("<div class='row-fluid' id='infobox-lycee' data-uai='" +  marker.lycee.uai +"'>");  
      infoboxContent.push("<div class='span10'>");  
        infoboxContent.push("<h4>");
          infoboxContent.push(marker.lycee.name);
        infoboxContent.push("</h4>");        
        infoboxContent.push("<p>");
          infoboxContent.push(marker.lycee.addr);
        infoboxContent.push("</p>");
      infoboxContent.push("</div>");
      infoboxContent.push("<div class='span2'>"); 
         infoboxContent.push("<a class='btn btn-inverse btn-mini btn-block'>info</a>");
      infoboxContent.push("</div>");
    infoboxContent.push("</div>");

    var options = {
        content: infoboxContent.join(""),
        boxClass: "js-info-box",
        enableEventPropagation: false,
        maxWidth: 0,
        alignBottom: true,
        pixelOffset: new google.maps.Size(0, -20),
        zIndex: null,
        closeBoxURL: "",
        position: marker.position,
        pane: "floatPane" 
    };

    // Close the existing infowindow
    that.closeInfobox();
    // Create a new infobox with the options bellow
    that.infobox = new InfoBox(options);
    // Open the infobox related to the marker map
    that.infobox.open(marker.map);

    // Bing an event on the button when the domready event is fired on it
    google.maps.event.addListener(that.infobox,'domready',function(){         
      $("#infobox-lycee .btn").one("click touchend", that.openLycee);
    });

  };


  that.openLycee = function(event) {

    // Found the uai in the parent element that contains it
    var uai = $(this).parents("[data-uai]").data("uai");

    // Toggle the infobox state
    var $infobox = $(that.infobox.div_);
    $infobox.addClass("js-open").css("max-height", $infobox.find("h4").height() );
    
    // Load the lycee
    $.getJSON("/lycees/" + uai + ".json", function(data) {
      // Compile the template with the lycee
      var html = that.templates.lycee({ lycee: data });
      // Populate the second card with the lycee
      that.el.$menu.find(".card:eq(1) .lycee").html(html);
      // Scroll to the lycee's fiche
      that.goToCard(1);
    });

    return false;
  }

  that.changeMarkerIcon = function(marker) {

    var isDoubleIcon = statut = false;

    // Look for the statut changes
    for(var i=0; i < marker.lycee.filieres.length && !isDoubleIcon; i++) {
      // Are we now in "double icon" mode ?
      isDoubleIcon = statut != false && marker.lycee.filieres[i] != statut;
      // Do the statut change ?
      statut       = marker.lycee.filieres[i] != statut ? marker.lycee.filieres[i] : statut; 
    }

    // Set statut to true if we switch to the doubleIconMode
    if(isDoubleIcon) statut = "Double";
    // Changes the statut
    marker.setIcon( that.getMarkerIcon(statut) );

  };


  that.getMarkerIcon = function(statut) {

    var iconClassic = "http://maps.gstatic.com/mapfiles/ridefinder-images/mm_20_white.png",
       iconScolaire = "http://maps.gstatic.com/mapfiles/ridefinder-images/mm_20_blue.png",
        iconApprent = "http://maps.gstatic.com/mapfiles/ridefinder-images/mm_20_yellow.png",
         iconDouble = "http://maps.gstatic.com/mapfiles/ridefinder-images/mm_20_green.png";

    if(!that.showStatut) return iconClassic;

    switch(statut) {
      
      case "Scolaire":
        return iconScolaire;
        break;

      case "Apprentissage":
        return iconApprent;
        break;

      default:
        return iconDouble;
        break;
    }

  };

  that.closeInfobox = function(event) {        
    // Close existing infobox    
    if(that.infobox) that.infobox.close();    
  };

  that.adjustMapZoom = function() {       

    var bounds = new google.maps.LatLngBounds();

    for( var key in that.markers ){           
      bounds.extend( that.markers[key].getPosition() );            
    }    

    // Fit the map according to the overlay just if we have more than 0 zero marker 
    that.map.fitBounds(bounds);
  };

  that.goToCard = function(index) {
    that.el.$menu.scrollTo(".card:eq(" + index + ")", 600);
  }

  that.initElements = function() {
    that.el = {
      $map            : $("#map"),
      $menu           : $("#menu"),
      $lyceeFilter    : $("#lyceeFilter"),
      $placeFilter    : $("#placeFilter"),
      $filiereFilter  : $("#filiereFilter"),
      $hasInternat    : $(":input[name=hasInternat]")
    };
  };  

  that.initEvents = function() {

    // Trigger the reset function when the user goes idle after 5 minutes
    $.idleTimer(1000*5*60);        
    $(document).bind("idle.idleTimer", that.askForReset);

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
    that.el.$filiereFilter.on("click touchend", ".reset", that.resetFilter);
    that.el.$menu.on("click touchend", ".back", function() { that.goToCard(0) });
    that.el.$hasInternat.on("change", that.updateMarkersVisibility);

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

  });


})(window);