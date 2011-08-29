PF.pageflip = {}

PF.pageflip.HINT_WIDTH = 100;

PF.pageflip.HINT_WIDTH_TOUCH = 250;

PF.pageflip.CANVAS_VERTICAL_PADDING = 80;

PF.pageflip.CANVAS_HORIZONTAL_PADDING = 20;

PF.pageflip.CANVAS_WIDTH = PF.BOOK_WIDTH + (PF.pageflip.CANVAS_HORIZONTAL_PADDING * 2);

PF.pageflip.CANVAS_HEIGHT = PF.BOOK_HEIGHT + (PF.pageflip.CANVAS_VERTICAL_PADDING * 2);

PF.pageflip.FRAMERATE = 30;

/**
 * Textures.
 */
PF.pageflip.textures = {};

/**
 * The current mouse position, updated on mouse move.
 */
PF.pageflip.mouse = { x: 0, y: 0, down: false };

/**
 * A list of the most recent mouse positions.
 */
PF.pageflip.mouseHistory = [];

/**
 * Page flip skew object.
 */
PF.pageflip.skew = { top: 0, topTarget: 0, bottom: 0, bottomTarget: 0 };

/**
 * The area of the canvas that needs to be cleared, update during every render
 * loop.
 */
PF.pageflip.dirtyRegion = new Region();


/**
 * Flags if the user is currently dragging the page.
 */
PF.pageflip.dragging = false;


/**
 * Flags if a page turn animation is currently being run.
 */
PF.pageflip.turning = false;

/**
 * Flags if the mouse cursor is over the hinting area.
 */
PF.pageflip.hinting = false;

/**
 * Interval used to invoke the drawing loop.
 */
PF.pageflip.loopInterval = -1;

/**
 * The maximum number of milliseconds that can pass between mouse down-up on the
 * hinting for it to flip directly.
 */
PF.pageflip.CLICK_FREQUENCY = 350;


/**
 * The type of flips that can be rendered.
 */
PF.pageflip.SOFT_FLIP = 'soft';


/**
 * The type of flips that can be rendered.
 */
PF.pageflip.HARD_FLIP = 'hard';

/**
 * Holds flip instances, each renders its own flip animation.
 */
PF.pageflip.flips = [];

/**
 * 2D context of TT.pageflip.canvas.
 */
PF.pageflip.context = null;

/**
 * Used to render all flips on.
 */
PF.pageflip.canvas = null;

/**
 * Flags if interaction events are currently attached.
 */
PF.pageflip.eventsAreBound = null;


/**
 * Initialize page flip class.
 */
PF.pageflip.initialize = function() {

  // Create the canvas elements.
  PF.pageflip.createCanvas();
  PF.pageflip.createTextures();

  if (PF.pageflip.eventsAreBound == null) {
    PF.pageflip.registerEventListeners();
  }

  $(document).bind('keydown', PF.pageflip.onKeyPress);
};


/**
 * Creates the canvas element that all page flips will be rendered on.
 */
PF.pageflip.createCanvas = function() {
  // Create the canvas element that the page flip will be drawn on.
  PF.pageflip.canvas = $('<canvas id="pageflip"></canvas>');
  PF.pageflip.canvas.css({
    position: 'absolute',
    top: -PF.pageflip.CANVAS_VERTICAL_PADDING,
    left: -PF.pageflip.CANVAS_HORIZONTAL_PADDING,
    zIndex: 0
  });

  PF.pageflip.canvas[0].width = PF.pageflip.CANVAS_WIDTH;
  PF.pageflip.canvas[0].height = PF.pageflip.CANVAS_HEIGHT;
  PF.pageflip.context = PF.pageflip.canvas[0].getContext('2d');

  // Add the canvas to the DOM.
  PF.pageflip.canvas.appendTo($('#book'));
};

/**
 * Creates the textures that will be used for the front cover, back cover,
 * left page and right page.
 */
