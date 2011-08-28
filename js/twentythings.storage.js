// Copyright 2011 Google Inc.
// This program is free software; you can redistribute it and/or
// modify it under the terms of the GNU General Public License
// as published by the Free Software Foundation; either version 2
// of the License, or (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program; if not, write to the Free Software
// Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301,
// USA.

/**
 * @fileoverview Manages the downloading and storage of the book contents.
 *
 * The first time the user visits the application, content will be downloaded
 * from the server and stored locally on the client's machine using HTML5's
 * Local Storage API. Beyond downloading pure content, we also store a version
 * number for the content on the client.
 *
 * During each subsequent visit, we check if the version number available
 * locally is different than the one on the server; if it is we download the
 * content anew and update local storage.
 *
 * Finally, we also store information on which chapters that have been read so
 * that we can prompt the user to continue reading where they left off when
 * returning.
 *
 * @author erik.kallevig@f-i.com (Erik Kallevig)
 * @author hakim.elhattab@f-i.com (Hakim El Hattab)
 */


/**
 * Sub-namespace.
 * @type {Object}
 */
TT.storage = {};


/**
 * First time visitor flag.
 */
TT.storage.isFirstTimeVisitor = true;


/**
 * Storage contents.
 */
TT.storage.contents = '';


/**
 * Article list.
 */
TT.storage.data = {
  articles: {}, // Contains deeplink:html pairs
  progress: {}, // Contains deeplink:read_flag pairs
  bookmark: {
    articleId: '',
    pageNumber: ''
  }
};


/**
 * Initialize storage class.
 */
TT.storage.initialize = function() {
  TT.storage.routeDataRequest();
};


/**
 * Load local storage data.
 */
TT.storage.load = function() {
  if (TT.storage.supportsLocalStorage() && localStorage.data) {
    TT.storage.data = $.parseJSON(localStorage.data);
  }
};


/**
 * Save local storage data.
 */
TT.storage.save = function() {
  if (TT.storage.supportsLocalStorage()) {
    //localStorage.data = $.toJSON(TT.storage.data);
  }
};


/**
 * Check for localStorage support.
 * @return {boolean} Whether UA supports local storage.
 */
TT.storage.supportsLocalStorage = function() {
  return ('localStorage' in window) && window['localStorage'] !== null;
};


/**
 * Get articles from server, append to DOM and put in local storage.
 */
