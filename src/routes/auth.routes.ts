import { router, GET, POST } from '@forgedevstack/harbor';
import { API } from '../const/index.js';
import {
  githubCallback,
  googleCallback,
  login,
  me,
  register,
  startGithubOAuth,
  startGoogleOAuth,
} from '../controllers/auth.controller.js';

export const authRoutes = router('/', [
  POST(API.AUTH_REGISTER, register),
  POST(API.AUTH_LOGIN, login),
  GET(API.AUTH_ME, me),
  GET(API.AUTH_GOOGLE, startGoogleOAuth),
  GET(API.AUTH_GITHUB, startGithubOAuth),
  GET(API.AUTH_GOOGLE_CALLBACK, googleCallback),
  GET(API.AUTH_GITHUB_CALLBACK, githubCallback),
]);