PF.pageflip.createTextures = function() {
  PF.pageflip.flippedLeftPage = $('<img>', {
    src: $('#left-page img').attr('data-src-flipped'),
    width: $('#left-page img').attr('width'),
    height: $('#left-page img').attr('height')
  })[0];

  PF.pageflip.flippedBackCover = $('<img>', {
    src: $('#back-cover img').attr('data-src-flipped'),
    width: $('#back-cover img').attr('width'),
    height: $('#back-cover img').attr('height')
  })[0];

  PF.pageflip.textures.front = $('#front-cover img')[0];
  PF.pageflip.textures.back = PF.pageflip.flippedBackCover;
  PF.pageflip.textures.left = PF.pageflip.flippedLeftPage;
  PF.pageflip.textures.right = $('#right-page img')[0];
};


/**
 * Register event listeners.
 */
PF.pageflip.registerEventListeners = function() {
  PF.pageflip.unregisterEventListeners();

 	PF.pageflip.eventsAreBound = true;

  // Register the mouse listeners.
  $(document).bind('mousemove', PF.pageflip.onMouseMove);
  $(document).bind('mousedown', PF.pageflip.onMouseDown);
  $(document).bind('mouseup', PF.pageflip.onMouseUp);

  if (PF.IS_TOUCH_DEVICE) {
    document.addEventListener('touchstart', PF.pageflip.onTouchStart, false);
    document.addEventListener('touchmove', PF.pageflip.onTouchMove, false);
    document.addEventListener('touchend', PF.pageflip.onTouchEnd, false);
  }
};

/**
 * Unregister event listeners.
 */
PF.pageflip.unregisterEventListeners = function() {
  PF.pageflip.eventsAreBound = false;

  // Register the mouse listeners.
  $(document).unbind('mousemove', PF.pageflip.onMouseMove);
  $(document).unbind('mousedown', PF.pageflip.onMouseDown);
  $(document).unbind('mouseup', PF.pageflip.onMouseUp);

  if (PF.IS_TOUCH_DEVICE) {
    document.removeEventListener('touchstart', PF.pageflip.onTouchStart);
    document.removeEventListener('touchmove', PF.pageflip.onTouchMove);
    document.removeEventListener('touchend', PF.pageflip.onTouchEnd);
  }
};



/**
 * Event handler for document.onmousedown.
 * @param {Object} event Event object.
 * @return {boolean} Return false.
 */
PF.pageflip.onMouseDown = function(event) {

  // Flag that the mouse is down.
  PF.pageflip.mouse.down = true;

  // Update the mouse position.
  PF.pageflip.updateRelativeMousePosition(event.clientX, event.clientY);

  PF.pageflip.handlePointerDown();

  if (PF.pageflip.isMouseInHintRegion()) {
    event.preventDefault();
    return false;
  }
};


/**
 * Event handler for document.onmouseup.
 * @param {Object} event Event object.
 */
PF.pageflip.onMouseUp = function(event) {

  // Flag that the mouse isn't down anymore.
  PF.pageflip.mouse.down = false;

  // Update the mouse position.
  PF.pageflip.updateRelativeMousePosition(event.clientX, event.clientY);

  PF.pageflip.handlePointerUp();
};


/**
 * Event handler for document.onmousemove.
 * @param {Object} event Event object.
 */
PF.pageflip.onMouseMove = function(event) {

  // Update the mouse position.
  PF.pageflip.updateRelativeMousePosition(event.clientX, event.clientY);

  PF.pageflip.handlePointerMove();
};


/**
 * Handle pointer down event.
 */
PF.pageflip.handlePointerDown = function() {

  // Check if the mouse is within the hit area. If it is then we initiate
  // dragging.
  if (PF.pageflip.isMouseInHintRegion()) {

    $('body').css('cursor', 'pointer');

    if (PF.time() - PF.pageflip.mouseDownTime > PF.pageflip.CLICK_FREQUENCY) {
      PF.pageflip.dragging = true;
    }

    // Store the mouse down time.
    PF.pageflip.mouseDownTime = PF.time();

    PF.pageflip.activate();
  }

};


/**
 * Handle pointer up event.
 * @return {boolean} Return false.
 */
