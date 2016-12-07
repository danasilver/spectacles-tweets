#!/usr/bin/env node

require('dotenv').config();

const debug = require('debug')('backfill-tweets');
const {
  mostRecentTweets,
  saveTweets,
  tweetsUntilLastTweet,
  promiseFor,
} = require('.');

debug('Beginning to backfill Tweets.');

mostRecentTweets()
.tap(saveTweets)
.then(tweets => {
  return promiseFor(
    t => t.length > 1,
    t => tweetsUntilLastTweet(t).tap(saveTweets),
    tweets);
})
.then(() => {
  debug('Finished backfilling Tweets.');
});