TT.storage.getArticlesFromServer = function() {
  TT.log('Getting articles from server');

  // Get a fresh listing of all disabled articles.
  var disabledArticles = TT.chapternav.getDisabledArticles();
/*
  $.ajax({
    url: '/' + SERVER_VARIABLES.LANG + '/all',
    contentType: 'text/html;charset=UTF-8',
    success: function(data) {
*/
     var data="<article id=\"foreword\"><section class=\"template-start-7 title-foreword page-1\"><div class=\"page\"><div class=\"page-title\"><h2>Foreword to 20 Things</h2></div><div class=\"image1\"><img src=\"\" data-src=\"css/images/cloud01.png\" /></div><div class=\"left\"><p class=\"drop-cap\">Many of us these days depend on the World Wide Web to bring the world’s information to our fingertips, and put us in touch with people and events across the globe instantaneously.</p></div>\"<div class=\"right\"><p class=\"continuation\">These powerful online experiences are possible thanks to an open web that can be accessed by anyone through a web browser, on any Internet-connected device in the world.</p> </div></div></section><section class=\"template-inner-6 title-foreword page-2\"><div class=\"page\">﻿<div class=\"left\"><p class=\"continuation\">But how do our browsers and the web actually work? How has the World Wide Web evolved into what we know and love today? And what do we need to know to navigate the web safely and efficiently?</p><p>“20 Things I Learned About Browsers and the Web” is a short guide for anyone who’s curious about the basics of browsers and the web.  Here’s what you’ll find here:</p><p>First we’ll look at the Internet, the very backbone that allows the web to exist. We’ll also take a look at how the web is used today, through cloud computing and web apps.</p></div><div class=\"right\"><p>Then, we’ll introduce the building blocks of web pages like HTML and JavaScript, and review how their invention and evolution have changed the websites you visit every day.  We’ll also take a look at the modern browser and how it helps users browse the web more safely and securely.</p><p>Finally, we’ll look ahead to the exciting innovations in browsers and web technologies that we believe will give us all even faster and more immersive online experiences in the future.</p></div></div></section><section class=\"template-inner-7 title-foreword page-3\"><div class=\"page\">﻿<p>Life as citizens of the web can be liberating and empowering, but also deserves some self-education. Just as we’d want to know various basic facts as citizens of our physical neighborhoods -- water safety, key services, local businesses -- it’s increasingly important to understand a similar set of information about our online lives.  That’s the spirit in which we wrote this guide. Many of the examples used to illustrate the features and functionality of the browser often refer back to Chrome, the open-source browser that we know well. We hope you find this guide as enjoyable to read as we did to create.</p><p class=\"continuation\">Happy browsing!</p><div class=\"spacer\" /><p class=\"continuation\"><em>The Google Chrome Team, with many thanks to Christoph Niemann for his illustrations</em></p><p class=\"continuation\"><em>November 2010</em></p></div></section></article><article id=\"what-is-the-internet\"><section class=\"template-start-7 title-what-is-the-internet page-1\"><div class=\"page\"><div class=\"page-title\"><h2>What is the Internet?</h2><h3>or, \"You Say Tomato, I Say TCP/IP\"</h3></div><div class=\"image1\"><img src=\"\" data-src=\"css/images/internet01.png\" /></div> <div class=\"left\"> 	<p class=\"drop-cap\">What is the Internet, exactly? To some of us, the Internet is where we stay in touch with friends, get the news, shop, and play games. To some others, the Internet can mean their local broadband providers, or the underground wires and fiber-optic cables that</p> </div> <div class=\"right\"> 	<p class=\"continuation\">carry data back and forth across cities and oceans. Who is right?</p> 	<p>A helpful place to start is near the Very Beginning: 1974.  That was the year that a few smart computer researchers invented something called the Internet Protocol Suite, or TCP/IP for</p> </div></div></section><section class=\"template-inner-5 title-what-is-the-internet page-2\"><div class=\"page\">﻿<div class=\"left\">	<p class=\"continuation\">short. TCP/IP created a set of rules that allowed computers to “talk” to each other and send information back and forth.</p>	<p>TCP/IP is somewhat like human communication: when we speak to each other, the rules of grammar provide structure to language and ensure that we can understand each other and exchange ideas. Similarly, TCP/IP provides the rules of communication that ensure interconnected devices understand each other so that they can send information back and forth. As that group of interconnected devices grew from one room to many rooms — and then to many buildings, and then to many cities and countries — the Internet was born.</p></div><div class=\"right\"><p>The early creators of the Internet discovered that data and information could be sent more efficiently when broken into smaller chunks, sent separately, and reassembled. Those chunks are called <strong>packets</strong>.  So when you send an email across the Internet, your full email message is broken down into packets, sent to your recipient, and reassembled. The same thing happens when you watch a video on a website like YouTube: the video files are segmented into data packets that can be sent from multiple YouTube servers around the world and reassembled to form the video that you watch through your browser.</p></div></div></section></article>";
      var globalPageCounter = 0;

      TT.storage.data.articles = {};

      $(data).each(function() {
        var articleId = $(this).attr('id');
        $(this).find('section').each(function(i) {
          globalPageCounter++;

          $(this).addClass('globalPage-' + globalPageCounter).css('zIndex',
              500 - globalPageCounter).hide();

          // If local storage is supported, save the content for this page.
          if (TT.storage.supportsLocalStorage()) {
            TT.storage.data.articles['/' + articleId + '/' + (i + 1)] =
                $('<div>').append($(this).clone()).remove().html();
          }

          var articleIsDisabled = false;

          // Check if this article is disabled.
          for (var i = 0; i < disabledArticles.length; i++) {
            if (disabledArticles[i] == articleId) {
              articleIsDisabled = true;
            }
          }

          // Only render the article if its not disabled.
          if (articleIsDisabled == false) {
            $('#pages').append($('<div>').append($(this).clone()).remove()
                .html());
          }
        });
      });

      TT.storage.save();

      TT.storage.onFindBookmark();
      TT.storage.activateCurrentPageAndSetPageCount();
    //}
  //});
};


/**
 * Get articles from server translated.
 */
TT.storage.getArticlesFromServerTranslated = function() {
  TT.log('getting articles from server');

  // Get a fresh listing of all disabled articles.
  var disabledArticles = TT.chapternav.getDisabledArticles();

  $.ajax({
    url: '/all',
    contentType: 'text/html;charset=UTF-8',
    success: function(data) {

      var globalPageCounter = 0;

      TT.storage.data.articles = {};

      $(data).each(function() {
        var articleId = $(this).attr('id');
        $(this).find('section').each(function(i) {
          globalPageCounter++;

          $(this).addClass('globalPage-' +
              globalPageCounter).css('zIndex', 500 - globalPageCounter).hide();

          // If local storage is supported, save the content for this page.
          if (TT.storage.supportsLocalStorage()) {
            TT.storage.data.articles['/' + articleId + '/' + (i + 1)] =
                $('<div>').append($(this).clone()).remove().html();
          }

          var articleIsDisabled = false;

          // Check if this article is disabled.
          for (var i = 0; i < disabledArticles.length; i++) {
            if (disabledArticles[i] == articleId) {
              articleIsDisabled = true;
            }
          }

          // Only render the article if its not disabled.
          if (articleIsDisabled == false) {
            $('#pages').append($('<div>')
                .append($(this).clone()).remove().html());
          }
        });
      });

      TT.storage.save();

      TT.storage.onFindBookmark();
      TT.storage.activateCurrentPageAndSetPageCount();

    }
  });
};


/**
 * Get articles from local storage and append to DOM.
 */