PF.pageflip.handlePointerUp = function() {

  // If the time between press down and release is below the frequency, flip to
  // the next page.
  if (PF.time() - PF.pageflip.mouseDownTime < PF.pageflip.CLICK_FREQUENCY) {
    //TT.navigation.goToNextPage();
    PF.pageflip.dragging = false;
    return false;
  }

  // Was the cursor being held down and is the mouse further to the left than
  // the drop-treshold?
  if (PF.pageflip.dragging && PF.pageflip.mouse.x < PF.PAGE_WIDTH * 0.45) {

    // Try to go to the next page.
    var succeeded = PF.navigation.goToNextPage();

    // If there is no next page, drop the page.
    if (succeeded == false) {
      PF.pageflip.dragging = false;
    }
  }
  else {
    PF.pageflip.dragging = false;

    PF.pageflip.handlePointerMove();
  }

};


/**
 * Is mouse in hint region?
 * @return {boolean} Whether mouse is in hint region.
 */
PF.pageflip.isMouseInHintRegion = function() {
  return PF.pageflip.getHintRegion().contains(PF.pageflip.mouse.x,
      PF.pageflip.mouse.y);
};


/**
 * Calculates and returns the region in which hinting should be triggered. The
 * regions differs between normal soft pages and the hard cover.
 * @return {Region} A region definition of the area in which hinting should be
 *     triggered when the mouse is moved.
 */
PF.pageflip.getHintRegion = function() {
  var region = new Region();

 /* if (TT.navigation.isHomePage() || TT.navigation.isLastPage() ||
      TT.navigation.isCreditsPage()) {
    region.left = TT.BOOK_WIDTH_CLOSED - (TT.IS_TOUCH_DEVICE ?
        TT.pageflip.HINT_WIDTH_TOUCH : TT.pageflip.HINT_WIDTH);
    region.right = TT.BOOK_WIDTH_CLOSED;
  }
  else */{
    region.left = PF.PAGE_WIDTH - (PF.IS_TOUCH_DEVICE ?
       PF.pageflip.HINT_WIDTH_TOUCH : PF.pageflip.HINT_WIDTH);
    region.right = PF.PAGE_WIDTH;
  }

  region.top = 0;
  region.bottom = PF.PAGE_HEIGHT;

  return region;
};


/**
 * A shorthand for transforming a global mouse position to be relative to the
 * book AND update the pageflip class mouse state to reflect this.
 * @param {number} globalX The x position of the mouse in the window.
 * @param {number} globalY The y position of the mouse in the window.
 */
PF.pageflip.updateRelativeMousePosition = function(globalX, globalY) {
  var point = PF.pageflip.getRelativeMousePosition(globalX, globalY);

  PF.pageflip.mouse.x = point.x;
  PF.pageflip.mouse.y = point.y;
  $('#mouse').text('X: ' + point.x + ', Y:' + point.y);
};


/**
 * Gets the mouse position (x,y) in a coordinate space where 0,0 is the top left
 * corner of the right side page.
 * @param {number} globalX The x position of the mouse in the window.
 * @param {number} globalY The y position of the mouse in the window.
 * @return {Object} containing the relative mouse position.
 */
PF.pageflip.getRelativeMousePosition = function(globalX, globalY) {

  // Grab the mouse position from the event.
  var point = { x: globalX, y: globalY };

  // Offset the mouse position so that 0,0 is the top left of the left side
  // page.
  point.x -= $('#pages').offset().left + PF.PAGE_WIDTH + PF.PAGE_MARGIN_X;
  point.y -= $('#pages').offset().top;

  return point;
};


/**
 * Handle pointer move event.
 */
