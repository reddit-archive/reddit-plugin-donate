;(function(r) {
  'use strict';

  r.donate = {};

  // hacky hack around server returning jquery junk
  var JQUERY_RESPONSE_ERROR = /^\.error\.([A-Za-z0-9_]+)\.[A-Za-z0-9\-_]*/;

  r.donate.getJqueryResponseErrors = function(res) {
    var parts = res.jquery;

    var errorKey = null;
    var errors = [];
    var step = 0;
    var op, args, matches;

    for (var i = 0, l = parts.length; i < l; i++ ) {
      op = parts[i][2];
      args = parts[i][3];

      switch (step) {
        case 0:
          if (op === 'attr' && args ==='find') {
            step = 1;
          }
        break;
        case 1:
          matches = JQUERY_RESPONSE_ERROR.exec(args[0]);
          if (op === 'call' && matches && matches.length > 1) {
            errorKey = matches[1];
            step = 2;
          } else {
            step = 0;
          }
        break;
        case 2:
          if (op === 'attr' && args === 'text') {
            step = 3;
          }
        break;
        case 3:
          if (op === 'call') {
            errors.push({
              key: errorKey,
              text: args[0],
            });
          }
          step = 0;
        break;
      }
    }

    return errors;
  };

  // utility for getting query params as object
  r.donate.getQueryParams = function() {
    return window.location.search.slice(1)
                                 .split('&')
                                 .reduce(function(params, segment) {
      var parts = segment.split('=');
      if (parts.length > 1) {
        params[parts[0]] = decodeURIComponent(parts.slice(1).join('='));
      }
      return params;
    }, {});
  };
})(window.r);
