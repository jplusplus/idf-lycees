
// shim layer with setTimeout fallback
// (Paul Irish method http://paulirish.com/2011/requestanimationframe-for-smart-animating/)
window.requestAnimFrame = (function(){
  return  window.requestAnimationFrame       || 
          window.webkitRequestAnimationFrame || 
          window.mozRequestAnimationFrame    || 
          window.oRequestAnimationFrame      || 
          window.msRequestAnimationFrame     || 
          function(/* function */ callback, /* DOMElement */ element){
            window.setTimeout(callback, 1000 / 60);
          };
})();


var animationEndEvents  = "webkitAnimationEnd oAnimationEnd animationend MSAnimationEnd";
var transitionEndEvents = "webkitTransitionEnd oTransitionEnd transitionend MSTransitionEnd";


/**
 *  Adds a loading overlay on the element
 * 
 * @function
 * @public
 */
$.fn.loading = function(state, addClass) {

    // element to animate
    var $this = $(this);
    // hide or show the overlay
    state = state === undefined ? true : !!state;

    $this.each(function(i, element) {

        var $element = $(element);

        // if we want to create and overlay and any one exists
        if( state && $element.find(".js-loading-overlay").length === 0 ) {

            // creates the overlay
            var $overlay = $("<div/>").addClass("js-loading-overlay");
            // add a class
            if(addClass !== undefined) {
                $overlay.addClass(addClass);
            }
            // appends it to the current element
            $element.append( $overlay );            
            // show the element
            $overlay.stop().hide().fadeIn(400);

            // Disables all inputs
            $this.find("input,button,.btn").addClass("disabled").prop("disabled", true);

        // if we want to destroy this overlay
        } else if(!state) {                        
            // just destroys it
            $element.find(".js-loading-overlay").remove(); 

            // Unabled all inputs
            $this.find("input,button,.btn").removeClass("disabled").prop("disabled", false);
        }

    });

    return this;

};



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
           .replace(/\s+/g, '') // collapse whitespace and replace by empty
           .replace(/-+/g, ''); // collapse dashes

  return str;
}