PF.pageflip.handlePointerMove = function() {

  var hinting = PF.pageflip.hinting;

  // Assume that we are not hinting and try to prove otherwise.
  PF.pageflip.hinting = false;

  $('body').css('cursor', '');

  // If we are not dragging or running the turn animation, check for and
  // update the hinting.
  if (!PF.pageflip.dragging && !PF.pageflip.turning) { //&&
     // (!PF.navigation.isCreditsPage() || (PF.navigation.isCreditsPage() &&
     // PF.navigation.isBookOpen()))) {

    // Fetch a reference to the current flip.
    var flip = PF.pageflip.getCurrentFlip();

    // If this flip is below zero progress it's in use, so we create a new flip.
    if (flip.progress < 0) {
      flip = PF.pageflip.createFlip();
    }

    
    /*var isHardCover = (TT.navigation.isHomePage() ||
        TT.navigation.isLastPage() || (TT.navigation.isCreditsPage() &&
        TT.navigation.isBookOpen()));

    // Set the correct type of flip transition.
    flip.type = isHardCover ? TT.pageflip.HARD_FLIP : TT.pageflip.SOFT_FLIP;
		*/
		flip.type = PF.pageflip.SOFT_FLIP;
		
    // Is the cursor within the hint area?
    if (PF.pageflip.isMouseInHintRegion()) {

      if (PF.pageflip.mouseHistory[4]) {
        var distanceX = PF.pageflip.mouse.x - (PF.pageflip.mouseHistory[4].x ||
            0);
        var distanceY = PF.pageflip.mouse.y - (PF.pageflip.mouseHistory[4].y ||
            0);
        var distanceTravelled = Math.sqrt(distanceX * distanceX + distanceY *
            distanceY);
      }
      else {
        var distanceTravelled = 0;
      }

      if (distanceTravelled < 100) { //!TT.navigation.isHomePage() || 
        flip.target = Math.min(PF.pageflip.mouse.x / PF.PAGE_WIDTH, 0.98);

        $('body').css('cursor', 'pointer');

        PF.pageflip.activate();
        PF.pageflip.hinting = true;

/*
        if (TT.navigation.isHomePage()) {
          flip.target = Math.min(TT.pageflip.mouse.x / TT.PAGE_WIDTH, 0.95);

          // We are on the home page and hinting, make sure the current page is
          // visible.
          $('#pages section.current').show().width(TT.PAGE_WIDTH);
        }
        else */{

          // We not on the home page, make sure the page below the current is
          // shown.
          $('#pages section.current').next('section').show()
              .width(PF.PAGE_WIDTH);
        }
      }

    }
    else if (flip.progress !== 1 && flip.target !== -1) {
      if (PF.pageflip.hinting == true) {
        $('#pages section.current').next('section').width(0);
      }

      // Reset the page to its resting state.
      flip.target = 1.0;
      PF.pageflip.activate();
      PF.pageflip.hinting = false;
    }
  }

  // If we are draggin the home page beyond a certain point, take over an flip
  // automatically.
  else if (PF.pageflip.dragging) {
    if (PF.pageflip.getCurrentFlip().type != PF.pageflip.HARD_FLIP) {
      PF.pageflip.getCurrentFlip().alpha = 1;
    }
  }

  // Remove trailing mouse history.
  while (PF.pageflip.mouseHistory.length > 9) {
    PF.pageflip.mouseHistory.pop();
  }

  // Push current mouse position to history.
  PF.pageflip.mouseHistory.unshift(PF.pageflip.mouse);

};



/**
 * Activates the page flip rendering engine.
 */
PF.pageflip.activate = function() {

  // Only activate if the redraw loop is not already running.
  if (PF.pageflip.loopInterval == -1) {
    clearInterval(PF.pageflip.loopInterval);
    PF.pageflip.loopInterval = setInterval(PF.pageflip.redraw, 1000 /
        PF.pageflip.FRAMERATE);
  }

  // While the page flip is being rendered, it needs to be on top of the HTML
  // content.
  PF.pageflip.canvas.css('z-index', 1010);
};



/**
 * Redraws the page flipt so that the current folding properties are reflected
 * visually.
 */
PF.pageflip.redraw = function() {

  // Canvas and context shorthands.
  var cvs = PF.pageflip.canvas[0];
  var ctx = PF.pageflip.context;

  // Clear the dirty region of the canvas.
  var dirtyRect = PF.pageflip.dirtyRegion.toRectangle(40);

  if (dirtyRect.width > 1 && dirtyRect.height > 1) {
    ctx.clearRect(dirtyRect.x, dirtyRect.y, dirtyRect.width, dirtyRect.height);
  }

  // Uncomment the following three lines to display
  // the redraw region
  //ctx.clearRect( 0, 0, TT.pageflip.CANVAS_WIDTH, TT.pageflip.CANVAS_HEIGHT );
  //ctx.fillStyle = 'rgba(0,255,0,0.3)';
  //ctx.fillRect( dirtyRect.x, dirtyRect.y, dirtyRect.width, dirtyRect.height );

  PF.pageflip.dirtyRegion.reset();

  // Loop through and draw each flip.
  for (var i = 0, len = PF.pageflip.flips.length; i < len; i++) {
    var flip = PF.pageflip.flips[i];

    if (flip.type == PF.pageflip.HARD_FLIP) {
     	PF.pageflip.renderHardFlip(flip);
    }
    else {
      PF.pageflip.renderSoftFlip(flip);
    }
  }

  // Clean up unused flip instances.
  PF.pageflip.removeInactiveFlips();
};



