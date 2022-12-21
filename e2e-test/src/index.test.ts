import * as assert from 'power-assert';
import {servePipingUiIfNotServed} from "./util";

const PIPING_UI_PORT = 4000;

before(async () => {
  await servePipingUiIfNotServed(PIPING_UI_PORT);
});

describe('test', () => {
  it('should be successful', () => {
    assert.strictEqual(5, 5);
  });
});
