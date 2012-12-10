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
        var where = "ST_INTERSECTS(Geo, CIRCLE( LATLNG" + position.toString() + ", 20000) )";
        
        that.getPointsFromGFT(where, function(err, points) {              

          points = points || [];
          console.log(points.length)
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
                ~~(9+(points.length/20)) 
              ), 
              9
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
      minZoom   : 9,
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

        if(!points[i]["geo"]) continue;

        // Embedable data for the marker
        var lycee = {
               geo : points[i]["geo"].split(" "), // Position array of the lycee
         longitude : points[i]["longitude"],             
          latitude : points[i]["latitude"],             
               uai : points[i]["uai"],                        // Unique ID of the lycee
              name : points[i]["nom"],                        // The name of the lycee
             label : points[i]["libelle-code-nature-uai"],    // Code NAture UAI                                                              
              addr : points[i]["adresse"] + "<br />" + points[i]["code-postal"]  + " " + points[i]["libel-commune"], // The address of the lycee
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

    if( $("html").hasClass("ie7") || $("html").hasClass("ie8") ) {

      $(".internat").on("click", function() {
        var checked = $(this).find(":input").prop("checked");
        
        $(this)
          .toggleClass("checked", !checked)
          .find(":input")
            .prop("checked", !checked)
            .trigger("change");
      });
    } 

  });


})(window);