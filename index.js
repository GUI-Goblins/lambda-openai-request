'use strict';

const dynamoose = require('dynamoose');
const AWS = require('aws-sdk');

const userSchema = new dynamoose.Schema({
  id: Number,
  name: String,
  age: Number,
  race: {
    type: String,
    // enum: ['human', 'elf', 'dwarf', 'gnome'],
  },
  class: {
    type: String,
    // enum: ['fighter', 'rogue', 'sorcerer', 'cleric'],
  },
});

const User = dynamoose.model('midterm-users', userSchema);

exports.handler = async (event) => {
  console.log("HERES THE EVENT FROM LAMBDA 1A: ", event);
  const userId = parseInt(event.pathParameters.id);
  const body = JSON.parse(event.body);

  try {
    const user = await User.get(userId);

    if (user) {
      const lambda = new AWS.Lambda();

      console.log('user before stringify:', user);
      console.log('body before stringify:', body);

      const params = {
        FunctionName: 'openaiRequest',
        InvocationType: 'RequestResponse',
        Payload: JSON.stringify({ user, body }),
      };

      const response = await lambda.invoke(params).promise();
      console.log('Invocation response: ', response);

      if (response.FunctionError) {
        throw new Error(`Lambda invocation error: ${response.FunctionError}`);
      }
      console.log('Response from openaiRequest: ', response.Payload);
      const result = JSON.parse(response.Payload);
      return result;

      // return {
      //   statusCode: 200,
      //   body: JSON.stringify(user),
      // };
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
