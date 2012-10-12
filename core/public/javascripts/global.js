new (function(window, undefined) {

  var that = this;
  var tableLyceesId = '5436577',
    tableFilieresId = '5436907';

  /**
   * Submit the form lyceeFilter and update the map   
   */
  that.lyceeFilter = function(event) {
    event.preventDefault();

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
  };



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

  that.initMarkerLayer = function(fitBound, where) {

    // Ajust the zoom by default
    fitBound = typeof fitBound == "undefined" ? true : fitBound;
    // Default where clause is empty
    where = where || "";

    // Clear the marker only if we change the state
    that.clearMarkers();

    // Create the request
    var queryText = encodeURIComponent("SELECT Geocode(Geo), UAI FROM " + tableLyceesId + (where != "" ? " WHERE " + where : "") ),
        quFilieresxt = encodeURIComponent("SELECT Geocode(Geo), UAI FROM " + tableLyceesId + (where != "" ? " WHERE " + where : "") );
    // Send the request as a Get query
    var query = new google.visualization.Query('http://www.google.com/fusiontables/gvizdata?tq=' + queryText);
    // To know if the map show every points or not
    that.allMarkers = (where == "");
  

    query.send(function(response) {
      // No data
      if(response.getDataTable() == null) return;
      // Fetch every line
      var numRows = response.getDataTable().getNumberOfRows();      
      for (i = 0; i < numRows; i++) {                     
        // Get the geocode
        var geo = response.getDataTable().getValue(i, 0).split(" ");
        that.addMarker(geo, response.getDataTable().getValue(i, 1));
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

    that.markers.push(marker);
  };

  that.clearMarkers = function() { 
    
    if(typeof that.markers == "undefined") return that.markers = [];

    for( var key in that.markers ){           
      that.markers[key].setMap(null)
    }
    that.markers = [];
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
    that.el.$lyceeFilter.on("submit", that.lyceeFilter);
    that.el.$placeFilter.on("submit", that.placeFilter);
    that.el.$filiereFilter.on("submit", that.filiereFilter);


    /*that.el.$menu.on("dblclick", ".card", function() {
      switch( $(this).index() ) {
        case 0:
          that.el.$menu.scrollTo(".card:eq(1)", 600);
          break;
        case 1:
          that.el.$menu.scrollTo(".card:eq(0)", 600);
          break;
      }
    });*/

  };

  
  $(that.init = function() {          
    that.initElements();  
    that.initMaps();
    that.initEvents();  
  });


})(window);