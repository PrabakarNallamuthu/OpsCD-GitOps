import { Test } from '@nestjs/testing';
import { AppController } from './app.controller.js';
describe('AppController (policy-engine)', () => {
  let controller: AppController;
  beforeEach(async () => {
    const module = await Test.createTestingModule({ controllers: [AppController] }).compile();
    controller = module.get<AppController>(AppController);
  });
  it('health() returns status ok with service name', () => {
    const result = controller.health();
    expect(result.status).toBe('ok');
    expect(result.service).toBe('policy-engine');
  });
});
