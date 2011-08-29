var PF = PF || {};

PF.PAGE_WIDTH = 550;
PF.PAGE_HEIGHT = 550;

/**
 * Minimum width of the whole app (when scaled to be smaller than this,
 * scrollbars will appear).
 * @type {number}
 */
PF.PAGE_MIN_WIDTH = 1000;


/**
 * Minimum width of the whole app (when scaled to be smaller than this,
 * scrollbars will appear).
 * @type {number}
 */
PF.PAGE_MIN_HEIGHT = 680;

/**
 * The total width of the book, including jacket.
 * @type {number}
 */
PF.BOOK_WIDTH = 1160;


/**
 * The total width of the book, including jacket.
 * @type {number}
 */
PF.BOOK_HEIGHT = 570;

/**
 * Inner margin (x) of the book (space between where the book jacket and white
 * paper).
 * @type {number}
 */
PF.PAGE_MARGIN_X = 32;


/**
 * Inner margin (y) of the book (space between where the book jacket and white
 * paper).
 * @type {number}
 */
PF.PAGE_MARGIN_Y = 10;


/**
 * The width of the closed book, including jacket.
 * @type {number}
 */
PF.BOOK_WIDTH_CLOSED = PF.BOOK_WIDTH / 2;


/**
 * An offset applied to the horizontal positioning of the book (#book).
 * @type {number}
 */
PF.BOOK_OFFSET_X = 5;


/**
 * User agent.
 * @type {string}
 */
PF.UA = navigator.userAgent.toLowerCase();


/**
 * Whether UA is a touch device.
 * @type {boolean}
 */
PF.IS_TOUCH_DEVICE = PF.UA.match(/android/) || PF.UA.match(/iphone/) ||
    PF.UA.match(/ipad/) || PF.UA.match(/ipod/);



PF.initialize = function() {
	PF.pageflip.initialize();
	
	PF.updateLayout();
	
	// Prevent native drag and drop behavior of all images. This is important
  // since it is very easy to start dragging assets by mistake while trying to
  // flip pages.
  $('img').mousedown(function(event) { event.preventDefault() });
}



/**
 * Updates the layout of all elements that require JS controlled positioning.
 * This is typically elements that are centered but with limits on min and max
 * positions.
 *
 * Note that most of these elements will originally be positioned entirely via
 * CSS. JS control over the positioning is especially important for resizing
 * logic, explicit control of overflows, centering etc.
 *
 * @param {boolean} fromScroll Flags if this update to the layout originates
 *     from the application being scrolled.
 */
PF.updateLayout = function(fromScroll) {
  // Fetch the application size
  var applicationSize = {
    width: $(window).width(),
    height: $(window).height()
  };

  // If we are not below the minimum size of the app, overflow should always be
  // hidden.
  $('body').css({
    overflowX: applicationSize.width < PF.PAGE_MIN_WIDTH ? 'auto' : 'hidden',
    overflowY: applicationSize.height < PF.PAGE_MIN_HEIGHT ? 'auto' : 'hidden'
  });

  // Limit the screen size to the bounds
  applicationSize.width = Math.max(applicationSize.width, PF.PAGE_MIN_WIDTH);
  applicationSize.height = Math.max(applicationSize.height, PF.PAGE_MIN_HEIGHT);

  // Determine the center point of the application
  var center =
      { x: applicationSize.width * 0.5, y: applicationSize.height * 0.5 };

  // Only update component positioning if this update does not originate from a
  // scroll event.
  if (!fromScroll) {

    // When we reach a small browser window size we need to progressively hide
    // the grey mask that overlays the book.
    // TODO: Remove magical number 50.
    if (applicationSize.width < PF.PAGE_MIN_WIDTH + $('#grey-mask').width() +
        50) {
      $('#grey-mask').css({
        left: -((PF.PAGE_MIN_WIDTH + $('#grey-mask').width() + 50) -
            applicationSize.width)
      });
    }
    else {
      $('#grey-mask').css({
        left: 0
      });
    }

    // Align the book to the center of the page with the right side page in
    // focus.
    $('#book').css({
      left: center.x - (PF.BOOK_WIDTH * 0.5) //- (PF.BOOK_WIDTH_CLOSED * 0.5)
         +  PF.BOOK_OFFSET_X,
      top: center.y - (PF.BOOK_HEIGHT * 0.5),
      margin: 0
    });
  }

  // Set the vertical positions of the pagination buttons to slightly above the
  // exact center point.
  $('#pagination-prev, #pagination-next').css({ top: center.y - 20 });

  // If we are not on a touch device, we need to account for scrolling when
  // positioning the pagination buttons horizontally.
  if (!PF.IS_TOUCH_DEVICE) {
    $('#pagination-prev').css({
      left: $(window).scrollLeft()
    });
    $('#pagination-next').css({
      right: 'auto',
      left: $(window).scrollLeft() + $(window).width() -
          $('#pagination-next').width()
    });
  }

};

/**
 * A global shorthand for retrieving the current time.
 * @return {Object} Date object.
 */
PF.time = function() {
  return new Date().getTime();
};


/**
 * Assign namespace to window object.
 */
window['PF'] = PF;