/**
 * Render and update a soft page flip based on the passed in definition.
 * @param {Flip} flip The definition of this flip which determines how the flip
 *     should be rendered.
 * @return {boolean} Whether successful or not.
 */
PF.pageflip.renderSoftFlip = function(flip) {

  // Create a shorthand for the mouse position.
  var mouse = PF.pageflip.mouse;

  // The skew properties that will be applied to the fold.
  var skew = PF.pageflip.skew;

  // Canvas and context shorthands.
  var cvs = PF.pageflip.canvas[0];
  var ctx = PF.pageflip.context;

  // Determine which the current visible page is (the page we are navigating
  // AWAY from by flipping).
  var currentPage = flip.currentPage;

  if (flip.direction === -1) {
    currentPage = flip.targetPage;
  }
  else {
    flip.targetPage.width(PF.PAGE_WIDTH);
  }

  // If dragging is in progress we will handle that and avoid checking for
  // hints.
  if (PF.pageflip.dragging && !flip.consumed) {

    // Limit the mouse position to the page bounds.
    mouse.x = Math.max(Math.min(mouse.x, PF.PAGE_WIDTH), -PF.PAGE_WIDTH);
    mouse.y = Math.max(Math.min(mouse.y, PF.PAGE_HEIGHT), 0);

    // Determine where the fold should be.
    flip.progress = Math.min(mouse.x / PF.PAGE_WIDTH, 1);
  }
  else {

    var distance = Math.abs(flip.target - flip.progress);
    var speed = flip.target == -1 ? 0.3 : 0.2;

    // The easing equation that will be used for the flip.
    var ease = distance < 1 ? speed + Math.abs(flip.progress * (1 - speed)) :
        speed;
    ease *= Math.max(1 - Math.abs(flip.progress), flip.target == 1 ? 0.5 : 0.2);

    // Ease progress towards the target.
    flip.progress += (flip.target - flip.progress) * ease;

    // Check if the flip progress is very cloes to the flip target, if it is
    // then this flip is now completed.
    if (Math.round(flip.progress * 99) == Math.round(flip.target * 99)) {
      flip.progress = flip.target;
      flip.x = PF.PAGE_WIDTH * flip.progress;

      // Ensure that the page masking is up to date.
      currentPage.css({ width: flip.x });

      // Returning here means this last state is not drawn, we don't want that
      // to happen when hinting.
      if (flip.target == 1 || flip.target == -1) {
        flip.consumed = true;
        PF.pageflip.completeCurrentTurn();
        return false;
      }
    }

  }

  // Make sure the x position of the flip reflects the current flip progress.
  flip.x = PF.PAGE_WIDTH * flip.progress;

  // Determine the strength of the fold depending on where the mouse cursor is
  // being dragged.
  flip.strength = 1 - (flip.x / PF.PAGE_WIDTH);

  // Fade out the flipped page during the last bit of transition.
  if (flip.target == -1 && flip.progress < -0.9) {
    flip.alpha = 1 - ((Math.abs(flip.progress) - 0.9) / 0.1);
  }

  var shadowAlpha = Math.min(1 - ((Math.abs(flip.progress) - 0.75) / 0.25), 1);

  // A measure of fold strength that ranges from 0-1 and is highest (1) at the
  // book spine.
  var centralizedFoldStrength = flip.strength > 1 ? 2 - flip.strength :
      flip.strength;

  // How far the page should outdent vertically due to perspective.
  var verticalOutdent = 40 * centralizedFoldStrength;

  // How wide the folded page should be spread.
  var horizontalSpread = (PF.PAGE_WIDTH * 0.5) * flip.strength * 0.95;

  if (flip.x + horizontalSpread < 0) {
    horizontalSpread = Math.abs(flip.x);
  }

 /* if (PF.navigation.isCreditsPage()) {
    horizontalSpread = 0;
  }
*/
  // The maximum width of the left and right side shadows.
  var shadowSpread = (PF.PAGE_WIDTH * 0.5) *
      Math.max(Math.min(flip.strength, 0.5), 0);

  var rightShadowWidth = (PF.PAGE_WIDTH * 0.5) *
      Math.max(Math.min(flip.strength, 0.5), 0);
  var leftShadowWidth = (PF.PAGE_WIDTH * 0.5) *
      Math.max(Math.min(centralizedFoldStrength, 0.5), 0);
  var foldShadowWidth = (PF.PAGE_WIDTH * 0.9) *
      Math.max(Math.min(flip.strength, 0.05), 0);

  // Cut the current page where the fold is.
  currentPage.css({ width: Math.max(flip.x + horizontalSpread * 0.5, 0) });

  // If the page is being dragged, apply skewing to it depending on the mouse y
  // position of the mouse.
  if (PF.pageflip.dragging) {
    skew.topTarget = Math.max(Math.min((mouse.y / (PF.PAGE_HEIGHT * 0.5)), 1),
        0) * (40 * centralizedFoldStrength);
    skew.bottomTarget = Math.max(Math.min(1 - (mouse.y -
        (PF.PAGE_HEIGHT * 0.5)) / (PF.PAGE_HEIGHT * 0.5), 1), 0) *
        (40 * centralizedFoldStrength);
  }
  else {
    skew.topTarget = 0;
    skew.bottomTarget = 0;
  }

  // Ensure that there is absolutely no skewing when the flip is entirely in its
  // rested state.
  if (flip.progress === 1) {
    skew.top = 0;
    skew.bottom = 0;
  }

  // Animate the skew.
  skew.top += (skew.topTarget - skew.top) * 0.3;
  skew.bottom += (skew.bottomTarget - skew.bottom) * 0.3;

  // Make sure the flip is rendered on the right side of the incision which
  // masks the page contents.
  flip.x += horizontalSpread;

  // Offset that will be used to translate the canvas coordinate space to
  // simulate the top of the book spine being 0,0 (the real 0,0 is actually at
  // the top left corner of the full book spread).
  var drawingOffset = {
    x: PF.pageflip.CANVAS_HORIZONTAL_PADDING + PF.PAGE_MARGIN_X + PF.PAGE_WIDTH,
    y: PF.pageflip.CANVAS_VERTICAL_PADDING + PF.PAGE_MARGIN_Y
  };

  // Offset by the page margin.
  ctx.save();
  ctx.translate(drawingOffset.x, drawingOffset.y);
  ctx.globalAlpha = flip.alpha;

  if (flip.direction == -1) {
    ctx.globalCompositeOperation = 'destination-over';
  }

  // Enhance the fold line by drawing a straight vertical line.
  ctx.strokeStyle = 'rgba(0,0,0,0.1)';
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(flip.x + 1, 0);
  ctx.lineTo(flip.x + 1, PF.PAGE_HEIGHT);
  ctx.stroke();

  // Folder paper gradient.
  var foldGradient = ctx.createLinearGradient(flip.x - shadowSpread, 0, flip.x,
      0);
  foldGradient.addColorStop(0.35, '#fafafa');
  foldGradient.addColorStop(0.73, '#eeeeee');
  foldGradient.addColorStop(0.9, '#fafafa');
  foldGradient.addColorStop(1.0, '#e2e2e2');

  // Folded paper style.
  ctx.fillStyle = foldGradient;
  ctx.strokeStyle = 'rgba(0,0,0,0.1)';
  ctx.lineWidth = 0.5;

  // Draw the folded piece of paper.
  ctx.beginPath();
  ctx.moveTo(flip.x, 0);
  ctx.lineTo(flip.x, PF.PAGE_HEIGHT);
  ctx.quadraticCurveTo(flip.x, PF.PAGE_HEIGHT + (verticalOutdent * 1.9),
      flip.x - horizontalSpread + skew.bottom, PF.PAGE_HEIGHT +
      verticalOutdent);
  ctx.lineTo(flip.x - horizontalSpread + skew.top, -verticalOutdent);
  ctx.quadraticCurveTo(flip.x, -verticalOutdent * 1.9, flip.x, 0);

  ctx.fill();
  ctx.stroke();

  // Draw a sharp shadow of the fold to the left.
  ctx.beginPath();
  ctx.strokeStyle = 'rgba(0,0,0,' + (0.04 * shadowAlpha) + ')';
  ctx.lineWidth = 20 * shadowAlpha;
  ctx.beginPath();
  ctx.moveTo(flip.x + skew.top - horizontalSpread, -verticalOutdent * 0.5);
  ctx.lineTo(flip.x + skew.bottom - horizontalSpread, PF.PAGE_HEIGHT +
      (verticalOutdent * 0.5));
  ctx.stroke();

  // Right side drop shadow gradient.
  var rightShadowGradient = ctx.createLinearGradient(flip.x, 0, flip.x +
      rightShadowWidth, 0);
  rightShadowGradient.addColorStop(0, 'rgba(0,0,0,' + (shadowAlpha * 0.1) +
      ')');
  rightShadowGradient.addColorStop(0.8, 'rgba(0,0,0,0.0)');

  ctx.save();
  ctx.globalCompositeOperation = 'destination-over';

  ctx.fillStyle = rightShadowGradient;
  ctx.beginPath();
  ctx.moveTo(flip.x, 0);
  ctx.lineTo(flip.x + rightShadowWidth, 0);
  ctx.lineTo(flip.x + rightShadowWidth, PF.PAGE_HEIGHT);
  ctx.lineTo(flip.x, PF.PAGE_HEIGHT);
  ctx.fill();

  // Fold drop shadow gradient.
  var foldShadowGradient = ctx.createLinearGradient(flip.x, 0, flip.x +
      foldShadowWidth, 0);
  foldShadowGradient.addColorStop(0, 'rgba(0,0,0,' + (shadowAlpha * 0.15) +
      ')');
  foldShadowGradient.addColorStop(1, 'rgba(0,0,0,0.0)');

  ctx.fillStyle = foldShadowGradient;
  ctx.beginPath();
  ctx.moveTo(flip.x, 0);
  ctx.lineTo(flip.x + foldShadowWidth, 0);
  ctx.lineTo(flip.x + foldShadowWidth, PF.PAGE_HEIGHT);
  ctx.lineTo(flip.x, PF.PAGE_HEIGHT);
  ctx.fill();

  ctx.restore();

  // Left side drop shadow gradient.
  var leftShadowGradient = ctx.createLinearGradient(flip.x - horizontalSpread -
      leftShadowWidth, 0, flip.x - horizontalSpread, 0);
  leftShadowGradient.addColorStop(0, 'rgba(0,0,0,0.0)');
  leftShadowGradient.addColorStop(1, 'rgba(0,0,0,' + (shadowAlpha * 0.05) +
      ')');

  ctx.fillStyle = leftShadowGradient;
  ctx.beginPath();
  ctx.moveTo(flip.x - horizontalSpread + skew.top - leftShadowWidth, 0);
  ctx.lineTo(flip.x - horizontalSpread + skew.top, 0);
  ctx.lineTo(flip.x - horizontalSpread + skew.bottom, PF.PAGE_HEIGHT);
  ctx.lineTo(flip.x - horizontalSpread + skew.bottom - leftShadowWidth,
      PF.PAGE_HEIGHT);
  ctx.fill();

  // Restore the co-ordinate space.
  ctx.restore();

  PF.pageflip.dirtyRegion.inflate(PF.PAGE_WIDTH +
      PF.pageflip.CANVAS_HORIZONTAL_PADDING + flip.x - horizontalSpread -
      leftShadowWidth, 0);
  PF.pageflip.dirtyRegion.inflate(PF.PAGE_WIDTH +
      PF.pageflip.CANVAS_HORIZONTAL_PADDING + flip.x + rightShadowWidth,
      PF.pageflip.CANVAS_HEIGHT);

};

