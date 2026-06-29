import { describe, expect, test } from 'bun:test';
import { humanizeError } from '@workspace/lib/auth/flows';

describe('humanizeError — code branch', () => {
  test('USER_ALREADY_EXISTS → auth.errorUserExists', () => {
    expect(humanizeError({ code: 'USER_ALREADY_EXISTS' })).toBe('auth.errorUserExists');
  });

  test('INVALID_EMAIL_OR_PASSWORD → auth.errorInvalidCredentials', () => {
    expect(humanizeError({ code: 'INVALID_EMAIL_OR_PASSWORD' })).toBe(
      'auth.errorInvalidCredentials'
    );
  });

  test('INVALID_EMAIL → auth.errorInvalidCredentials', () => {
    expect(humanizeError({ code: 'INVALID_EMAIL' })).toBe('auth.errorInvalidCredentials');
  });

  test('EMAIL_NOT_VERIFIED → auth.errorEmailNotVerified', () => {
    expect(humanizeError({ code: 'EMAIL_NOT_VERIFIED' })).toBe('auth.errorEmailNotVerified');
  });

  test('PASSWORD_TOO_SHORT → auth.errorWeakPassword', () => {
    expect(humanizeError({ code: 'PASSWORD_TOO_SHORT' })).toBe('auth.errorWeakPassword');
  });

  test('PASSWORD_TOO_LONG → auth.errorWeakPassword', () => {
    expect(humanizeError({ code: 'PASSWORD_TOO_LONG' })).toBe('auth.errorWeakPassword');
  });

  test('INVALID_TOKEN → auth.errorInvalidCode', () => {
    expect(humanizeError({ code: 'INVALID_TOKEN' })).toBe('auth.errorInvalidCode');
  });

  test('RATE_LIMITED → auth.errorRateLimited', () => {
    expect(humanizeError({ code: 'RATE_LIMITED' })).toBe('auth.errorRateLimited');
  });
});

describe('humanizeError — message substring branch', () => {
  test('"Invalid email or password" → auth.errorInvalidCredentials', () => {
    expect(humanizeError(new Error('Invalid email or password'))).toBe(
      'auth.errorInvalidCredentials'
    );
  });

  test('"User already exists" → auth.errorUserExists', () => {
    expect(humanizeError(new Error('User already exists'))).toBe('auth.errorUserExists');
  });

  test('"Please verify your email" → auth.errorEmailNotVerified', () => {
    expect(humanizeError(new Error('Please verify your email'))).toBe('auth.errorEmailNotVerified');
  });

  test('"Weak password" → auth.errorWeakPassword', () => {
    expect(humanizeError(new Error('Weak password'))).toBe('auth.errorWeakPassword');
  });
});

describe('humanizeError — fallthrough', () => {
  test('null → auth.errorGeneric', () => {
    expect(humanizeError(null)).toBe('auth.errorGeneric');
  });

  test('undefined → auth.errorGeneric', () => {
    expect(humanizeError(undefined)).toBe('auth.errorGeneric');
  });

  test('empty object → auth.errorGeneric', () => {
    expect(humanizeError({})).toBe('auth.errorGeneric');
  });

  test('number → auth.errorGeneric', () => {
    expect(humanizeError(42)).toBe('auth.errorGeneric');
  });

  test('unknown code with non-matching message → auth.errorGeneric', () => {
    expect(humanizeError({ code: 'SOMETHING_NEW', message: 'A strange error' })).toBe(
      'auth.errorGeneric'
    );
  });
});
