var a = new (function(window, undefined) {

  var that        = this;
  var tableMerged = '1G5tXy-DRGrKgF-nXWEQ_LvxCboI1aLE6w0JuHok';
  var apiKey      = 'AIzaSyALQzqhaM30UDeVoDQ8ZBAW2LAqVtNQKl8';

  // Shoud we show the lycee's statut on the map ?
  that.showStatut = false;

  /**
   * Submit the form lyceeFilter and update the map   
   */
  that.lyceeFilter = function(event) {
    
    if(_.isObject(event) ) {

      event.preventDefault();
      var filter = that.el.$lyceeFilter.find("[name=lycee]").val();

    } else {
      // We received the value directly
      var filter = event;      
    }

    if(filter != "") {

      that.resetForm();

      $.getJSON("/lycees.json", { filter : filter }, function(data) {

        var ids = [];
        for(var index in data) {
          if( data[index].score > 10 )
            ids.push(data[index].original.uai);
        }
        
        if(!ids.length) return that.openPopup("#noResultAlert");

        that.initMarkerLayer(true, {"uai": ids});
      });

    // Show all markers
    } else that.initMarkerLayer(true);    

    return event
    
  };

  /**
   * Submit the form placeFilter and update the map   
   */
  that.placeFilter = function(event) {
    
    if(_.isObject(event) ) {
      event.preventDefault();    
      // Gets the adresse
      var address = that.el.$placeFilter.find("[name=place]").val();
    } else {
      var address = event;
    }

    // Show all markers 
    if(address == "") return that.initMarkerLayer(true);

    // Geocode this adress
    that.geocoder.geocode( { 'address': address +", FRANCE"}, function(results, statut) {      
      // If the geocoding succeed
      if (statut == google.maps.GeocoderStatus.OK) {

        // Show all markers
        if(!that.allMarkers) that.initMarkerLayer(false);

        var position = results[0].geometry.location;

        // Looks for the points 5 km arround the center
        var where = "ST_INTERSECTS(Geo, CIRCLE( LATLNG" + position.toString() + ", 40000) )";
        
        that.getPointsFromGFT(where, function(err, points) {              

          points = points || [];
          //if(points.length == 0) return that.openPopup("#noAddrAlert");
          // Show all markers
          if(!that.allMarkers) that.initMarkerLayer(false);
          // Centers and zoom the maps
          that.map.setCenter(position);
          // Add a pointer to the user's adresse
          that.addUserPlaceMarker(position);
          // Adapts the zoom following the number of points
          that.map.setZoom( 
            // Take a value > 8
            Math.max( 
              // Take a value < 13
              Math.min(
                13, 
                // Linear function following the points number
                ~~(8+(points.length/10)) 
              ), 
              12
            )
          );
        }); 
      } else {
        that.openPopup("##noAddrAlert");
      }
    });

    return event;
  };

  that.addUserPlaceMarker = function(latLng) {
    // Do not add the marker twice
    that.removeUserPlaceMarker();
    that.placeMarker = new google.maps.Marker({
      map       : that.map,
      icon      : "data:image/png;base64,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",
      position  : latLng,
      animation : google.maps.Animation.DROP,
      zIndex    : 10
    });
  };

  that.removeUserPlaceMarker = function() {
    if(that.placeMarker) {    
      that.placeMarker.setMap(null);
      delete that.placeMarker;
    }
  }

  /**
   * Submit the form filiereFilter and update the map   
   */
  that.filiereFilter = function(event) {
    event.preventDefault();

    var $input = $(event.target);
    // DETERMINES THE SOUS-FILIERES OPTIONS
    if( $input.is("[name='filiere-ppi']") ) {
      // Current selected filiere
      var filiere       = that.el.$filiereFilter.find(":input[name='filiere-ppi']").val();
      // Sous-filiere select box
      var $sousFilieres = that.el.$filiereFilter.find(":input[name='sous-filiere-ppi']");  
      // An empty option for default value
      var $emptyOption  = $("<option>").attr("value", "").html("Choisissez...")  

      // Backup the sous-filieres list of options
      that.$sousFilieresOptions = that.$sousFilieresOptions || $sousFilieres.find("option").clone();    
      // Filters every useless sous-filieres option
      var $newOptions = that.$sousFilieresOptions.filter("[data-filiere='" + filiere  + "'][value!='']");
      // Add an empty option
      $sousFilieres.empty().append( $emptyOption.clone() );
      // Restore the sous-filieres
      if( $newOptions.length ) $sousFilieres.append( $newOptions );
    }

    // Toggle the next select box if it's not empty 
    // and the previous one has a value
    var values = that.updateFiliereInputs();

    // Load the marker, the values are the constraints
    that.initMarkerLayer(true, values, function(err, p) {
      // Keeps onlye the visible points
      p = _.filter(p, function(l) { return that.isLyceeVisible(l) });
      // Show an error message
      if(err != null || p.length == 0 ) that.openPopup("#noResultAlert");
    });
  };

  that.updateFiliereInputs = function() {

    var disableNext = false;
    // Disabled every input after the first one that is empty
    that.el.$filiereFilter.find(":input").each(function(i, item) {
      var $this = $(this);
      // Determine if the current selectbox is empty
      // (empty means "no option available")
      var isEmpty = $this.is("select") && ! $this.find("option[value!='']").length,
       isDisabled = disableNext || isEmpty;
      // Disables and hides the current field
      $this.attr("disabled", isDisabled).parents(".row-fluid").toggleClass("disabled hide", isDisabled);            
      // Toggle the reset button if it has no value
      $this.parents(".row-fluid").find(".reset").toggleClass("hide", $this.val() == "");
      // Should we disabled the next field ?
      disableNext = isDisabled || $this.val() == "";
    });

    // Populate the where clause accoring the form    
    // Gets the whole form's values
    var values = {};
    $.each( that.el.$filiereFilter.serializeArray(), function(i, field) {
      // Removes empty values
      if(field.value != "") values[field.name] = field.value;
    });

    // Should we show the lycee's statut ?
    that.showStatut = _.has(values, "filiere-ppi");
    that.el.$menu.toggleClass("with-legend", that.showStatut);

    return values;
  };

  that.resetFilter = function(event) {
    var $parent = $(this).parents(".row-fluid");
    // Emtpy the current and trigger a "change" event
    $parent.find("select").val("").trigger("change");
  };

  /**
   * Load and pre-compile the jade templates files
   */
  that.initTemplates = function(callback) {

    callback = callback || function() {};
    that.templates = {};

        var dir = "/templates/",
      templates = {"lycee":"lycee.jade", "infobox":"infobox.jade"},
    jadeOptions = {},
        tplLeft = 2; // Number of template

    for(var key in templates) {

      $.ajax(dir + templates[key],
            {
              context: { key: key }, 
              dataType:"text", 
              success: function(data) {        
                that.templates[this.key] = jade.compile(data, jadeOptions);
                if(--tplLeft == 0) callback();
              }
            }
          );
    }
  };


  /**
   * Create the map, init the first markers and the geocoder   
   */
  that.initMaps = function() {

    // Defines the map style
    var mapStyle = [ 
                    { "featureType": "road", "elementType": "geometry.fill", "stylers": [ { "color": "#ffffff" } ] },
                    { "featureType": "road", "elementType": "geometry.stroke", "stylers": [ { "color": "#c4c4c8" } ] },
                    { "featureType": "road.highway", "elementType": "labels", "stylers": [ { "visibility": "off" } ] },
                    { "featureType": "road", "elementType": "labels.text.stroke", "stylers": [ { "color": "#ffffff" } ] },
                    { "featureType": "road.arterial", "elementType": "labels.icon", "stylers": [ { "visibility": "off" } ] },
                    { "featureType": "poi", "elementType": "labels", "stylers": [ { "visibility": "off" } ] },
                    { "featureType": "administrative", "elementType": "labels.text.fill", "stylers": [ { "color": "#4d4d4d" } ] },
                    { "featureType": "landscape.man_made", "stylers": [ { "color": "#e9e9ee" } ] },
                    { "featureType": "landscape.natural", "stylers": [ { "color": "#f6f6f8" } ] },
                    { "featureType": "transit.station.airport", "stylers": [ { "color": "#c4c4c8" } ] },
                    { "featureType": "poi", "stylers": [ { "color": "#c4c4c8" } ] },
                    { "featureType": "poi.park", "stylers": [ { "color": "#d7e0be" } ] },
                    { "featureType": "transit.line", "elementType": "geometry", "stylers": [ { "color": "#a0a0a0" } ] },
                    { "featureType" : "transit", "stylers" : [ { "visibility" : "off" } ] }
                   ];

    // Defines the map options
    var mapOptions = {
      center    : new google.maps.LatLng(48.856583,2.3510745),
      zoom      : 9,
      minZoom   : 8,
      maxZoom   : 14,
      mapTypeId : google.maps.MapTypeId.ROADMAP,
      styles    : mapStyle,
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
    that.initMarkerLayer(false);
    
    // Close the infobox when we click on the map
    google.maps.event.addListener(that.map, 'click', that.closeInfobox);

  };

  /**
   * Send a SQL query to Google Fusion Table to extract points
   * @param  {String}   where    The additional where clause
   * @param  {Function} callback The callback function
   */
  that.getPointsFromGFT = function(where, callback) {

    callback = callback || function() {};
    // Default where clause is empty
    where = where || "";
    // Create the request to get all Lycées
    var query = [];
    query.push("SELECT Latitude, Longitude, UAI, Statut, NOM, ADRESSE, 'Présence internat'");
    query.push("FROM " + tableMerged);
    // Avoid bad entries
    // query.push("WHERE 'Code Nature UAI' NOT EQUAL TO ''");
    query.push("WHERE Latitude NOT EQUAL TO '#N/A' ");
    
    // Conditional WHERE clause
    if(where != "") {
      query.push("AND " + where);
    }

    // Create URL
    var url = 'https://www.googleapis.com/fusiontables/v1/query?callback=?',
    params  = {
      sql      : query.join("\n"),
      key      : apiKey
    };

    // Get the data
    $.getJSON(url, params, function(response, statut) {

      // No data
      if(statut != "success") return callback({ error: statut }, null);      

      callback(null, response.rows); 
    });
  };

  /**
   * Extract the points from the server or the cache
   * @param  {Object}   where    Filter constraints   
   * @param  {Function} callback Callback function
   */
  that.getPointsFromServer = function(where, callback) {

    callback = callback || function() {};
    // Default where clause is empty
    where = where || {};      

    // if the points was already loader
    if( that.allPoints ) return callback(null, that.filterPoints(where, that.allPoints) );

    // Get the data
    $.getJSON("/all.json", function(data) {      
      // No data
      if(!data) return filter({ error: "Error getting points" }, null);      
      // Save all points
      that.allPoints = data;
      // Callback function with filtered points
      callback(null, that.filterPoints(where, data) ); 
    });

  };

  that.filterPoints = function(where, points) {
    // The UAI property should be an array.
    // That means we have to filter every possibilities.
    if( _.isArray(where.uai) ) {      
      // Filter the points with a special clause
      points = _.filter(points, function(p) {            
        return where.uai.indexOf(p.uai) > -1;
      });        
      // delete the useless property
      delete where.uai;
    }
    return _.isEmpty(where) ? points : _.where(points, where);
  };

  /**
   * Insert the marker on the map
   * @param  {Boolean}   fitBound     Should we ajust the zoom and the pane to the markers ?
   * @param  {Object}    where        Where clause in the request
   * @param  {Function}  callback     Callback function
   */
  that.initMarkerLayer = function(fitBound, where, callback) {

    callback = callback || function() {};

    // Close the existing infowindow
    that.closeInfobox();

    if(that.placeMarker) {
      that.placeMarker.setMap(null);
      delete that.placeMarker;
    }

    // Ajust the zoom by default
    fitBound = typeof fitBound == "undefined" ? true : fitBound;
    // Default where clause is empty
    where = where || {};
    // To know if the map show every points or not
    that.allMarkers = _.isEmpty(where);

    // Clear the marker only if we change the state
    that.clearMarkers();

    that.getPointsFromServer(where, function(err, points) {

      if(err != null || !points || !points.length) return callback({ error: err }, null);
      
      // Fetch every line 
      for(var i in points) {         

        // Embedable data for the marker
        var lycee = {
               geo : points[i]["geo"].split(" "),             // Position array of the lycee
         longitude : points[i]["longitude"],             
          latitude : points[i]["latitude"],             
               uai : points[i]["uai"],                        // Unique ID of the lycee
              name : points[i]["nom"],                        // The name of the lycee
             label : points[i]["libelle-code-nature-uai"],    // Code NAture UAI
                                                              // The address of the lycee
              addr : points[i]["adresse"] + "<br />" + points[i]["code-postal"]  + " " + points[i]["libel-commune"], 
            statut : points[i]["statut"],                     // Statut of the (Scolaire or Apprentissage)
          internat : points[i]["presence-internat"] == "oui", // Is there an internat ?
          filieres : [ points[i]["statut"] ]                  // An array of the differents filieres statut
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

    if(lycee.latitude == 0 || lycee.longitude == 0) return;

    var marker = new google.maps.Marker({
      map      : that.map,
      icon     : that.getMarkerIcon(lycee.statut),
      position : new google.maps.LatLng(lycee.latitude, lycee.longitude), // The geo property is upside down
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
    return ! that.el.$hasInternat.eq(0).is(":checked") || lycee.internat || lycee["presence-internat"] == "oui";
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
    // The bound should changed
    that.adjustMapZoom();
  };

  /**
   * Event fired by a click on a marker (create an info box)
   * @src http://google-maps-utility-library-v3.googlecode.com/svn/tags/infobox/1.1.9/docs/reference.html
   */
  that.markerClick = function(event) {    

    var marker = this;

    // Content of the info box
    var options = {
        content: that.templates.infobox({lycee : marker.lycee }),
        boxClass: "js-info-box",
        enableEventPropagation: false,
        maxWidth: 0,
        alignBottom: true,
        pixelOffset: new google.maps.Size(-126, -42),
        zIndex: null,
        closeBoxURL: "",
        position: marker.position,
        pane: "floatPane",
        disableAutoPan: true
    };

    // Close the existing infowindow
    that.closeInfobox();
    // Create a new infobox with the options bellow
    that.infobox = new InfoBox(options);
    // Open the infobox related to the marker map
    that.infobox.open(marker.map);
    // Center the map to the marker
    that.map.setCenter(marker.position);

    // Bing an event on the button when the domready event is fired on it
    google.maps.event.addListener(that.infobox,'domready',function(){         
      $("#infobox-lycee .btn").one("click touchend", that.openLycee);
      $("#infobox-lycee .js-close").one("click touchend", that.closeInfobox);
    });

  };


  that.openLycee = function(event) {

    // Found the uai in the parent element that contains it
    var uai = $(this).parents("[data-uai]").data("uai");

    // Record the current uai to the back button
    that.el.$back.data("uai", uai);

    // Toggle the infobox state
    var $infobox = $(that.infobox.div_),
    // Select the lycee title
          $title = that.el.$menuHeader;
    // Emptys the title
    $title.find("small,.name").empty();

    $infobox.addClass("js-open").css("max-height", $infobox.find("h4").outerHeight() );
    
    // Load the lycee
    $.getJSON("/lycees/" + uai + ".json", function(data) {    

      $title.find("small").html( data["libelle-code-nature-uai"] );
      $title.find(".name").html( data.nom );

      // Zoom and pan to the lycee
      that.map.setCenter( new google.maps.LatLng(data.latitude, data.longitude) );
      if( that.map.getZoom() < 10 ) that.map.setZoom(10);

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

    var iconClassic = "/images/pointeur-general.png",
       iconScolaire = "/images/pointeur-scolaire.png",
        iconApprent = "/images/pointeur-apprenti.png",
         iconDouble = "/images/pointeur-mixte.png";

    if(!that.showStatut) return iconClassic;

    switch(statut) {
      
      case "Scolaire":
        return iconScolaire;
        break;

      case "Apprentissage":
        return iconApprent;
        break;

      case "Double":
        return iconDouble;
        break;

      default:
        return iconClassic;
        break;
    }

  };

  that.closeInfobox = function(event) {        
    // Close existing infobox    
    if(that.infobox) that.infobox.close();  
    return false;    
  };

  that.adjustMapZoom = function() {       

    var bounds = new google.maps.LatLngBounds();

    for( var key in that.markers ){           
      if( that.markers[key].getVisible() ) {
        bounds.extend( that.markers[key].getPosition() );            
      }
    }

    // Fit the map according to the overlay just if we have more than 0 zero marker 
    if( ! bounds.isEmpty() ) that.map.fitBounds(bounds);
  };

  that.goToCard = function(index) {
    that.el.$menu.toggleClass("detail", !!index)
    that.el.$menu.find(".slider").scrollTo(".card:eq(" + index + ")", 700);
    setTimeout(function() {
      that.cardsHeight();
    }, 700);
  };

  that.askForReset = function() {
    that.openPopup("#askForReset");
    // Force the reset in 30 seconds
    that.resetTimeout = setTimeout(function() {
      that.closePopup();
      that.resetForm();
    }, 30*1000);
  };


  that.resetForm = function() {  
    // Clear the existing timeout
    if(that.resetTimeout) clearTimeout(that.resetTimeout); 
    // Close the existing infowindow
    that.closeInfobox();
    // Empty all inputs and trigger a change event (to reset some form's)
    $(":input").val("");
    // Update filiere filter fields
    that.updateFiliereInputs();
    // Show all markers
    that.initMarkerLayer();      
    // Open the first form
    that.el.$menu.find(".filters").addClass("hidden").eq(0).removeClass("hidden");
    // Move to the first card
    that.goToCard(0);
    // Remove the user place marker
    that.removeUserPlaceMarker();
    // Reset the internats filters
    that.el.$menu.find(":checkbox").prop("checked", false);
  };

  that.openPopup = function(selector) {
    that.el.$popup.filter(selector).removeClass("hide");
    that.el.$overlay.removeClass("hide");
  };

  that.closePopup = function() {
    that.el.$overlay.addClass("hide");
    that.el.$popup.addClass("hide");
    // Clear the existing timeout
    if(that.resetTimeout) clearTimeout(that.resetTimeout); 
  };

  that.initElements = function() {
    that.el = {
      $overlay        : $(".js-overlay"),
      $popup          : $(".js-popup-box"),
      $map            : $("#map"),
      $menu           : $("#menu"),
      $back           : $("#menu .back"),
      $batiments      : $("#menu .batiments"),
      $menuHeader     : $("#menu .menu-header"),
      $menuFooter     : $("#menu-footer"),
      $lyceeFilter    : $("#lyceeFilter"),
      $placeFilter    : $("#placeFilter"),
      $filiereFilter  : $("#filiereFilter"),
      $hasInternat    : $(":input[name=hasInternat]")
    };
  };  

  that.initEvents = function() {

    // Trigger the reset function when the user goes idle after 5 minutes
    $.idleTimer(1000*60*5);        
    $(document).bind("idle.idleTimer", that.askForReset);

    // Toggle the forms
    that.el.$menu.on("click", ".filters > h3, .filters > h4", function(event) {
      var $filters = $(this).parents(".filters");
      // Toggle the current filters      
      $filters.toggleClass("hidden");
      // Empty all inputs and trigger a change event (to reset some form's)
      $(":input").val("");
      that.updateFiliereInputs();
      if( ! that.allMarkers ) that.initMarkerLayer();

      // Close the others in this card
      $(this).parents(".card").find(".filters").not( $filters ).addClass("hidden");
    });

    // Submit filter forms    
    that.el.$lyceeFilter.on("submit", that.lyceeFilter);
    that.el.$placeFilter.on("submit", that.placeFilter);
    that.el.$filiereFilter.on("change", that.filiereFilter);
    that.el.$filiereFilter.on("click touchend", ".reset", that.resetFilter);
    that.el.$menu.on("click touchend", ".back", function() { 
      // Restore the current infobox
      google.maps.event.trigger(that.markers[ $(this).data("uai") ], 'click');
      // Go to the first card
      that.goToCard(0);
    });

    that.el.$hasInternat.on("change", function() {
      // Check all option boxes
      that.el.$hasInternat.not(this).prop("checked", $(this).is(":checked") );
      that.updateMarkersVisibility()
    });    
    // Close the popup
    $(".js-close-popup").on("click touchend", that.closePopup);
    // Reset the form
    $(".js-reset-form").on("click touchend", that.resetForm);
    // Reset the form
    $(".js-reset-filieres").on("click touchend", function() {
      // Empty all inputs and trigger a change event (to reset some form's)
      that.el.$filiereFilter.find(":input").val("");
      that.updateFiliereInputs();
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
          var data = distinct(that.lyceesList, function(d) { return d.slug });
          //var data = that.lyceesList;
          // Fuzzy search with the slug on the lycee list
          var res = $(data).map(function(i,lycee){ 
            // In case of match, returns the lycee's name
            if(lycee.slug.toLowerCase().indexOf(txt.toLowerCase())!=-1){ return lycee.nom } 
          }).get();
          // Return the data source filtered
          callback(res);
        },
        // Accepts every data (already filtered by the source function)
        matcher: function() { return true },
        // Disable hiligth
        highlighter: function(item) { return item },
        // Select an element
        updater: that.lyceeFilter
      });

    });

    // Get all lycées to setup the autocomplete
    $.getJSON("/cities.json", function(data) {

      that.cities = data;

      // Setup the autocomplete with the array of string as data source
      that.el.$placeFilter.find(":input[name=place]").typeahead({
        // The data source to use
        source: function(txt, callback) {
          // Slugify the search
          txt = slugify(txt);
          // Fuzzy search with the slug on the lycee list
          var res = $(that.cities).map(function(i,city){ 
            // In case of match, returns the lycee's name
            if(city.toLowerCase().indexOf(txt.toLowerCase())!=-1){ return city }
          }).get();
          // Return the data source filtered
          callback(res);
        },
        // Accepts every data (already filtered by the source function)
        matcher: function() { return true },
        // Disable hiligth
        highlighter: function(item) { return item },
        // Select an element
        updater: that.placeFilter
      });

    });

    

  };

  that.cardsHeight = function() {

    that.el.$menu.find(".card").each(function(i, card) {
      $card = $(card);
      // Determines the size of the card 
      // according the card offset's top and the window height
      var paddingBottom = that.el.$menuFooter.outerHeight(),
                 height = $(window).height() - $card.offset().top - paddingBottom ;
      // Defines the new card's height
      $card.css({
        "height":height
      });
    })
  };

  that.nextLogoFrame = function() {
    
    var  step = that.el.$batiments.data("step") || 1,
    stepWidth = 390;

    // Slide the logo background
    that.el.$batiments.css("background-position", -1*step*stepWidth);
    // Record the next step
    that.el.$batiments.data("step", step+1);
  };
  
  $(that.init = function() {          
    
    // iOs detection
    if( navigator.userAgent.match(/(iphone|ipod|ipad)/i) != null ) $("html").addClass("ios");

    that.initElements();
    that.initEvents();  
    that.initTemplates();  
    that.initMaps();

    that.el.$menu.find(".card").jScrollPane({ autoReinitialise  : true, hideFocus: true });
    // Defines the cards height    
    that.cardsHeight();
    // Dynamicly re-calculate when the window is resized
    $(window).on("resize", that.cardsHeight);
    // Animate the logo
    setInterval(that.nextLogoFrame, 15*1000);

  });


})(window);