/**
 * Forces any ongoing flip to immediately complete.
 */
PF.pageflip.completeCurrentTurn = function() {
  if (PF.pageflip.turning) {

    // Flag that we are no longer turning.
    PF.pageflip.turning = false;

    var flip = PF.pageflip.flips[PF.pageflip.flips.length - 1];

    if (flip) {

      // Inform the navigation class of the page flip completion.
      //PF.navigation.updateCurrentPointer(flip.currentPage, flip.targetPage);
    }
  }
};


/**
 * Goes through all currently instantiated flips and deletes the ones that are
 * not in use anymore. If there are no active flips left at all, the rendering
 * enginge is deactivated.
 */
PF.pageflip.removeInactiveFlips = function() {

  // Counter for the current number of active flips.
  var activeFlips = 0;

  // Loop through and delete inactive flips.
  for (var i = 0; i < PF.pageflip.flips.length; i++) {

    // Fetch a reference to the current Flip instance.
    var flip = PF.pageflip.flips[i];

    // Has this flip reached its end point?
    if (flip.progress === flip.target && (flip.target === 1 || flip.target ===
        -1)) {
      PF.pageflip.flips.splice(i, 1);
      i--;
    }
    else {
      activeFlips++;
    }
  }

  if (activeFlips == 0) {
    // Deactive redrawing.
    PF.pageflip.deactivate();
  }
};


