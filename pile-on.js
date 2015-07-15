var Q = require('q');
var _ = require('underscore');
var underscoreDeepExtend = require("underscore-deep-extend");
_.mixin({deepExtend: underscoreDeepExtend(_)});

module.exports = function(S3) {
  
  var mergeObject = function(objects) {
    return _.deepExtend.apply(_, objects);
  };

  var mergeArray = function(objects) {
    return _.flatten(objects);
  };

  var fetchJobKeys = function(bucket, key, upUntilKey, cb) {
    if (typeof upUntilKey == 'function') {
      cb = upUntilKey;
      upUntilKey = undefined;
    }
    S3.listObjects({Bucket: bucket, Prefix: key}, function(err, data) {
      if (err) {
        return cb(err);
      } else {
        if (data && data.Contents) {
          var keys = [];

          // Get modified of this filename
          var lastModified = null;
          if (upUntilKey) {
            for (var i = 0; i < data.Contents.length; i++) {
              if (data.Contents[i].Key == upUntilKey) {
                lastModified = Date.parse(data.Contents[i].LastModified);
              }
            }            
          }

          for (var i = 0; i < data.Contents.length; i++) {
            if (upUntilKey && lastModified) {
              if (Date.parse(data.Contents[i].LastModified) <= lastModified) {
                keys.push(data.Contents[i].Key);
              }
            } else {
              keys.push(data.Contents[i].Key);
            }
          }

          keys.sort();
          return cb(null, keys);
        } else {
          return cb(null, []);
        }
      }
    });
  };

  var fetchFile = function(bucket, key, parseAsJson) {  
    var deferred = Q.defer();  
    var params = {Bucket: bucket, Key: key};
    S3.getObject(params, function(err, data) {
      if (err) {
        deferred.reject(err);
      } else {
        try {
          if (parseAsJson === true) {
            deferred.resolve(JSON.parse(data.Body.toString()));
          } else {
            deferred.resolve(data.Body.toString());
          }
        } catch(e) {
          deferred.resolve({});
        }
      }
    });
    return deferred.promise;
  };

  var uploadJson = function(bucket, key, json) {
    var deferred = Q.defer();
    try {
      S3.putObject({
        Bucket: bucket, //bucket,
        Key: key,
        Body: JSON.stringify(json), // Could be buffer
        ContentType: 'application/json'
      }, function(err, data) {
        if (err) {
          deferred.reject(err);
        } else {
          deferred.resolve(key);
        }
      });
    } catch(err) {
      deferred.reject(err);
    }
    return deferred.promise;
  };


  return {
    readObject: function(bucket, key, upUntilKey) {
      var deferred = Q.defer();
      fetchJobKeys(bucket, key, upUntilKey, function(err, keys) {
        if (err) {
          deferred.reject(err);
        } else {
          var promises = _.map(keys, function(key) {
            return fetchFile(bucket, key, true);
          });
          Q.all(promises).then(
            function(jsons) {
              deferred.resolve(mergeObject(jsons));
            },
            function(err) {
              deferred.reject(err);
            }
          ).catch(function(ex) {
            deferred.reject(ex);
          }).done();
        }
      });
      return deferred.promise;
    },

    readArray: function(bucket, key, upUntilKey) {  
      var deferred = Q.defer();
      fetchJobKeys(bucket, key, upUntilKey, function(err, keys) {
        if (err) {
          deferred.reject(err);
        } else {
          var promises = _.map(keys, function(key) {
            return fetchFile(bucket, key, true);
          });
          Q.all(promises).then(
            function(jsons) {
              deferred.resolve(mergeArray(jsons));
            },
            function(err) {
              deferred.reject(err);
            }
          ).catch(function(ex) {
            deferred.reject(ex);
          }).done();
        }
      });
      return deferred.promise;
    },

    create: function(bucket, key, json) {
      var deferred = Q.defer();
      try {
        S3.putObject({
          Bucket: bucket, //bucket,
          Key: key,
          Body: JSON.stringify(json), // Could be buffer
          ContentType: 'application/json'
        }, function(err, data) {
          if (err) {
            deferred.reject(err);
          } else {
            deferred.resolve(key);
          }
        });
      } catch(err) {
        deferred.reject(err);
      }
      return deferred.promise;
    },

    append: function(bucket, key, json) {      
      var deferred = Q.defer();
      var key = key + '-' + (Date.now());
      try {
        S3.putObject({
          Bucket: bucket, //bucket,
          Key: key,
          Body: JSON.stringify(json), // Could be buffer
          ContentType: 'application/json'
        }, function(err, data) {
          if (err) {
            deferred.reject(err);
          } else {
            deferred.resolve(key);
          }
        });
      } catch(err) {
        deferred.reject(err);
      }
      return deferred.promise;
    }
  };
}