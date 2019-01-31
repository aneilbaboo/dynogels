'use strict';

const util = require('util');
const _ = require('lodash');
const events = require('events');

const internals = {};

internals.identity = () => {};

const Item = module.exports = function (attrs, table) {
  events.EventEmitter.call(this);

  this.table = table;

  this.set(attrs || {});
};

util.inherits(Item, events.EventEmitter);

Item.prototype.get = function (key) {
  if (key) {
    return this.attrs[key];
  } else {
    return this.attrs;
  }
};

function initialSetter(params) {
  console.warn('In a future major release, Item.set will no longer merge object values. ' + // eslint-disable-line no-console
                '(See https://github.com/clarkie/dynogels/issues/174). To avoid this warning and KEEP the current behavior, ' +
                'call dynogels.mergeObjectsWhenSetting(true). To avoid this warning and use the new behavior (set replaces object values), ' +
                'call dynaogels.mergeObjectsWhenSetting(false).');
  Item.mergeObjectsWhenSetting(true); // replace this fn with the merge setter

  this.set(params); // call the new setter

  return this;
}

Item.mergeObjectsWhenSetting = function (enable) {
  if (enable === 'reset') { // used for testing
    Item.prototype.set = initialSetter;
  } else {
    Item.prototype.set = enable ? function (params) {
      this.attrs = _.merge({}, this.attrs, params);
    } : function (params) {
      this.attrs = _.extend({}, this.attrs, params);
    };
  }
};

Item.prototype.set = initialSetter;

Item.prototype.save = function (callback) {
  const self = this;
  callback = callback || internals.identity;

  self.table.create(this.attrs, (err, item) => {
    if (err) {
      return callback(err);
    }

    self.set(item.attrs);

    return callback(null, item);
  });
};

Item.prototype.update = function (options, callback) {
  const self = this;

  if (typeof options === 'function' && !callback) {
    callback = options;
    options = {};
  }

  options = options || {};
  callback = callback || internals.identity;

  self.table.update(this.attrs, options, (err, item) => {
    if (err) {
      return callback(err);
    }

    if (item) {
      self.set(item.attrs);
    }

    return callback(null, item);
  });
};

Item.prototype.destroy = function (options, callback) {
  const self = this;

  if (typeof options === 'function' && !callback) {
    callback = options;
    options = {};
  }

  options = options || {};
  callback = callback || internals.identity;

  self.table.destroy(this.attrs, options, callback);
};

Item.prototype.toJSON = function () {
  return _.cloneDeep(this.attrs);
};

Item.prototype.toPlainObject = function () {
  return _.cloneDeep(this.attrs);
};
