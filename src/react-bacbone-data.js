"use strict";

// Override Backbone.Model's set function to use React.addons' immutability helper
var _ = require("underscore");
var Backbone = require("backbone");
var React = require("react/addons");

// Add caching across the Model so that we don't have  multiple models for the same id.
// Overrides .set to use React.addons.update which is an immutable helper
var Model = Backbone.Model.extend({
  set: function(key, val, options) {
    var attr, attrs, unset, changes, silent, changing, prev;
    if (key == null) return this;

    // Handle both `"key", value` and `{key: value}` -style arguments.
    if (typeof key === 'object') {
      attrs = key;
      options = val;
    } else {
      (attrs = {})[key] = val;
    }

    options || (options = {});

    // Run validation.
    if (!this._validate(attrs, options)) return false;

    // Extract attributes and options.
    unset           = options.unset;
    silent          = options.silent;
    changes         = [];
    changing        = this._changing;
    this._changing  = true;

    if (!changing) {
      this._previousAttributes = this.attributes;
      this.changed = {};
    }
    prev = this._previousAttributes;

    // Check for changes of `id`.
    if (this.idAttribute in attrs) this.id = attrs[this.idAttribute];

    // For each `set` attribute, update or delete the current value.
    for (attr in attrs) {
      val = attrs[attr];
      if (!_.isEqual(this.attributes[attr], val)) changes.push(attr);
      if (!_.isEqual(prev[attr], val)) {
        this.changed[attr] = val;
      } else {
        delete this.changed[attr];
      }
    }
    this.attributes = React.addons.update(this.attributes, (unset ? {$set: attrs} : {$merge: attrs}));

    // Trigger all relevant attribute changes.
    if (!silent) {
      if (changes.length) this._pending = options;
      for (var i = 0, l = changes.length; i < l; i++) {
        this.trigger('change:' + changes[i], this, this.attributes[changes[i]], options);
      }
    }

    // You might be wondering why there's a `while` loop here. Changes can
    // be recursively nested within `"change"` events.
    if (changing) return this;
    if (!silent) {
      while (this._pending) {
        options = this._pending;
        this._pending = false;
        this.trigger('change', this, options);
      }
    }
    this._pending = false;
    this._changing = false;
    return this;
  }
}, {
  _cache: {},
  findOrCreateById: function(id) {
    var model = this._cache[id] || new this({id: id});
    this._cache[id] = model;
    return model;
  },
  // hook up to destroy
  removeFromCache: function(model) {
    delete this._cache[model.id];
  }
});

// Set {models: {foo: FooModel, bar: BarModel}} on the Component
// This puts the json directly on the state for your use
var Mixin = {
  getInitialState: function() {
    var initialState = {};
    var _this = this;

    this._models = {};
    _.each(this.models, function(constructor, key) {
      var id = _this.props[key+"Id"];
      if (id) {
        _this._models[key] = constructor.findOrCreateById(id);
        initialState[key] = _this._models[key].toJSON();
      }
    });
    return initialState;
  },
  componentWillMount: function() {
    var _this = this;
    _.each(this._models, function(model, key) {
      model.on("change", _this.updateStateForModel(key, model));
    });
  },
  componentWillUnmount: function() {
    var _this = this;
    _.each(this._models, function(model, key) {
      model.off("change", _this.updateStateForModel(key, model));
    });
  },
  updateStateForModel: function(key, model) {
    var _this = this;
    return function() {
      var newState = {};
      newState[key] = model.toJSON();
      _this.setState(newState);
    };
  }
}

module.exports = {
  Mixin: Mixin,
  Model: Model
};
