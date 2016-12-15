#!/usr/bin/env node

require('dotenv').config();

const debug = require('debug')('update-tweets');
const {
  saveTweets,
  promiseFor,
  lastSavedTweet,
  tweetsSinceFirstTweet,
} = require('.');

debug('Beginning to update tweets.');

lastSavedTweet()
.then(tweets => {
  return promiseFor(
    t => t.length,
    t => tweetsSinceFirstTweet(t).tap(saveTweets),
    tweets);
})
.then(() => {
  debug('Finished updating tweets.');
});
