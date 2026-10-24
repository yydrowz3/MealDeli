import { validate } from 'class-validator';
import { EditProfileInput } from './edit-profile.dto';

describe('EditProfileInput', () => {
  it('accepts an input containing only the field being updated', async () => {
    const input = new EditProfileInput();
    input.name = 'noyydrowz3';

    await expect(validate(input)).resolves.toEqual([]);
  });

  it('validates an optional field when it is provided', async () => {
    const input = new EditProfileInput();
    input.email = 'not-an-email';

    const errors = await validate(input);

    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('email');
  });
});
