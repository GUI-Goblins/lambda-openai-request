'use strict';

const { handler } = require('./index');
const { LambdaClient, InvokeCommand } = require('@aws-sdk/client-lambda');
const dynamoose = require('dynamoose');

jest.mock('@aws-sdk/client-lambda', () => {
  return {
    LambdaClient: jest.fn().mockImplementation(() => {
      return {
        send: jest.fn(),
      };
    }),
    InvokeCommand: jest.fn(),
  };
});

jest.mock('dynamoose', () => ({
  model: jest.fn(),
  Schema: jest.fn(),
}));

describe('Lambda handler', () => {
  let mockUser;
  let mockLambda;

  beforeEach(() => {
    mockUser = {
      get: jest.fn(),
    };
    dynamoose.model.mockImplementation(() => mockUser);

    mockLambda = new LambdaClient({ region: 'us-west-2' });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return user not found if user does not exist', async () => {
    mockUser.get.mockResolvedValue(null);

    const event = {
      pathParameters: { id: '1' },
      body: JSON.stringify({}),
    };

    const response = await handler(event);

    expect(response).toEqual({
      statusCode: 404,
      body: JSON.stringify({ message: 'User not found' }),
    });
  });

  it('should return error if lambda invocation fails', async () => {
    mockUser.get.mockResolvedValue({});

    mockLambda.send.mockImplementation(() => {
      throw new Error('Error');
    });

    const event = {
      pathParameters: { id: '1' },
      body: JSON.stringify({}),
    };

    const response = await handler(event);

    expect(response).toEqual({
      statusCode: 500,
      body: JSON.stringify({ error: 'Error' }),
    });
  });

  it('should return result body if lambda invocation is successful', async () => {
    mockUser.get.mockResolvedValue({});

    const mockPayload = {
      body: JSON.stringify({ message: 'Success' }),
    };

    mockLambda.send.mockResolvedValue({ Payload: Buffer.from(JSON.stringify(mockPayload)) });

    const event = {
      pathParameters: { id: '1' },
      body: JSON.stringify({}),
    };

    const response = await handler(event);

    expect(response).toEqual(JSON.parse(mockPayload.body));
  });
});

//tests written with chatGPT 3.5-T