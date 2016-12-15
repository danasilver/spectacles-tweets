const debug = require('debug')('download-tweets');
const Promise = require('bluebird');
const Twitter = require('twitter');
const _ = require('lodash');

let twitter = new Twitter({
  consumer_key: process.env.consumer_key,
  consumer_secret: process.env.consumer_secret,
  access_token_key: process.env.access_token_key,
  access_token_secret: process.env.access_token_secret
});

twitter = Promise.promisifyAll(twitter);

const promiseFor = Promise.method((condition, fn, value) => {
  if (!condition(value)) return value;
  return fn(value).then(promiseFor.bind(this, condition, fn));
});

const mostRecentTweets = () => {
  debug('Downloading 200 most recent tweets.');
  const params = {screen_name: 'Spectacles', count: 200};
  return twitter.getAsync('statuses/user_timeline', params);
};

const tweetsSince = sinceId => {
  debug('Downloading tweets with since_id %s.', sinceId);
  const params = {screen_name: 'Spectacles', count: 200, since_id: sinceId};
  return twitter.getAsync('statuses/user_timeline', params);
};

const tweetsUntil = maxId => {
  debug('Downloading tweets with max_id %s.', maxId);
  const params = {screen_name: 'Spectacles', count: 200, max_id: maxId};
  return twitter.getAsync('statuses/user_timeline', params);
};

const tweetsUntilLastTweet = tweets => {
  return tweetsUntil(_.last(tweets).id_str);
};

const tweetsSinceFirstTweet = tweets => {
  return tweetsSince(_.first(tweets).id_str);
};

module.exports = {
  mostRecentTweets,
  tweetsUntilLastTweet,
  promiseFor,
  tweetsSinceFirstTweet,
};
