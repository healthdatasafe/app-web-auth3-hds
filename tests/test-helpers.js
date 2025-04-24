const Pryv = require('pryv');

const testHelpers = {
  serviceInfoUrl: 'https://reg.pryv.me/service/info',
  user: 'appwebauth3test',
  email: 'tech+appwebauth3test@pryv.com',
  password: 'appwebauth3test',
  appId: 'pryv-app-web-auth-3',
  requestingAppId: 'client-app',
  pollKey: 'pollKey',
  serviceInfo: null,
  apiEndpoint: null,
  pollUrl: null,
  needSigninState: {
    status: 'NEED_SIGNIN',
    code: 201,
    key: 'pollKey',
    requestingAppId: null,
    requestedPermissions: null,
    url: 'https://sw.backloop.dev:4443/access/access.html?lang=fr&key=RKHRTvKlaUDQodGX&requestingAppId=test-value-notes&domain=pryv.me&registerURL=https%3A%2F%2Freg.pryv.me%2F&poll=https%3A%2F%2Faccess.pryv.me%2Faccess%2FRKHRTvKlaUDQodGX',
    authUrl: 'https://sw.backloop.dev:4443/access/access.html?&pollUrl=https%3A%2F%2Faccess.pryv.me%2Faccess%2FRKHRTvKlaUDQodGX',
    poll: 'https://access.pryv.me/access/pollKey',
    returnURL: null,
    oaccessState: null,
    poll_rate_ms: 1000,
    clientData: {
      'app-web-auth:description': {
        type: 'note/txt',
        content: 'This is a consent message.',
      },
    },
    lang: 'en',
    serviceInfo: null,
  },
};

testHelpers.load = async function () {
  const service = new Pryv.Service(testHelpers.serviceInfoUrl);
  testHelpers.serviceInfo = await service.info();
  testHelpers.needSigninState.serviceInfo = testHelpers.serviceInfo;
  testHelpers.apiEndpoint = await service.apiEndpointFor(testHelpers.user);
  testHelpers.pollUrl = testHelpers.serviceInfo.access + testHelpers.pollKey;
  console.log(testHelpers.serviceInfo);
  return true;
};

module.exports = testHelpers;