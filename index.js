'use strict';

const dynamoose = require('dynamoose');
const { LambdaClient, InvokeCommand } = require('@aws-sdk/client-lambda');

const lambda = new LambdaClient({ region: 'us-west-2' });

const userSchema = new dynamoose.Schema({
  id: Number,
  name: String,
  age: Number,
  race: {
    type: String,
  },
  class: {
    type: String,
  },
});

const User = dynamoose.model('midterm-users', userSchema);

exports.handler = async (event) => {
  console.log('HERES THE EVENT FROM LAMBDA 1A: ', event);
  const userId = parseInt(event.pathParameters.id);

  let body;
  
  const eventBody = JSON.parse(event.body);
  if (eventBody) {
    body = eventBody;
  } else {
    body = {
      scene: '',
      options: ['', '', '', ''],
      roll: false,
      userChoice: '',
    };
  }

  try {
    const user = await User.get(userId);

    if (user) {
      console.log('user before stringify:', user);
      console.log('body before stringify:', body);

      const params = {
        FunctionName: 'openaiRequest',
        InvocationType: 'RequestResponse',
        Payload: JSON.stringify({ user, body }),
      };

      const response = await lambda.send(new InvokeCommand(params));

      const payload = Buffer.from(response.Payload).toString();

      console.log('Invocation response: ', response);

      if (response.FunctionError) {
        throw new Error(`Lambda invocation error: ${response.FunctionError}`);
      }
      console.log('Response from openaiRequest: ', payload);
      const result = JSON.parse(payload);
      const resultBody = JSON.parse(result.body);
      console.log('Parse payload to object: ', result);
      console.log('Parse result body: ', resultBody);
      // return {
      //   statusCode: 200,
      //   body: JSON.stringify(resultBody),
      // };
      return resultBody
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
