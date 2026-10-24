import { validate } from 'class-validator';
import { ResendVerificationInput } from './resend-verification.dto';

describe('ResendVerificationInput', () => {
  it('accepts an email address', async () => {
    const input = new ResendVerificationInput();
    input.email = 'guest@example.test';

    await expect(validate(input)).resolves.toEqual([]);
  });

  it('rejects invalid and overlong values', async () => {
    const input = new ResendVerificationInput();
    input.email = `${'a'.repeat(250)}@example.test`;

    const errors = await validate(input);

    expect(errors).toHaveLength(1);
    expect(errors[0].constraints).toMatchObject({
      maxLength: expect.any(String),
    });
  });
});
