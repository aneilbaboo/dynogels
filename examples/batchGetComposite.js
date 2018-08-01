'use strict';

const dynogels = require('../index');
const async = require('async');
const _ = require('lodash');
const AWS = dynogels.AWS;
const Joi = require('joi');

AWS.config.loadFromPath(`${process.env.HOME}/.ec2/credentials.json`);

const Post = dynogels.define('example-batch-get-posts', {
  hashKey: 'username',
  rangeKey: 'title',
  timestamps: true,
  schema: {
    username: Joi.string(),
    title: Joi.string(),
    text: Joi.string()
  }
});

const printPostInfo = (err, post) => {
  if (err) {
    console.log('got error', err);
  } else if (post) {
    console.log('got post', post.get());
  } else {
    console.log('post not found');
  }
};

const loadSeedData = callback => {
  callback = callback || _.noop;

  // 3 users, 5 posts each
  async.times(3, (n, next) => {
    const username = `user${n}`;
    async.times(5, (m, next) => {
      const title = `title-${m}`;
      Post.create({ username: username, title: title, text: `Content of ${title}` }, next);
    }, next);
  }, callback);
};

async.series([
  async.apply(dynogels.createTables.bind(dynogels)),
  loadSeedData
], err => {
  if (err) {
    console.log('error', err);
    process.exit(1);
  }

  // Get two posts at once
  Post.getItems([['user', 'title-2'], ['user', 'title-1']], (err, posts) => {
    posts.forEach(post => {
      printPostInfo(null, post);
    });
  });

  // Same as above but a strongly consistent read is used
  Post.getItems([['user3', 'title-3'], ['user5', 'title-1']], { ConsistentRead: true }, (err, posts) => {
    posts.forEach(post => {
      printPostInfo(null, post);
    });
  });

  // Get two posts, but only fetching the age attribute
  Post.getItems([['user1', 'title-4'], ['user2', 'title-3']], { AttributesToGet: ['text'] }, (err, posts) => {
    posts.forEach(post => {
      printPostInfo(null, post);
    });
  });
});
