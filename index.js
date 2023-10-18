'use strict';

const dynamoose = require('dynamoose');
const AWS = require('aws-sdk');

const userSchema = new dynamoose.Schema({
  id: Number,
  name: String,
  age: Number,
  race: {
    type: String,
    enum: ['human', 'elf', 'dwarf', 'gnome'],
  },
  class: {
    type: String,
    enum: ['fighter', 'rogue', 'sorcerer', 'cleric'],
  },
});

const User = dynamoose.model('midterm-users', userSchema);

exports.handler = async (event) => {
  const userId = parseInt(event.pathParameters.id);

  try {
    const user = await User.get(userId);

    if (user) {
      const lambda = new AWS.Lambda();

      const params = {
        FunctionName: 'openaiRequest',
        InvocationType: 'Event',
        Payload: JSON.stringify({ user }),
      };

      const response = await lambda.invoke(params).promise();

      if (response.FunctionError) {
        throw new Error(`Lambda invocation error: ${response.FunctionError}`);
      }

      // const result = JSON.parse(response.Payload);

      return {
        statusCode: 200,
        body: JSON.stringify(user),
      };
    } else {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: 'User not found' }),
      };
    }
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
