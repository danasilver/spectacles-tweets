const mongodb = require('mongodb');
const debug = require('debug')('download-tweets');
const Promise = require('bluebird');
const Twitter = require('twitter');
const _ = require('lodash');

const MongoClient = mongodb.MongoClient;
const url = process.env.MONGODB_URI ||
  'mongodb://localhost:27017/spectacles-tweets';

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
  const params = {screen_name: 'Spectacles', count: 200, since_id: sinceId};
  return twitter.getAsync('statuses/user_timeline', params);
};

const tweetsUntil = maxId => {
  debug('Downloading tweets with max_id %s.', maxId);
  const params = {screen_name: 'Spectacles', count: 200, max_id: maxId};
  return twitter.getAsync('statuses/user_timeline', params);
};

const tweetsUntilLastTweet = tweets => {
  return tweetsUntil(_.last(tweets).id);
};

const saveTweets = tweets => {
  let db;

  tweets = tweets.map(format);

  return MongoClient.connect(url)
  .then(_db => {
    db = _db;
    return db.collection('tweets')
      .find({$or: tweets.map(t => {return {id_str: t.id_str}})})
      .toArray();
  })
  .then(existing => {
    const newTweets = tweets.filter(t => {
      const existingIds = existing.map(e => e.id_str);
      return existingIds.indexOf(t.id_str) === -1;
    });

    debug('Removed %s existing tweets from set to insert.', existing.length);

    const collection = db.collection('tweets');
    return newTweets.length ? collection.insertMany(newTweets) : {insertedCount: 0};
  })
  .then(result => {
    debug('Inserted %s of %s tweets.', result.insertedCount, tweets.length);
    return db.close();
  })
  .catch(err => {
    throw new Error(err);
  });
};

const format = tweet => {
  tweet.created_at = new Date(tweet.created_at);
  return tweet;
};

module.exports = {
  mostRecentTweets,
  saveTweets,
  tweetsUntilLastTweet,
  promiseFor,
};
