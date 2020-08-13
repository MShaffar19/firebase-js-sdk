/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { registerVersion } from '@firebase/app-exp';
import { name, version } from './package.json';
import { _initializeAuthForClientPlatform } from './src/core/auth/auth_impl';
import { ClientPlatform } from './src/core/util/version';

// Core functionality shared by all clients
export * from './src';

// Additional DOM dependend functionality

// persistence
export { browserLocalPersistence } from './src/platform_browser/persistence/local_storage';
export { browserSessionPersistence } from './src/platform_browser/persistence/session_storage';
export { indexedDBLocalPersistence } from './src/platform_browser/persistence/indexed_db';

// providers
export { PhoneAuthProvider } from './src/platform_browser/providers/phone';

// strategies
export {
  signInWithPhoneNumber,
  linkWithPhoneNumber,
  reauthenticateWithPhoneNumber,
  updatePhoneNumber
} from './src/platform_browser/strategies/phone';
export {
  signInWithPopup,
  linkWithPopup,
  reauthenticateWithPopup
} from './src/platform_browser/strategies/popup';
export {
  signInWithRedirect,
  linkWithRedirect,
  reauthenticateWithRedirect,
  getRedirectResult
} from './src/platform_browser/strategies/redirect';

export { RecaptchaVerifier } from './src/platform_browser/recaptcha/recaptcha_verifier';
export { browserPopupRedirectResolver } from './src/platform_browser/popup_redirect';

// MFA
export { PhoneMultiFactorGenerator } from './src/platform_browser/mfa/assertions/phone';

export const initializeAuth = _initializeAuthForClientPlatform(
  ClientPlatform.BROWSER
);

registerVersion(name, version);