/**
 * Deactivates the page flip rendering engine.
 */
PF.pageflip.deactivate = function() {
  clearInterval(PF.pageflip.loopInterval);
  PF.pageflip.loopInterval = -1;

  // Make sure that we don't let any drawings remain in the canvas.
  PF.pageflip.context.clearRect(0, 0, PF.pageflip.CANVAS_WIDTH,
      PF.pageflip.CANVAS_HEIGHT);

  // The canvas can not be on top of the HTML content while it is not being]
  // rendered since it would block interaction.
  PF.pageflip.canvas.css('z-index', 0);
};


/**
 * Retrieves the current Flip instance, if there are no instances of Flip, a
 * new one is created.
 *
 * @return {Flip} A flip definition object.
 */
PF.pageflip.getCurrentFlip = function() {
  if (PF.pageflip.flips.length == 0) {

    // There were no flips, so we a create one
    PF.pageflip.createFlip();
  }

  return PF.pageflip.flips[PF.pageflip.flips.length - 1];
};


/**
 * Create flip.
 * @return {Flip} a new flip definition object.
 */
PF.pageflip.createFlip = function() {

  // Remove flips if there are too many going on concurrently.
  if (PF.pageflip.flips.length > 3) {
    PF.pageflip.flips = PF.pageflip.flips.splice(4, 99);
  }

  var flip = new PF.pageflip.Flip();
  PF.pageflip.flips.push(flip);

  return flip;
};



