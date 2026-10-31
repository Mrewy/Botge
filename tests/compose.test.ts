/** @format */

import { beforeAll, afterAll, describe, expect, test } from 'vitest';

import { DockerComposeEnvironment, type StartedDockerComposeEnvironment } from 'testcontainers';

describe('Testcontainers', () => {
  let dockerComposeEnvironment: Readonly<StartedDockerComposeEnvironment>;

  beforeAll(async () => {
    dockerComposeEnvironment = await new DockerComposeEnvironment('.', 'compose.yaml')
      .withProjectName('botge')
      .up();
  }, 120000);

  test('botge defined', () => {
    const botge = dockerComposeEnvironment.getContainer('botge-1');

    expect(botge).toBeDefined();
  });

  afterAll(async () => {
    await dockerComposeEnvironment.stop();
  });
});
