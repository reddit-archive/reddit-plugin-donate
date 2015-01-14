/* jshint newcap:false */

!function(React, Flux, r, $, _) {
  'use strict';

  // import react elements for brevity in the render methods
  var A = React.DOM.a;
  var Button = React.DOM.button;
  var CSSTransitionGroup = React.addons.CSSTransitionGroup;
  var Div = React.DOM.div;
  var H2 = React.DOM.h2;
  var Input = React.DOM.input;
  var Li = React.DOM.li;
  var P = React.DOM.p;
  var Small = React.DOM.small;
  var Span = React.DOM.span;
  var Strong = React.DOM.strong;
  var Ul = React.DOM.ul;


  // some config
  var MIN_QUERY_LENGTH = 3;
  var EIN_QUERY_CHECK = /^[0-9]{3}/;
  var LOGGED_IN = r.config.logged;
  var ACCOUNT_IS_ELIGIBLE = r.config.accountIsEligible;
  var SEARCH_DEBOUNCE_TIME = 500;


  var CharityCardMetaData = React.createClass({
    displayName: 'CharityCardMetaData',

    render: function() {
      return Li(null,
        P(null, this.props.children)
      );
    },
  });

  var CharityRatingStar = React.createClass({
    displayName: 'CharityRatingStar',

    getDefaultProps: function() {
      return {
        active: false,
      };
    },

    render: function() {
      var classes = React.addons.classSet({
        'charity-rating-star': true,
        'active': this.props.active,
      });
      return Div({ className: classes });
    },
  });

  var CharityRating = React.createClass({
    displayName: 'CharityRating',

    getDefaultProps: function() {
      return {
        rating: 0,
        givewellRecommended: false,
      };
    },

    render: function() {
      var rating = parseInt(this.props.rating);

      return Div({ className: 'charity-rating' },
        Small({ className: 'label' }, 'Charity Navigator score'),
        CharityRatingStar({ active: rating >= 1 }),
        CharityRatingStar({ active: rating >= 2 }),
        CharityRatingStar({ active: rating >= 3 }),
        CharityRatingStar({ active: rating >= 4 }),
        this.props.givewellRecommended ?
          A({
            className: 'givewell-recommended-badge',
            title: 'Top-rated GiveWell Charity',
            href: 'http://www.givewell.org',
            target: 'blank',
          }) : null
      );
    },
  });

  var CharityCard = React.createClass({
    displayName: 'CharityCard',

    getDefaultProps: function() {
      return {
        Category: '',
        Cause: '',
        City: '',
        DisplayName: '',
        EIN: null,
        Nominated: false,
        OverallRtg: '',
        State: '',
        Tag_Line: '',
        URL: '',
      };
    },

    getInitialState: function() {
      return {
        errors: null,
      };
    },

    handleButtonClick: function() {
      if (this.props.onButtonClick instanceof Function) {
        var ein = this.props.EIN;
        var isNominated = this.props.Nominated;

        this.props.onButtonClick(ein, isNominated, this.setErrors);
      }
    },

    setErrors: function(errors) {
      this.setState({
        errors: errors && errors.length ? errors : null,
      });
    },

    renderButton: function() {
      var button;
      var isNominated = this.props.Nominated;

      var classes = React.addons.classSet({
        'charity-nominate-button button': true,
        'login-required': !LOGGED_IN,
        'nominated': isNominated,
      });

      if (!LOGGED_IN) {
        button = A({
            className: classes,
            href: '/donate?ein=' + encodeURIComponent(this.props.EIN),
          },
          r._('Log In to Nominate')
        );
      } else if (!ACCOUNT_IS_ELIGIBLE) {
        button = null;
      } else {
        var buttonText = null;

        if (isNominated) {
          buttonText = Span({ className: 'button-group' },
            Span({ className: 'button-text button-text-default' },
              r._('Nominated!')
            ),
            Span({ className: 'button-text button-text-hover' },
              r._('Remove nomination?')
            )
          );
        } else {
          buttonText = r._('Nominate this Charity');
        }

        var buttonIcon = null;

        if (isNominated) {
          buttonIcon =  Div({ className: 'donate-icon checkmark' });
        }

        button = Button({
            className: classes,
            onClick: this.handleButtonClick,
          },
          buttonIcon,
          buttonText
        );
      }

      return Div({ className: 'buttons' }, button);
    },

    renderMetaData: function() {
      var locationParts = [];
      var metaComponents = [];

      if (this.props.EIN) {
        metaComponents.push(CharityCardMetaData(null,
          'EIN: ' + this.props.EIN
        ));
      }

      if (this.props.City) {
        locationParts.push(this.props.City);
      }

      if (this.props.State) {
        locationParts.push(this.props.State);
      }

      if (locationParts.length) {
        metaComponents.push(CharityCardMetaData(null,
          'Location: ' + locationParts.join(', ')
        ));
      }

      if (this.props.Category) {
        metaComponents.push(CharityCardMetaData(null,
          'Category: ' + this.props.Category
        ));
      }

      if (this.props.Cause) {
        metaComponents.push(CharityCardMetaData(null,
          'Cause: ' + this.props.Cause
        ));
      }

      if (this.props.URL) {
        metaComponents.push(CharityCardMetaData(null,
          A({
            href: this.props.URL,
            target: 'blank',
          }, 'More info on Charity Navigator')
        ));
      }

      if (metaComponents.length) {
        return Ul({ className: 'charity-meta' }, metaComponents);
      } else {
        return null;
      }
    },

    renderErrors: function() {
      if (this.state.errors) {
       return Div({ className: 'errors' },
          this.state.errors.map(function(error) {
            return Div({ className: 'error ' + error.key },
              error.text
            );
          })
        );
      } else {
        return null;
      }
    },

    render: function() {
      var classes = React.addons.classSet({
        'charity-card md': true,
        'nominated': this.props.Nominated,
        'error': this.state.errors,
      });

      return Div({ className: classes },
        H2({ className: 'charity-name' }, _.unescape(this.props.DisplayName)),
        this.props.unloaded ?
          r._('loading...') : null,
        this.props.Tag_Line ?
          P({ className: 'charity-tag-line' }, this.props.Tag_Line) : null,
        this.renderMetaData(),
        this.renderErrors(),
        this.renderButton(),
        this.props.OverallRtg || this.props.givewellRecommended ?
          CharityRating({
            rating: this.props.OverallRtg,
            givewellRecommended: this.props.givewellRecommended,
          }) : null
      );
    },
  });

  /*
    The top-level components that are part of the flux flow are wrapped in a
    factory function so the dispatcher/store dependencies can be injected
   */
  r.donate.DonateViewFactory = function(donateDispatcher, stores) {
    // import stores from donate-stores module
    var nominated = stores.nominated;
    var searchResults = stores.searchResults;
    var charityData = stores.charityData;
    var typeAheadSuggest = stores.typeAheadSuggest;
    var viewType = stores.viewType;


    // top-level views that interact with the flux dispatcher and data stores
    var RedditDonateCounter = React.createClass({
      displayName: 'RedditDonateCounter',

      mixins: [
        Flux.UseStores(nominated),
      ],

      viewNominations: function() {
        if (nominated.state.unloadedCount) {
          $.get('donate/nominations.json', function(results) {
            donateDispatcher.dispatch({
              actionType: 'update-nominated',
              nominations: results,
            });
          }.bind(this));
        } else {
          donateDispatcher.dispatch({
            actionType: 'set-view-type',
            viewingSearch: false,
          });
        }
      },

      render: function() {
        var unloadedCount  = nominated.state.unloadedCount;
        var nominationCount = nominated.state.list.length + unloadedCount;
        var message = null;

        if (LOGGED_IN && ACCOUNT_IS_ELIGIBLE) {
          if (nominationCount === 1) {
            message =  r._('you\'ve nominated 1 charity');
          } else {
            message = r._('you\'ve nominated %(nominations)s charities').format({
              nominations: nominationCount,
            });
          }

          message = Strong(null, message);
        } else if (!LOGGED_IN) {
          message = r._('you must be logged in to nominate charities!');
        } else {
          message = r._('your account is not old enough to participate');
        }

        return Div({ className: 'reddit-donate-nominations' },
          message,
          nominationCount ?
            A({ onClick: this.viewNominations }, r._('view nominations')) : null
        );
      },
    });

    var RedditDonateSearch = React.createClass({
      displayName: 'RedditDonateSearch',

      mixins: [
        Flux.UseStores(viewType, typeAheadSuggest, nominated, searchResults),
      ],

      getInitialState: function() {
        return {
          searchQuery: this.props.searchQuery || '',
          searchQueryType: 'name',
        };
      },

      componentWillMount: function() {
        if (this.props.searchQuery) {
          this.search(this.props.searchQuery, true);
        }
      },

      handleKeyDown: function(e) {
        switch (e.keyCode) {
          // enter
          case 13:
            e.preventDefault();
            this.submitSearch();
          break;
          // tab
          case 9:
            var typeAhead = this.getTypeAhead();
            if (typeAhead) {
              this.refs.search.getDOMNode().value = typeAhead;
              this.search(typeAhead, true);
              e.preventDefault();
            }
          break;
        }
      },

      getTypeAhead: function() {
        var typeAhead = null;

        if (this.state.searchQuery && this.state.searchQueryType === 'name' &&
            viewType.state.viewingSearch) {
          typeAhead = typeAheadSuggest.state.suggestion;
        }

        return typeAhead ? _.unescape(typeAhead) : null;
      },

      updateSearchQuery: function() {
        this.search(this.refs.search.getDOMNode().value);
      },

      submitSearch: function() {
        this.search(this.refs.search.getDOMNode().value, true);
      },

      viewSearch: function() {
        donateDispatcher.dispatch({
          actionType: 'set-view-type',
          viewingSearch: true,
        });
      },

      search: function(query, force) {
        query = query.trim();
        force = force || false;

        if (query && query.length >= MIN_QUERY_LENGTH) {
          var type = EIN_QUERY_CHECK.test(query) ? 'ein' : 'name';

          if (type === 'name' || force) {
            this._getSearchResults(query, type);
          }

          this.setState({
            searchQuery: query,
            searchQueryType: type,
          });
        } else {
          // when clearing the search input, only keep around the previous
          // results if there _were_ results
          if (this.state.searchQuery && searchResults.state.list.length === 0) {
            donateDispatcher.dispatch({
              actionType: 'update-search-results',
              results: [],
              query: null,
              queryType: 'name',
            });
          }

          this.setState({
            searchQuery: null,
            searchQueryType: 'name'
          });
        }
      },

      _getSearchResults: _.debounce(function(query, type) {
        var lowerQuery = query.toLowerCase();
        var apiEndpoint;
        if (type === 'ein') {
          apiEndpoint = '/donate/organizations/' + lowerQuery + '.json';
          $.get(apiEndpoint, this.handleEINLookup);
        } else {
          apiEndpoint = '/donate/organizations.json';
          $.get(apiEndpoint, { prefix: lowerQuery }, this.handleSearchResults);
        }
      }, SEARCH_DEBOUNCE_TIME),

      handleEINLookup: function(response) {
        var results = [];

        if (!(response.json && response.json.errors)) {
          results.push(response);
        }

        this.handleSearchResults(results);
      },

      handleSearchResults: function(results) {
        donateDispatcher.dispatch({
          actionType: 'update-search-results',
          results: results,
          query: this.state.searchQuery,
          queryType: this.state.searchQueryType,
        });
      },

      focus: function() {
        // fixes an IE8 preventing the search input from being focused by click
        this.refs.search.getDOMNode().focus();
      },

      render: function() {
        var queryType = this.state.searchQueryType;
        var typeAhead = this.getTypeAhead();
        var query = this.state.searchQuery;
        var suggestion = null;

        if (typeAhead && query) {
          var lowerQuery = query.toLowerCase();
          var indexOfQuery = typeAhead.toLowerCase().indexOf(lowerQuery);
          var typeAheadContainsQuery = typeAhead && query && indexOfQuery >= 0;

          if (typeAheadContainsQuery) {
            suggestion = query + typeAhead.slice(query.length + indexOfQuery);
          }
        }

        var viewingSearch = viewType.state.viewingSearch;
        var autoComplete = queryType === 'name';
        var returnToSearchLink = null;
        var searchButtonClasses = React.addons.classSet({
          'search-button button': true,
          'auto': autoComplete,
          'manual': !autoComplete,
        });
        var subTextClasses = React.addons.classSet({
          'search-input-subtext md': true,
          'viewing-nominated': !viewingSearch,
          'search-results-type': viewingSearch,
        });
        var subTextKey = 'results-by-' + queryType;
        var subText;


        if (!viewingSearch) {
          subText = r._('viewing your %(nominations)s nominations').format({
            nominations: nominated.state.list.length,
          });
        } else if (queryType === 'name' && searchResults.state.list.length) {
          subText =  r._('viewing %(results)s search results').format({
            results: searchResults.state.list.length,
          });
        } else {
          subText =  r._('searching by %(queryType)s. autocomplete %(auto)s.').format({
            queryType: queryType,
            auto: autoComplete ? 'enabled' : 'disabled',
          });
        }

        if (!viewingSearch) {
          returnToSearchLink = A({ onClick: this.viewSearch },
            r._('back to search')
          );
        }

        return Div(null,
          Div({
              className: 'reddit-donate-search',
              style: {
                display: viewingSearch ? 'flex' : 'none',
              },
            },
            Div({ className: 'search-input-group' },
              Input({
                className: 'search-input-typeahead',
                autoComplete: false,
                disabled: true,
                onClick: this.focus,
                type: 'search',
                value: suggestion,
              }),
              Input({
                className: 'search-input',
                onInput: this.updateSearchQuery,
                onKeyDown: this.handleKeyDown,
                placeholder: r._('search by charity name or ein'),
                ref: 'search',
                type: 'search',
                defaultValue: this.state.searchQuery,
              })
            ),
            Button({
                className: searchButtonClasses,
                onClick: this.submitSearch,
              }, 'search')
          ),
          Div({ className: 'md-container' },
            Div({ 
                className: subTextClasses,
                key: subTextKey,
              },
              subText,
              returnToSearchLink
            )
          )
        );
      },
    });

    var RedditDonateDisplay = React.createClass({
      displayName: 'RedditDonateDisplay',

      mixins: [
        Flux.UseStores(viewType, searchResults, nominated, charityData),
      ],

      setNominationState: function(ein, isNominated, callback) {
        // nominateCharity: function() {
        var action;
        var apiEndpoint;

        if (!isNominated) {
          action = 'nominate-charity';
          apiEndpoint = 'donate/nominate';
        } else {
          action = 'remove-nomination';
          apiEndpoint = 'donate/unnominate';
        }

        $.request(apiEndpoint, { organization: ein }, function(res) {
          var errors = r.donate.getJqueryResponseErrors(res);

          if (!errors.length) {
            donateDispatcher.dispatch({
              actionType: action,
              ein: ein,
            });
          }

          callback(errors);
        });
      },

      render: function() {
        return Div({ className: 'reddit-donate-display' },
          this.renderCharityCardList()
        );
      },

      renderCharityCardList: function() {
        var viewingSearch = viewType.state.viewingSearch;
        var source = viewingSearch ? searchResults : nominated;
        var charityCards = source.state.list;

        if (charityCards && charityCards.length) {
          var classes = React.addons.classSet({
            'charity-card-list md-container': true,
            'search-results': viewingSearch,
            'nominations': !viewingSearch,
          });
          return CSSTransitionGroup({
              component: Div,
              className: classes,
              key: 'results',
              transitionName: 'charity-card-animation',
              transitionEnter: false,
            },
            charityCards.map(this.renderCharityCard)
          );
        } else {
          var query = searchResults.state.query;
          var message;

          if (!viewingSearch) {
            message = r._('you haven\'t nominated any charities yet!');
          } else if (!query || query.trim().length < MIN_QUERY_LENGTH) {
            message = r._('search by charity name or EIN!');
          } else if (searchResults.state.queryType === 'ein') {
            message = r._('we couldn\'t find the charity with that EIN.  sorry.');
          } else {
            message = [
              P(null, r._('we couldn\'t find any charities by that name.')),
              Small(null, r._('try searching by EIN instead!')),
            ];
          }

          return Div({
              className: 'no-search-results',
              key: 'no-results',
            },
            Div({ className: 'message md'}, message)
          );
        }
      },

      renderCharityCard: function(result) {
        var ein = result.EIN;
        var data = charityData.state.byEIN[ein];

        var props = _.extend({
          key: 'charity-' + result.EIN,
          onButtonClick: this.setNominationState,
        }, data);

        return CharityCard(props);
      },
    });


    // export
    return {
      RedditDonateCounter: RedditDonateCounter,
      RedditDonateSearch: RedditDonateSearch,
      RedditDonateDisplay: RedditDonateDisplay,
    };
  };
}(React, Flux, r, jQuery, _);
