var AWS = require('aws-sdk');
AWS.config.update({region: 'us-west-2'});
var S3 = new AWS.S3();
var Pileon = require('./pile-on')(S3);

var bucket = 'rsvp.s3jobs.cloudstitch.io';
var key = '1436997577559-sync-rsvps/job.json';
var filename = '1436997577559-sync-rsvps/job.json';

Pileon.readObject(bucket, key, filename).then(
  function(res) {
    console.log('res', res);
  },
  function(err) {
    console.log('error', err);
  }
);
