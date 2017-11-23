'use strict';
const fetch = require('node-fetch');
const _get = require('lodash/get');

const AWS = require('aws-sdk');

require('dotenv').config()

module.exports.poll = (event, context, callback) => {
  fetch(process.env.SOURCE_URL)
    .then((res) => {
      res
        .json()
        .then((json) => {
          const temperature = _get(json, 'feeds[0].field1', 0);
          const date = _get(json, 'feeds[0].created_at', "1970-01-01T00:00:00Z");
          const timestamp = new Date(date).getTime();
          return { temperature, timestamp }
        })
        .then((result) => {
          if(result.temperature > process.env.THRESHOLD_TEMP) {
            const sns = new AWS.SNS();

            const time = new Date(result.timestamp);

            const params = {
              Subject: `Temperature High: ${result.temperature}`,
              Message: `The latest temperature reading from ${time.toISOString()} is ${result.temperature}. 
                If the problem persists, please call in a service person; Gidex (+45 86 88 34 22).`,
              TopicArn: process.env.SNS_TOPIC
            };

            sns.publish(params, (error) => {
              if (error) {
                callback(error);
              }
              callback(null, result);
            });
          } else {
            callback(null, result)
          }
        });
    })
    .catch((err) => callback(err, null));
};
