import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();

function read(relativePath) {
  return readFileSync(join(ROOT, relativePath), "utf8");
}

test("web auth screen exposes Google sign-in without credential fields", () => {
  const source = read("frontend/web/src/features/auth/AuthScreen.tsx");

  assert.match(source, /Continue with Google/);
  assert.doesNotMatch(source, /type=["']password["']/i);
  assert.doesNotMatch(source, /Need an account\?/i);
  assert.doesNotMatch(source, /Already have an account\?/i);
});

test("mobile sign-in screen exposes only Google sign-in action", () => {
  const source = read("frontend/mobile/src/screens/Auth/SignInScreen.tsx");

  assert.match(source, /Continue with Google/);
  assert.doesNotMatch(source, /TextField/);
  assert.doesNotMatch(source, /Sign Up/i);
  assert.doesNotMatch(source, /Create Account/i);
});
