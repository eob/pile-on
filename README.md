Pile On
=======

Useful when you want multiple parallel processes to be able to "pile on" data to a shared structure, such as an object or an array. But you'd like to be able to access the object/array as a single object for reading.

An alternative use case is sharding data across several files but reading it back as one object.

Object Pile On
--------------

Create an object:

    // Creates bucket/key
    S3Log.create(bucket, key, {init: true});

Append to that object log:

    // Creates bucket/key-{timestamp}
    S3Log.append(bucket, key, {stageOneComplete: true});

Read the log structure:

    // Returns a promise for [{init: ture, stageOneComplete: true}]
    S3Log.readObject(bucket, key);

Array Pile On
-------------

Create an array:

    // Creates bucket/key
    S3Log.create(bucket, key, []);

Append to that array log:

    // Creates bucket/key-{timestamp}
    S3Log.append(bucket, key, [{id: 1}]);

Append to that array log again:

    // Creates bucket/key-{timestamp}
    S3Log.append(bucket, key, [{id: 2}]);

Read the log structure:

    // Returns a promise for [{id: 1}, {id: 2}]
    S3Log.readArray(bucket, key);