TT.storage.getArticlesFromStorage = function() {
  TT.log('Getting articles from storage');

  // Flag that this is not a first time visitor.
  TT.storage.isFirstTimeVisitor = false;

  if (localStorage.data) {
    TT.storage.data = $.parseJSON(localStorage.data);
  }
  else {

    // If there is no data in local storage we have to update.
    TT.storage.getArticlesFromServer();
    return;
  }

  // Get a fresh listing of all disabled articles.
  var disabledArticles = TT.chapternav.getDisabledArticles();

  for (var articlePath in TT.storage.data.articles) {
    var articleIsDisabled = false;

    // Check if this article is disabled.
    for (var i = 0; i < disabledArticles.length; i++) {
      if (disabledArticles[i] == articlePath.split('/')[1]) {
        articleIsDisabled = true;
      }
    }

    // Only render the article if its not disabled.
    if (articleIsDisabled == false) {
      $('#pages').append(TT.storage.data.articles[articlePath]);
    }

  }

  TT.storage.onFindBookmark();
  TT.storage.activateCurrentPageAndSetPageCount();

};


/**
 * Route data request to server or local storage.
 */
TT.storage.routeDataRequest = function() {

  if (!TT.storage.supportsLocalStorage()) {

    TT.storage.getArticlesFromServer();

  } else {

    TT.log('Version on server is: ' + SERVER_VARIABLES.SITE_VERSION);

    if (SERVER_VARIABLES.SITE_VERSION != localStorage.version ||
        SERVER_VARIABLES.LANG != localStorage.lang) {
      localStorage.version = SERVER_VARIABLES.SITE_VERSION;
      localStorage.lang = SERVER_VARIABLES.LANG;
      TT.storage.getArticlesFromServer();
    } else {
      TT.storage.getArticlesFromStorage();
    }

  }
};


/**
 * Take original article and insert into dynamically loaded list;
 * set current page number.
 */
TT.storage.activateCurrentPageAndSetPageCount = function() {
  var $origArticle = $('#pages section').eq(0);
  $origArticle.attr('id', 'original');

  $('#pages section:not(#original)').each(function(i) {
    if ($(this).hasClass($origArticle.attr('class'))) {
      $origArticle.remove();
      $(this).addClass('current').show().next('section').show();
      $('<span id="currentPage">' + parseFloat(i + 1) + '</span>')
          .appendTo('body');
    }
  });

  if ($('#pages section.current').length === 0) {
    $('#pages section').first().addClass('current');
  }

  $('#pages section div.page').each(function(i) {
    $(this).append('<span class="pageNumber">' + (i + 1) + '</span>');
  });


  // If the app starts with a "view" class (home/credits) then we need to
  // manually select the current page.
  if ($('body').hasClass('home')) {
    $('#pages section').removeClass('current');
    $('#pages section').first().addClass('current');
  }
  else if ($('body').hasClass('credits')) {
    $('#pages section').removeClass('current');
    $('#pages section').last().addClass('current');
  }

  TT.preloader.onContentsLoaded();
};


/**
 * Check for bookmark and prompt to resume.
 */
TT.storage.onFindBookmark = function() {
  if (TT.storage.supportsLocalStorage()) {
    if (TT.storage.data.bookmark.articleId &&
        $('#pagination-prev').hasClass('inactive') &&
        !(TT.storage.data.bookmark.articleId == $('#articleId').text() &&
        TT.storage.data.bookmark.pageNumber == $('#pageNumber').text())) {

      TT.log('Bookmark found: ' + TT.storage.data.bookmark.articleId + '/' +
          TT.storage.data.bookmark.pageNumber);

      // Show the bookmark and await callbacks.
      TT.overlay.showBookmark(function() {

        // Continuie handler.
        TT.navigation.goToPage(TT.storage.data.bookmark.articleId,
            TT.storage.data.bookmark.pageNumber);
      }, function() {

        // Restart handler.
        TT.navigation.goToHome();
      }, function() {

        // Cancel handler
        TT.storage.setBookmark($('#articleId').text(), $('#pageNumber').text());
      });

      TT.log('Bookmark found: ' + TT.storage.data.bookmark.articleId + '/' +
          TT.storage.data.bookmark.pageNumber);
    }
    else {
      TT.storage.setBookmark($('#articleId').text(), $('#pageNumber').text());
    }
  }
};


/**
 * Set bookmark and read/unread state.
 * @param {string} articleId Article ID.
 * @param {number} pageNumber Page number.
 */
TT.storage.setBookmark = function(articleId, pageNumber) {
  if (TT.storage.supportsLocalStorage() && articleId != TT.history.THEEND) {

    // Set data.
    TT.storage.data.bookmark.articleId = articleId;
    TT.storage.data.bookmark.pageNumber = pageNumber;
    TT.storage.data.progress['/' + articleId + '/' + pageNumber] = true;

    // Save data.
    TT.storage.save();

    TT.chapternav.updateReadMarkers();
    TT.tableofthings.updateReadMarkers();
  }
};


/**
 * Check if article has been read.
 * @param {string} articleId Article ID.
 * @return {boolean} Whether article has been read.
 */
TT.storage.hasArticleBeenRead = function(articleId) {
  return TT.storage.data.progress['/' + articleId + '/1'] == true;
};