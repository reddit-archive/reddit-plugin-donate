!(function(React, Flux, r, $) {
  // instantiate global dispatcher
  var donateDispatcher = new Flux.Dispatcher();

  
  // register stores to dispatcher
  var stores = r.donate.stores;
  stores.nominated.register(donateDispatcher);
  stores.searchResults.register(donateDispatcher);
  stores.charityData.register(donateDispatcher);
  stores.typeAheadSuggest.register(donateDispatcher);
  stores.viewType.register(donateDispatcher);

  // get top-level views and render
  var views = r.donate.DonateViewFactory(donateDispatcher, stores);
  var params = r.donate.getQueryParams();
  $(function() {
    React.renderComponent(
      views.RedditDonateSearch({
        searchQuery: params.ein || '',
      }),
      document.getElementById('reddit-donate-search')
    );

    React.renderComponent(
      views.RedditDonateDisplay(),
      document.getElementById('reddit-donate-display')
    );

    React.renderComponent(
      views.RedditDonateCounter(),
      document.getElementById('reddit-donate-counter')
    );
  });
})(React, Flux, r, jQuery);
