// ==UserScript==
// @name           Auto Load Vote Counts Without 1k Rep
// @namespace      Ano
// @description    Automatically shows vote counts on Stack Exchange without requiring an account or 1k+ reputation.
// @match          *://*.stackoverflow.com/questions/*
// @match          *://*.superuser.com/questions/*
// @match          *://*.serverfault.com/questions/*
// @match          *://*.askubuntu.com/questions/*
// @match          *://*.mathoverflow.net/questions/*
// @match          *://*.stackexchange.com/questions/*
// @match          *://*.answers.onstartups.com/questions/*
// @match          *://*.stackapps.com/questions/*
// @match          *://*.stackoverflow.com/review/*
// @match          *://*.superuser.com/review/*
// @match          *://*.serverfault.com/review/*
// @match          *://*.askubuntu.com/review/*
// @match          *://*.mathoverflow.net/review/*
// @match          *://*.stackexchange.com/review/*
// @match          *://*.answers.onstartups.com/review/*
// @match          *://*.stackapps.com/review/*
// @match          *://*.stackoverflow.com/search*
// @match          *://*.superuser.com/search*
// @match          *://*.serverfault.com/search*
// @match          *://*.askubuntu.com/search*
// @match          *://*.mathoverflow.net/search*
// @match          *://*.stackexchange.com/search*
// @match          *://*.answers.onstartups.com/search*
// @match          *://*.stackapps.com/search*
// @exclude        *://area51.stackexchange.com/*
// @author         Ano
// @version        1.0.0
// @run-at         document-end
// @grant          none
// ==/UserScript==

javascript:void(function(doc){
  var head = (doc.head||doc.getElementsByTagName('head')[0]||doc.documentElement);
  var style = doc.createElement('style');
  var css = '/*Added through UserScript*/' + 
            '.js-vote-count{cursor:pointer;}' + 
            '.js-vote-count[title]{cursor:default;}' +
            '.vote-count-separator{height:0;*margin-left:0;}'; /* IE7- */
  head.appendChild(style);

  if (style.styleSheet) {
      /* This is for IE-users.*/
      style.styleSheet.cssText = css;
  } else {
      style.appendChild(doc.createTextNode(css));
  }


  var script = doc.createElement('script');
  script['textContent' in script ? 'textContent' : 'text'] = '(' + function() {
      var api_url = location.protocol + '//api.stackexchange.com/2.0/posts/';
      var api_filter_and_site = '?filter=!)q3b*aB43Xc&key=DwnkTjZvdT0qLs*o8rNDWw((&site=' + location.host;
      var canViewVotes = 1; /* Intercepts click handler when the user doesn't have 1k rep.*/
      var b = StackExchange.helpers;
      var original_click = $.fn.click;
      $.fn.click = function() {
          if (this.hasClass('js-vote-count') && !canViewVotes) return this;
          return original_click.apply(this, arguments);
      };
      var voteCountClickHandler = function(index, this_) {
          //var $this = $(this), t=this.title, $tmp;
          var $this=$(this_), t=this.title, $tmp;
          if (!t) {
              // ...
              var tooltipElemId = $this.attr('aria-describedby');
              if (tooltipElemId) {
                  t = $(document.getElementById(tooltipElemId)).text();
              }
          }
          else if (!$this.find('.vote-counts-shown').length) {
            canViewVotes = 0; /* At this point, not a 1k+ user */
            var postId = $this.siblings('input[type="hidden"]').val();
            if (!postId) {
                // At /review/, for instance:
                // Also at /questions/ as of 2020.
                $tmp = $this.closest('[data-post-id]');
                postId = $tmp.attr('data-post-id');
            }
            if (!postId) {
                // At /review/ of Suggested edits
                $tmp =  $this.closest('.suggested-edit');
                postId = $.trim($tmp.find('.post-id').text());
            }
            if (!postId) {
                // At /questions/tagged/....
                // At /search
                $tmp = $this.closest('.question-summary');
                postId = /\d+/.exec($tmp.attr('id'));
                postId = postId && postId[0];
            }
            if (!postId) {
                console.error('Post ID not found! Please report this at http://stackapps.com/q/3082/9699');
                return;
            }
            $.ajax({
                type: 'GET',
                url: api_url + postId + api_filter_and_site + '&callback=?', /* JSONP for cross-site requests */
                dataType: 'json',
                success: function(json) {
                    console.log(json);
                    json = json.items[0];
                    var up = json.up_vote_count, down = json.down_vote_count;
                    up = up ? '+' + up : 0;       /* If up > 0, prefix a plus sign*/
                    down = down ? '-' + down : 0; /* If down > 0, prefix a minus sign */
                    $this.parent().find('.message-error').fadeOut('fast', function() {
                        $(this).remove();
                    });
                    $this.css('cursor','default').attr('title', up + ' up / ' + down + ' down')
                         .removeClass('c-pointer').off('click')
                         .html('<div class="fc-green-600">' + up + '</div>' +
                               '<div class="vote-count-separator vote-counts-shown"></div>'  +
                               '<div class="fc-red-600">' + down + '</div>');
                },
                error: function(N) {
                    b.showErrorPopup($this.parent(), N.responseText && N.responseText.length < 100 ?
                            N.responseText : 'An error occurred during vote count fetch');
                }
            });
          }
      };
      window.setInterval(() => {
        $(".s-popover__tooltip:contains('View upvote and downvote totals.')").remove();
        $('.js-vote-count').each(voteCountClickHandler);
      }, 1000);
      $('.js-vote-count').each(voteCountClickHandler);
  } + ')();';

  head.appendChild(script);
  script.parentNode.removeChild(script);
})(document);
