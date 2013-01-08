var assert = require('chai').assert;
var KVCObject = require('../lib/KVCObject');

suite('KVCObject', function() {
    setup(function () {
        this.object = new KVCObject();
    });

    teardown(function () {
        this.object.removeAllListeners();
    });

    suite('Initialization', function () {
        test('Sets default options when none are provided', function () {
            assert.deepEqual(this.object._options, {delimiter:'.'});
        });

        test('Sets options as expected', function () {
            var options = {delimiter:'/'};
            this.object = new KVCObject(options);

            assert.deepEqual(this.object._options, options);
        });
    });

    suite('Private methods', function () {
        suite('._isSuperpath()', function () {
        });

        suite('._objectSize()', function () {
        });

        suite('._prefixKeypath()', function () {
            test('Handles empty prefix as expected', function () {
                assert.equal(this.object._prefixKeypath(''), '');
                assert.equal(this.object._prefixKeypath('foo'), 'foo');
                assert.equal(this.object._prefixKeypath('foo.bar'), 'foo.bar');
                assert.equal(this.object._prefixKeypath('root.foo.bar'), 'root.foo.bar');
            });

            test('Adds prefix as expected', function () {
                assert.equal(this.object._prefixKeypath('', 'root'), 'root');
                assert.equal(this.object._prefixKeypath('foo', 'root'), 'root.foo');
                assert.equal(this.object._prefixKeypath('foo.bar', 'root'), 'root.foo.bar');
            });

            test('Doesn\'t add extra prefix', function () {
                assert.equal(this.object._prefixKeypath('root.foo.bar', 'root'), 'root.foo.bar');
            });
        });

        suite('._unprefixKeypath()', function () {
            test('Handles empty prefix as expected', function () {
                assert.equal(this.object._unprefixKeypath(''), '');
                assert.equal(this.object._unprefixKeypath('root'), 'root');
                assert.equal(this.object._unprefixKeypath('root.foo'), 'root.foo');
            });

            test('Removes prefix as expected', function () {
                assert.equal(this.object._unprefixKeypath('root', 'root'), '');
                assert.equal(this.object._unprefixKeypath('root.foo', 'root'), 'foo');
                assert.equal(this.object._unprefixKeypath('root.foo.bar', 'root'), 'foo.bar');
            });

            test('Removes only one level of prefix', function () {
                assert.equal(this.object._unprefixKeypath('root.root', 'root'), 'root');
            });
        });
    });

    suite('Public methods', function () {
        suite('.setValueForKeypath()', function () {
            test('Sets root value as expected', function () {
                this.object.setValueForKeypath('bar', '');

                assert.deepEqual(this.object._object, {'':'bar'});
            });

            test('Sets value as expected', function () {
                this.object.setValueForKeypath('bar', 'foo');

                assert.deepEqual(this.object._object, {'foo':'bar'});
            });

            test('Sets deep value as expected', function () {
                this.object.setValueForKeypath('hello', 'foo.bar');

                assert.deepEqual(this.object._object, {'foo.bar':'hello'});
            });

            test('Updates value as expected', function () {
                this.object.setValueForKeypath('hello', 'foo.bar');
                this.object.setValueForKeypath('world', 'foo.bar');

                assert.deepEqual(this.object._object, {'foo.bar':'world'});
            });
        });

        suite('.getValueForKeypath()', function () {
            test('Gets root value as expected', function () {
                var value = 'hello';
                var key = '';
                this.object.setValueForKeypath(value, key);

                assert.equal(this.object.getValueForKeypath(key), value);
            });

            test('Gets value as expected', function () {
                var value = 'hello';
                var key = 'foo';
                this.object.setValueForKeypath(value, key);

                assert.equal(this.object.getValueForKeypath(key), value);
            });

            test('Gets deep value as expected', function () {
                var value = 'hello';
                var key = 'foo.bar';
                this.object.setValueForKeypath(value, key);

                assert.equal(this.object.getValueForKeypath(key), value);
            });

            test('Returns undefined for non-existing keys', function () {
                assert.isUndefined(this.object.getValueForKeypath('foo'));
            });
        });

        suite('.setObjectForKeypath()', function () {
            test('Sets objects as expected', function () {
                this.object.setObjectForKeypath({bar:'Hello'}, 'foo');
                assert.deepEqual(this.object._object, {'foo.bar':'Hello'});

                this.object.setObjectForKeypath({bar:'Hello', man:{name:'johnny'}}, 'foo');
                assert.deepEqual(this.object._object, {'foo.bar':'Hello', 'foo.man.name':'johnny'});

                this.object.setObjectForKeypath({name:'jimmy'}, 'foo.man');
                assert.deepEqual(this.object._object, {'foo.bar':'Hello', 'foo.man.name':'jimmy'});

                this.object.setObjectForKeypath({foo:'bar', man:{name:'johnny'}}, '');
                assert.deepEqual(this.object._object, {'foo':'bar', 'man.name':'johnny'});
            });
        });

        suite('.getObjectForKeypath()', function () {
            test('Gets objects as expected', function () {
                var object = {foo:'bar', man:{name:'johnny'}};
                this.object.setObjectForKeypath(object, '');

                assert.deepEqual(this.object.getObjectForKeypath(''), object);
                assert.deepEqual(this.object.getObjectForKeypath('man'), object.man);
            });
        });

        suite('.setObject()', function () {
            test('Sets empty object as expected', function () {
                var object = {};
                this.object.setObject(object);

                assert.deepEqual(this.object._object, object);
            });

            test('Sets object as expected', function () {
                this.object.setObject({foo:'bar', man:{name:'johnny'}});

                assert.deepEqual(this.object._object, {
                    'foo':'bar',
                    'man.name':'johnny'});
            });

            test('Overwrites object as expected', function () {
                this.object.setObject({boo:'car', can:{name:'jimmy'}});
                this.object.setObject({foo:'bar', man:{name:'johnny'}});

                assert.deepEqual(this.object._object, {
                    'foo':'bar',
                    'man.name':'johnny'});
            });
        });

        suite('.getObject()', function () {
            test('Should return empty object by default', function () {
                assert.deepEqual(this.object.getObject(), {});
            });

            test('Should return simple object as expected', function () {
                var object = {foo:'bar', man:'johnny'};
                this.object.setObject(object);

                assert.deepEqual(this.object.getObject(), object);
            });

            test('Should return deep object as expected', function () {
                var object = {foo:'bar', man:{name:'johnny'}};
                this.object.setObject(object);

                assert.deepEqual(this.object.getObject(), object);
            });
        });
    });

    suite('Events', function () {
        suite('create', function () {
            test('Emits \'create\' event upon blank set', function (done) {
                var object = {foo:'bar'};

                this.object.on('create', function (created) {
                    assert.deepEqual(created, object);

                    done();
                });

                this.object.setObject(object);
            });

            test('Emits \'create\' event upon expanding set', function (done) {
                var kvc = this.object;

                var object = {foo:'bar', man:{name:'johnny'}};
                kvc.setObject({foo:'bar'});

                kvc.on('create', function (created) {
                    assert.deepEqual(created, {'man.name':'johnny'});
                    assert.deepEqual(kvc.getObject(), object);

                    done();
                });

                kvc.setObjectForKeypath(object.man, 'man');
            });

            test('Does not emit \'create\' event upon update and delete', function (done) {
                this.object.setObject({foo:'bar'});

                this.object.on('create', function () {
                    assert.fail();
                });

                this.object.on('delete', function () {
                    done();
                });

                this.object.setValueForKeypath('car', 'foo');
                this.object.setValueForKeypath(undefined, 'foo');

                assert.deepEqual(this.object.getObject(), {});
            });

            test('Emits single \'create\' event for object set', function (done) {
                var kvc = this.object;
                var object = {foo:'bar', man:{name:'johnny'}};

                kvc.on('create', function (created) {
                    assert.deepEqual(created, {foo:'bar', 'man.name':'johnny'});

                    done();
                });

                kvc.setObject(object);
            });
        });

        suite('update', function () {
            test('Emits \'update\' event upon blank set', function (done) {
                var kvc = this.object;
                var object = {foo:'bar'};

                kvc.on('update', function (updated) {
                    assert.deepEqual(updated, object);

                    done();
                });

                kvc.setObject(object);
            });

            test('Emits \'update\' event upon overwrite set', function (done) {
                var kvc = this.object;
                var object = {foo:'bar', man:{name:'johnny'}};

                kvc.setObject(object);

                kvc.on('update', function (updated) {
                    assert.deepEqual(updated, {'man.name':'jimmy'});

                    done();
                });

                kvc.setValueForKeypath('jimmy', 'man.name');
            });

            test('Emits single \'update\' event upon object set', function (done) {
                var kvc = this.object;
                var object = {foo:'bar', man:{name:'johnny'}};

                kvc.on('update', function (updated) {
                    assert.deepEqual(updated, {foo:'bar', 'man.name':'johnny'});

                    done();
                });

                kvc.setObject(object);
            });

            test('Emits \'update\' event upon object delete', function (done) {
                var kvc = this.object;
                var object = {foo:'bar', man:{name:'johnny'}};

                kvc.setObject(object);

                kvc.on('update', function (updated) {
                    assert.deepEqual(updated, {'man.name':undefined});

                    done();
                });

                delete object.man;
                kvc.setObject(object);
            });
        });

        suite('delete', function () {
            test('Emits \'delete\' event upon delete', function (done) {
                var kvc = this.object;
                var object = {foo:'bar', man:{name:'johnny'}};

                kvc.setObject(object);

                kvc.on('delete', function (deleted) {
                    assert.deepEqual(deleted, {'man.name':undefined});

                    done();
                });

                delete object.man;
                kvc.setObject(object);
            });
        });

        suite('_create', function () {
            test('Emits \'_create\' event upon simple create', function (done) {
                var kvc = this.object;

                kvc.on('_create', function (keypath) {
                    assert.equal(keypath, 'foo');
                    done();
                });

                kvc.setObject({foo:'bar'});
            });

            test('Emits \'_create\' event upon multiple create', function (done) {
                var kvc = this.object;

                var keypaths = {'foo':null, 'man':null, 'man.name':null};
                kvc.on('_create', function (keypath) {
                    // keypath should not already have been created
                    if (keypaths[keypath] === undefined) {
                        assert.fail();
                    }

                    delete keypaths[keypath];

                    if (Object.keys(keypaths).length == 0) { // all keypaths have created
                        done();
                    }
                });

                kvc.setObject({foo:'bar', man:{name:'johnny'}});
            });

            test('Does not emit \'_create\' event upon update', function (done) {
                var kvc = this.object;
                kvc.setObject({foo:'bar'});

                kvc.on('_create', function (keypath) {
                    assert.fail();
                });

                kvc.setValueForKeypath('car', 'foo');
                setTimeout(done, 30);
            });
        });

        suite('_delete', function () {
            test('Emits \'_delete\' event upon simple delete', function (done) {
                var kvc = this.object;

                kvc.on('_delete', function (keypath) {
                    assert.equal(keypath, 'foo');
                    done();
                });

                kvc.setObject({foo:'bar'});
                kvc.setObject({});
            });

            test('Emits \'_delete\' event upon multiple delete', function (done) {
                var kvc = this.object;

                var keypaths = {'foo':null, 'man':null, 'man.name':null};
                kvc.on('_delete', function (keypath) {
                    // keypath should not already have been deleted
                    if (keypaths[keypath] === undefined) {
                        assert.fail();
                    }

                    delete keypaths[keypath];

                    if (Object.keys(keypaths).length == 0) { // all keypaths have deleted
                        done();
                    }
                });

                kvc.setObject({foo:'bar', man:{name:'johnny'}});
                kvc.setObject({});
            });

            test('Does not emit \'_delete\' event upon update', function (done) {
                var kvc = this.object;
                kvc.setObject({foo:'bar'});

                kvc.on('_delete', function (keypath) {
                    assert.fail();
                });

                kvc.setValueForKeypath('car', 'foo');
                setTimeout(done, 30);
            });

        });
    });
});
