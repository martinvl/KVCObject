var inherits = require('util').inherits;
var EventEmitter = require('events').EventEmitter;

// --- Defaults ---
var DEFAULT_OPTIONS = {
    delimiter:'.'
};

var DEFAULT_PREFIX = '';

function KVCObject(options) {
    this._resetObject();
    this._resetChanges();
    this._setOptions(options || {});
}

inherits(KVCObject, EventEmitter);
module.exports = KVCObject;

// --- Initialization ---
KVCObject.prototype._resetObject = function () {
    this._object = {};
};

KVCObject.prototype._resetChanges = function () {
    this._changes = {created:{}, updated:{}, deleted:{}};
};

KVCObject.prototype._setOptions = function (options, defaultOptions) {
    if (this._options === undefined) {
        this._options = {};
    }

    defaultOptions = defaultOptions || DEFAULT_OPTIONS;

    for (var key in defaultOptions) {
        if (options.hasOwnProperty(key)) {
            this._options[key] = options[key];
        } else {
            this._options[key] = defaultOptions[key];
        }
    }
};

// --- Getters ---
KVCObject.prototype.getObject = function () {
    return this.getObjectForKeypath('');
};

KVCObject.prototype.getObjectForKeypath = function (keypath) {
    return this._inflateObject(this._object, this._prefixKeypath(keypath));
};

KVCObject.prototype.getValueForKeypath = function (keypath) {
    return this._object[this._prefixKeypath(keypath)];
};

// --- Setters ---
KVCObject.prototype.setObject = function (object, silent) {
    this.setObjectForKeypath(object, '', silent);
};

KVCObject.prototype.setObjectForKeypath = function (object, rootKeypath, silent) {
    var newObject = this._flattenObject(object, rootKeypath);

    // set deleted
    for (var keypath in this._object) {
        if (this._isSuperpath(keypath, rootKeypath)) {
            this.setValueForKeypath(newObject[keypath], keypath, true);
        }
    }

    // set updated
    for (var keypath in newObject) {
        this.setValueForKeypath(newObject[keypath], keypath, true);
    }

    if (!silent) {
        this._emitChanges();
    }
};

KVCObject.prototype.setValueForKeypath = function (value, keypath, silent) {
    var originalValue = this.getValueForKeypath(keypath);

    if (originalValue === undefined) {
        this._createKeypath(keypath);
    }

    // apply new value
    if (value === undefined) {
        delete this._object[keypath];
    } else {
        this._object[keypath] = value;
    }

    // queue events for changes
    if (originalValue === undefined) {
        this._queueCreated(keypath, silent);
    } else if (value === undefined) {
        this._deleteKeypath(keypath);
        this._queueDeleted(keypath, silent);
    }

    if (originalValue != value) {
        this._queueUpdated(keypath, silent);
    }
};

// --- Event handling ---
KVCObject.prototype._hasChanges = function () {
    return this._objectSize(this._changes.updated) > 0;
};

KVCObject.prototype._emitChanges = function () {
    var created = this._changes.created;
    var updated = this._changes.updated;
    var deleted = this._changes.deleted;

    this._resetChanges();

    if (this._objectSize(created) > 0) {
        this.emit('create', created);
    }

    if (this._objectSize(updated) > 0) {
        this.emit('update', updated);
    }

    if (this._objectSize(deleted) > 0) {
        this.emit('delete', deleted);
    }
};

KVCObject.prototype._queueCreated = function (keypath, silent) {
    this._changes.created[keypath] = this.getValueForKeypath(keypath);

    if (!silent) {
        this._emitChanges();
    }
};

KVCObject.prototype._queueUpdated = function (keypath, silent) {
    this._changes.updated[keypath] = this.getValueForKeypath(keypath);

    if (!silent) {
        this._emitChanges();
    }
};

KVCObject.prototype._queueDeleted = function (keypath, silent) {
    this._changes.deleted[keypath] = this.getValueForKeypath(keypath);

    if (!silent) {
        this._emitChanges();
    }
};

// --- Helper functions ---
KVCObject.prototype._prefixKeypath = function (keypath, prefix) {
    if (prefix === undefined) {
        prefix = DEFAULT_PREFIX;
    }

    var delimiter = this._options.delimiter;

    if (this._isSuperpath(keypath, prefix)) {
        return keypath;
    } else if (keypath.length > 0) {
        return prefix + delimiter + keypath;
    } else {
        return prefix;
    }
};

KVCObject.prototype._unprefixKeypath = function (keypath, prefix) {
    if (prefix === undefined) {
        prefix = DEFAULT_PREFIX;
    }

    var delimiter = this._options.delimiter;

    var prefixPattern = new RegExp(prefix + '\\' + delimiter + '?'); // XXX escape hack
    return keypath.replace(prefixPattern, '');
};

KVCObject.prototype._hasSuperpath = function (superpath) {
    for (var keypath in this._object) {
        if (this._isSuperpath(keypath, superpath)) {
            return true;
        }
    }

    return false;
};

KVCObject.prototype._isSuperpath = function (keypath, superpath) {
    if (superpath.length == 0) {
        return true;
    }

    if (keypath == superpath) {
        return true;
    }

    var delimiter = this._options.delimiter;
    if (keypath.slice(0, superpath.length + delimiter.length) ==
            superpath + delimiter) {
        return true;
    }

    return false;
};

KVCObject.prototype._flattenObject = function (object, keypath, flatObject) {
    flatObject = flatObject ? flatObject : {};

    if (typeof(object) === 'object') {
        for (var key in object) {
            var childKeypath = key;

            if (keypath.length > 0) {
                childKeypath = keypath + this._options.delimiter + key;
            }

            this._flattenObject(object[key], childKeypath, flatObject);
        }
    } else {
        flatObject[keypath] = object;
    }

    return flatObject;
};

KVCObject.prototype._inflateObject = function (flatObject, prefix) {
    var object = {};

    for (var keypath in flatObject) {
        var value = flatObject[keypath];
        var root = object;

        if (!this._isSuperpath(keypath, prefix)) {
            continue;
        }

        var relativeKeypath = this._unprefixKeypath(keypath, prefix);
        var keys = relativeKeypath.split(this._options.delimiter);

        for (var idx in keys.slice(0, -1)) {
            var key = keys[idx];

            if (root[key] === undefined) {
                root[key] = {};
            }

            root = root[key];
        }

        root[keys.pop()] = value;
    }

    return object;
};

KVCObject.prototype._objectSize = function (object) {
    return Object.keys(object).length;
};

KVCObject.prototype._createKeypath = function (keypath) {
    var delimiter = this._options.delimiter;
    var keys = keypath.split(delimiter);

    var key = '';
    for (var idx in keys) {
        key += keys[idx];

        if (!this._hasSuperpath(key)) {
            this.emit('_create', key);
        }

        key += delimiter;
    }
};

KVCObject.prototype._deleteKeypath = function (keypath) {
    var delimiter = this._options.delimiter;
    var keys = keypath.split(delimiter);

    var key = '';
    for (var idx in keys) {
        key += keys[idx];

        if (!this._hasSuperpath(key)) {
            this.emit('_delete', key);
        }

        key += delimiter;
    }
};