/**
 * The flip class is used to describe one flip animation.
 * @this {Object} Flip class.
 */
PF.pageflip.Flip = function() {
  this.id = Math.round(Math.random() * 1000);
  this.currentPage = $('#pages section.current');
  this.targetPage = $('#pages section.current');
  this.direction = -1;
  this.progress = 1;
  this.target = 1;
  this.strength = 0;
  this.alpha = 1;
  this.type = PF.pageflip.SOFT_FLIP;
  this.x = 0;
  this.consumed = false;
};


/**
 * Defines a rectangular region. Typically used to manage redraw regions.
 * @this {Object} Flip class.
 */
function Region() {
  this.left = 999999;
  this.top = 999999;
  this.right = 0;
  this.bottom = 0;
}


/**
 * Region reset.
 */
Region.prototype.reset = function() {
  this.left = 999999;
  this.top = 999999;
  this.right = 0;
  this.bottom = 0;
};


/**
 * Region iflate.
 * @param {number} x Position.
 * @param {number} y Position.
 */
Region.prototype.inflate = function(x, y) {
  this.left = Math.min(this.left, x);
  this.top = Math.min(this.top, y);
  this.right = Math.max(this.right, x);
  this.bottom = Math.max(this.bottom, y);
};


/**
 * Region contains.
 * @param {number} x Position.
 * @param {number} y Position.
 * @return {boolean} Whether it contains point.
 */
Region.prototype.contains = function(x, y) {
  return x > this.left && x < this.right && y > this.top && y < this.bottom;
};


/**
 * Region toRectangle.
 * @param {number} padding Padding.
 * @return {Object} Calcs.
 */
Region.prototype.toRectangle = function(padding) {
  padding |= 0;

  return {
    x: this.left - padding,
    y: this.top - padding,
    width: this.right - this.left + (padding * 2),
    height: this.bottom - this.top + (padding * 2)
  };
};