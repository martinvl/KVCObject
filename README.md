KVCObject
=========

Key-value coding for javascript objects.

Public API
==========
Methods
-------
* **(constructor)**([< _object_ >options])  
    Creates and returns a new KVCObject.  
    Valid options:
    * **delimiter** - _string_ - The string to use as delimiter between keys.
    **Default:** '.'

* **setObject**(< _object_ >object, [< _bool_ >silent]) - (_void_)  
    Sets the current root, overwriting the existing root. If this leads to a
    change of the object, an `update` (and possibly also a `create` or `delete`
    , see below) event will be triggered, unless `silent` is set to `true`.

* **getObject**() - (_object_)  
    Returns the current root as a normal object.

* **setObjectForKeypath**(< _object_ >object, < _string_ >rootKeypath, [< _bool_ >silent]) - (_void_)  
    Sets all values of `object`, where `rootKeypath` will be the keypath to the
    root of the object. If this leads to a change of the object, an `update`
    (and possibly also a `create` or `delete`, see below) event will be
    triggered, unless `silent` is set to `true`.

* **getObjectForKeypath**(< _string_ >keypath) - (_object_)  
    Returns the object from `keypath`.

* **setValueForKeypath**(< _non-object_ >value, < _string_ >keypath, [< _bool_ >silent]) - (_void_)  
    Sets `value` at `keypath`. If this leads to a
    change of the object, an `update` (and possibly also a `create` or `delete`
    , see below) event will be triggered, unless `silent` is set to `true`.

* **getValueForKeypath**(< _string_ >keypath) - (_non-object_)  
    Returns the value at `keypath`.

* **commit**() - (_void_)  
    Commits uncommited changes made with `silent` set to `true`. This leads to
    change events being emitted.

Events
------
* **create**(< _object_ >created)  
    Emitted when a value (or a set of values) is set for a keypath (or a set of
    keypaths) for the first time.  
    `created` is an object with the new keypaths as keys and their
    corresponding values as values  
    **Note:** a new `create` event will be emitted when the value for a keypath
    is deleted (set to `undefined`) and the reset to a value  
    **Note:** a matching `update` event will also be emitted for each `create`
    event  

* **update**(< _object_ >updated)  
    Emitted when a value (or a set of values) is changed for a keypath (or a
    set of keypaths).  
    `updated` is an object with the updated keypaths as keys and corresponding
    values as values  
    **Note:** an `update` event will be emitted even if there is no previous
    value for the keypath  

* **delete**(< _object_ >deleted)  
    Emitted when a value (or a set of values) is deleted (or set to `undefined`)
    for a keypath (or a set of keypaths).  
    `deleted` is an object with the deleted keypaths as keys and corresponding
    values as values  
    **Note:** a matching `update` event will also be emitted for each `delete`
    event  
