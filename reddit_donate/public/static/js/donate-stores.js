!function(r, Flux, _) {
  'use strict';

  var searchResults = new Flux.Store({
    getDefaultState: function() {
      return {
        query: '',
        queryType: 'name',
        list: [],
      };
    },

    receive: function(payload) {
      switch (payload.actionType) {
        case 'update-search-results':
          this.setState({
            query: payload.query,
            queryType: payload.queryType,
            list: payload.results,
          });
        break;
      }
    },
  });

  var nominated = new Flux.Store({
    getDefaultState: function() {
      return {
        unloadedCount: parseInt(r.config.unloadedNominations, 10) || 0,
        list: [],
      };
    },

    receive: function(payload) {
      var ein, charity, nominations, unloadedCount;

      switch (payload.actionType) {
        case 'update-nominated':
          this.setState({
            list: payload.nominations,
            unloadedCount: 0,
          });
        break;
        case 'remove-nomination':
          ein = payload.ein;

          charity = charityData.state.byEIN[ein];
          nominations = this.state.list;
          unloadedCount = this.state.unloadedCount;

          if (charity && charity.Nominated) {
            charity.Nominated = false;

            if (unloadedCount) {
              this.setState({
                unloadedCount: unloadedCount - 1,
              });
            } else {
              nominations.splice(nominations.indexOf(charity), 1);
              this.setState({
                list: nominations,
              });
            }
          } else {
            // what happened here?
            this.forceUpdate();
          }
        break;
        case 'nominate-charity':
          ein = payload.ein;

          charity = charityData.state.byEIN[ein];
          nominations = this.state.list;
          unloadedCount = this.state.unloadedCount;

          if (charity && !charity.Nominated) {
            charity.Nominated = true;

            if (unloadedCount) {
              this.setState({
                unloadedCount: unloadedCount + 1,
              });
            } else {
              nominations.push(charity);
              this.setState({
                list: nominations,
              });
            }
          } else {
            // what happened here?
            this.forceUpdate();
          }
        break;
      }
    },
  });

  var charityData = new Flux.Store({
    getInitialState: function() {
      return {
        byEIN: {},
      };
    },

    getCharityDataByEin: function(/* sources */) {
      var sources = _.toArray(arguments);
      var cache = {};

      sources.forEach(function(source) {
        source.state.list.reduce(function(cache, data) {
          cache[data.EIN] = data;
          return cache;
        }, cache);
      });

      return cache;
    },

    receive: function(payload) {
      switch (payload.actionType) {
        case 'update-nominated':
        case 'update-search-results':
          this.setState({
            byEIN: this.getCharityDataByEin(searchResults, nominated),
          });
        break;
      }
    },
  });

  var typeAheadSuggest = new Flux.Store({
    getDefaultState: function() {
      return {
        suggestion: null,
      };
    },

    receive: function(payload) {
      switch (payload.actionType) {
        case 'update-search-results':
          var suggestion = null;
          
          if (payload.results.length) {
            suggestion = payload.results[0].DisplayName;
          }

          this.setState({
            suggestion: suggestion,
          });
        break;
      }
    }
  });

  var viewType = new Flux.Store({
    getDefaultState: function() {
      return {
        viewingSearch: true,
      };
    },

    receive: function(payload) {
      switch (payload.actionType) {
        case 'set-view-type':
          this.setState({
            viewingSearch: payload.viewingSearch,
          });
        break;
        case 'update-nominated':
          this.setState({
            viewingSearch: false,
          });
        break;
      }
    },
  });

  r.donate = r.donate || {};
  r.donate.stores = {
    nominated: nominated,
    searchResults: searchResults,
    charityData: charityData,
    typeAheadSuggest: typeAheadSuggest,
    viewType: viewType,
  };
}(r, Flux, _);
