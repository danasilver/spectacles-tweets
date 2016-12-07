#!/usr/bin/env node

const MongoClient = require('mongodb').MongoClient;
const debug = require('debug')('create-index');

const url = process.env.MONGODB_URI ||
  'mongodb://localhost:27017/spectacles-tweets';
let db = null;

MongoClient.connect(url)
.then(_db => {
  db = _db;
  debug('Connected to db.');
  return db.collection('tweets').createIndex({created_at: 1});
})
.then(index => {
  debug('Created index %s.', index);
  return db.collection('tweets').createIndex({id_str: 1}, {unique: true});
})
.then(index => {
  debug('Created index %s.', index);
  return db.close();
})
.then(() => {
  debug('Database connection closed.');
})
.catch(err => {
  throw err;
});
