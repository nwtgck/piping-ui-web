# e2e-test

## Purpose of E2E test
* Ensure transferring in any browser

Modern browsers have a lot of rich features in general.
Piping UI uses the rich features for providing better experience and also supports old browsers which does not have those.
Therefore, Piping UI has some fallbacks.
This E2E test ensures transferring, which is the core function of Piping UI, in an environment with those fallbacks. 

## Non-goal
* UI design confirmation

## TIPS: Faster development

Run as follows and wait for 4000 served. 

```bash
cd ..
PORT=4000 npm run serve
```

Run as follows to E2E test

```bash
E2E_DOCKER_IMAGE=selenium/standalone-firefox:78.0 npm start
```
