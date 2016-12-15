const debug = require('debug')('backends-mongodb');
const Promise = require('bluebird');
const mongodb = require('mongodb');

const MongoClient = mongodb.MongoClient;
const url = process.env.MONGODB_URI ||
  'mongodb://localhost:27017/spectacles-tweets';

const saveTweets = tweets => {
  let db;

  if (!tweets.length) {
    debug('No tweets to insert.');
    return Promise.resolve();
  }

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

const lastSavedTweet = () => {
  let db;

  return Promise.promisify(MongoClient.connect)(url)
  .then(_db => {
    db = _db;
    return db.collection('tweets')
      .find()
      .sort({created_at: -1})
      .limit(1)
      .toArray();
  })
  .catch(err => {
    throw new Error(err);
  })
  .finally(() => {
    return db.close();
  });
};

module.exports = {
  saveTweets,
  lastSavedTweet
};
