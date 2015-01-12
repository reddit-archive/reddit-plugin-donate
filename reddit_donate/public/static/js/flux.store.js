!function(Flux, Backbone, _) {
  'use strict';

  if (typeof Flux.Store !== 'undefined') {
    throw 'Existing Flux.Store implementation found!';
  }

  /**
   * Flux Store implementation
   * uses Backbone.Model for event handling and state
   */
  function FluxStore(descriptor) {
    var initialState;

    if (descriptor.getDefaultState) {
      initialState = descriptor.getDefaultState();
    } else {
      initialState = {};
    }

    this.model = new Backbone.Model();
    this.state = this.model.attributes;

    if (initialState) {
      _.extend(this.model.attributes, initialState);
    }

    _.extend(this, descriptor);
  }

  _.extend(FluxStore.prototype, {
    setState: function(newState) {
      this.model.set(newState);

      // force update any time we set a state attribute with an object, since
      // that's easier that doing a deep equality check
      for (var key in newState) {
        if (typeof newState[key] === 'object') {
          if (typeof this.model.changed[key] === 'undefined') {
            return this.forceUpdate();
          }
        }
      }

      this.state = this.model.attributes;
    },

    forceUpdate: function() {
      this.state = this.model.attributes;
      this.model.trigger('change', this.model, this.state);
    },

    register: function(dispatcher) {
      this.dispatchToken = dispatcher.register(this.receive.bind(this));
    },
  });


  /**
   * Mixin factory for binding react component classes to flux store state.
   * Pass one or more flux store instances and get a mixin back that will
   * force the component to update whenever any of the stores change
   */

  function UseStores(/* stores */) {
    var fluxStores = _.toArray(arguments);

    if (!fluxStores.length) { return {}; }

    var update = _.debounce(function update() {
      this.forceUpdate();
    }, 1);

    return {
      componentWillMount: function() {
        fluxStores.forEach(function(store) {
          store.model.on('change', update, this);
        }, this);
      },

      componentWillUmmount: function() {
        fluxStores.forEach(function(store) {
          store.model.off('change', update, this);
        }, this);
      },
    };
  }

  Flux.Store = FluxStore;
  Flux.UseStores = UseStores;

}(Flux, Backbone, _);
