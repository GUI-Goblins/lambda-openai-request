'use strict';

const dynamoose = require('dynamoose');
import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';

const lambda = new LambdaClient({ region: 'us-west-2' });

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

      const response = await lambda.send(
        new InvokeCommand(params)
      );

      const payload = Buffer.from(response.Payload).toString();

      console.log('Invocation response: ', response);

      if (response.FunctionError) {
        throw new Error(`Lambda invocation error: ${response.FunctionError}`);
      }
      console.log('Response from openaiRequest: ', payload);
      const result = JSON.parse(payload);
      // return result;

      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(result),
      };
    } else {
      return {
        statusCode: 404,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: 'User not found' }),
      };
    }
  } catch (error) {
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ error: error.message }),
    };
  }
};
