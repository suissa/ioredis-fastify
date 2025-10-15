import { Redis } from 'ioredis';

export const publishAction = {
  name: 'pubsub.publish',
  schema: {
    body: {
      type: 'object',
      properties: {
        channel: { type: 'string' },
        message: { type: 'string' },
      },
      required: ['channel', 'message'],
    },
  },
  action: (redis: Redis) => async (request: any, reply: any) => {
    const { channel, message } = request.body;
    const receivers = await redis.publish(channel, message);
    reply.send({ status: 'OK', channel, message, receivers });
  },
  examples: [
    {
      description: 'Publish a message to a channel',
      command: 'curl -X POST -H "Content-Type: application/json" -d \'{"channel":"mychannel","message":"hello"}\' http://localhost:3001/api/v1/pubsub/publish',
      response: { status: 'OK', channel: 'mychannel', message: 'hello', receivers: 0 },
    },
  ],
  prompts: [
    {
      role: 'system',
      content: 'You are a helpful assistant for a Redis-like API.',
    },
    {
      role: 'user',
      content: 'How can I publish the message "hello" to the channel "mychannel"?',
    },
  ],
};
