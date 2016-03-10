(function() {
  var Utils,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  Utils = (function() {
    function Utils() {}

    Utils.prototype.forEach = function(array, callback, scope) {
      var i, results;
      if (scope == null) {
        scope = this;
      }
      i = 0;
      results = [];
      while (i < array.length) {
        callback.call(scope, array[i], i, array);
        results.push(i++);
      }
      return results;
    };

    Utils.prototype.pushMessage = function(name, value) {
      if (value == null) {
        value = {};
      }
      return window.parent.postMessage([name, value], "*");
    };

    Utils.prototype.addEvent = function(element, event, fn, useCapture) {
      if (useCapture == null) {
        useCapture = false;
      }
      return element.addEventListener(event, fn, useCapture);
    };

    Utils.prototype.setStyles = function(element, styles) {
      var key, results;
      results = [];
      for (key in styles) {
        results.push(element.style[key] = styles[key]);
      }
      return results;
    };

    return Utils;

  })();

  this.App = (function(superClass) {
    extend(App, superClass);

    function App(options) {
      this.applyTranslations = bind(this.applyTranslations, this);
      this.moveScreenTo = bind(this.moveScreenTo, this);
      this.setDetailsHeight = bind(this.setDetailsHeight, this);
      this.setListHeight = bind(this.setListHeight, this);
      this.markReadItems = bind(this.markReadItems, this);
      this.countUnreadItems = bind(this.countUnreadItems, this);
      this.getCurrentIds = bind(this.getCurrentIds, this);
      this.setReadIds = bind(this.setReadIds, this);
      this.getStorageKey = bind(this.getStorageKey, this);
      this.setupDefaults = bind(this.setupDefaults, this);
      this.options = options;
      this.elements = {
        logItems: document.querySelectorAll(".logItem"),
        backLinks: document.querySelectorAll(".back"),
        logListCont: document.querySelector(".logListCont"),
        logDetailsItem: document.querySelectorAll(".logDetailsItem"),
        innercont: document.querySelector(".innercont"),
        title: document.querySelector("h3")
      };
      this.storageKey;
      this.currentCount;
      this.readIds;
      this.setupDefaults();
    }

    App.prototype.setupDefaults = function() {
      var j, len, link, ref;
      this.forEach(this.elements.logItems, (function(_this) {
        return function(link, index, array) {
          return _this.addEvent(link, "click", function(event) {
            event.stopPropagation();
            event.preventDefault();
            _this.moveScreenTo(-300);
            _this.setDetailsHeight(index);
            if (_this.currentCount >= 0 && !link.dataset.read) {
              if (_this.readIds.indexOf(link.dataset.id) < 0) {
                _this.currentCount = _this.currentCount - 1;
                _this.setReadIds(link.dataset.id);
                _this.markReadItems();
              }
            }
            return _this.pushMessage("setBadge", {
              counter: _this.currentCount,
              softHide: true
            });
          });
        };
      })(this));
      ref = this.elements.backLinks;
      for (j = 0, len = ref.length; j < len; j++) {
        link = ref[j];
        this.addEvent(link, "click", (function(_this) {
          return function(event) {
            event.stopPropagation();
            event.preventDefault();
            _this.moveScreenTo(0);
            return _this.setListHeight();
          };
        })(this));
      }
      this.setListHeight();
      if (this.elements.logItems.length > 0) {
        return this.addEvent(window, "message", (function(_this) {
          return function(e) {
            var data, eventName;
            eventName = e.data[0];
            data = e.data[1];
            if (eventName === "restore") {
              _this.moveScreenTo(0);
              _this.setListHeight();
            }
            if (eventName === "ready") {
              _this.storageKey = data.host;
              _this.currentCount = _this.countUnreadItems();
              _this.readIds = _this.getReadIds();
              _this.markReadItems();
              if (data.options.translations) {
                _this.applyTranslations(data.options.translations);
              }
              return _this.pushMessage("widgetReady", {
                counter: _this.currentCount,
                softHide: true,
                options: _this.options
              });
            }
          };
        })(this));
      }
    };

    App.prototype.getStorageKey = function() {
      var host;
      host = this.storageKey.replace(/\./gi, "_");
      return "HW_readItems[" + host + "]";
    };

    App.prototype.setReadIds = function(id) {
      var ids;
      this.readIds.push(id);
      ids = this.readIds.join(",");
      return window.localStorage.setItem(this.getStorageKey(), ids);
    };

    App.prototype.getReadIds = function() {
      var ids;
      ids = window.localStorage[this.getStorageKey()];
      ids = ids ? ids != null ? ids.split(",") : void 0 : [];
      return ids;
    };

    App.prototype.getCurrentIds = function() {
      var items;
      items = Array.prototype.slice.call(this.elements.logItems);
      return items.map(function(item) {
        return item.dataset.id;
      });
    };

    App.prototype.countUnreadItems = function() {
      var array, count, filtered, haystack, item, j, len;
      count = 0;
      haystack = this.getReadIds();
      array = this.getCurrentIds();
      filtered = array.map(function(item) {
        return haystack.indexOf(item) >= 0;
      });
      for (j = 0, len = filtered.length; j < len; j++) {
        item = filtered[j];
        if (!item) {
          count = count + 1;
        }
      }
      return count;
    };

    App.prototype.markReadItems = function() {
      var id, item, j, len, ref, results;
      if (this.getReadIds().length > 0) {
        ref = this.getReadIds();
        results = [];
        for (j = 0, len = ref.length; j < len; j++) {
          id = ref[j];
          item = document.querySelector("*[data-id=" + id + "]");
          results.push(item != null ? item.dataset.read = true : void 0);
        }
        return results;
      }
    };

    App.prototype.setListHeight = function() {
      return this.pushMessage("setHeight", {
        height: this.elements.logListCont.offsetHeight
      });
    };

    App.prototype.setDetailsHeight = function(index) {
      var item, j, len, ref;
      ref = this.elements.logDetailsItem;
      for (j = 0, len = ref.length; j < len; j++) {
        item = ref[j];
        this.setStyles(item, {
          display: "none"
        });
      }
      this.setStyles(this.elements.logDetailsItem[index], {
        display: "block"
      });
      return this.pushMessage("setHeight", {
        height: this.elements.logDetailsItem[index].offsetHeight
      });
    };

    App.prototype.moveScreenTo = function(offset) {
      return this.setStyles(this.elements.innercont, {
        left: offset + "px"
      });
    };

    App.prototype.applyTranslations = function(t) {
      var key, ref, results, value;
      if (t.title != null) {
        this.elements.title.textContent = t.title;
      }
      if (t.labels != null) {
        ref = t.labels;
        results = [];
        for (key in ref) {
          value = ref[key];
          results.push(this.forEach(document.querySelectorAll(".label." + key), function(label) {
            return label.textContent = value;
          }));
        }
        return results;
      }
    };

    return App;

  })(Utils);

}).call(this);
