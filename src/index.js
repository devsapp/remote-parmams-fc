const core = require("@serverless-devs/core");
const _ = core.lodash;
// const logger = new core.Logger('remote-parmams-fc');

module.exports = async function index(inputs, args) {
  if (_.isEmpty(args)) {
    return inputs;
  }
  if (!_.isArray(args)) {
    throw new core.CatchableError('The arguments to the remote-params-fc plug-in should be an array');
  }

  const region = _.get(inputs, 'props.region');
  const serviceName = _.get(inputs, 'props.service.name');
  const functionName = _.get(inputs, 'props.function.name')
  if (_.isEmpty(serviceName) || _.isEmpty(region)) {
    return inputs;
  }

  const remoteConfig = {};
  const cloneInputs = _.cloneDeep(inputs);
  const props = {
    region,
    serviceName,
  };

  const fcInfo = await core.loadComponent('devsapp/fc-info');
  remoteConfig.service = (await getRemoteConfig(fcInfo, cloneInputs, props)).service;
  if (_.isEmpty(remoteConfig.service)) { // 如果服务配置为空 则跳出替换
    return inputs;
  }

  if (functionName) {
    props.functionName = functionName;
    remoteConfig.function = (await getRemoteConfig(fcInfo, cloneInputs, props)).function;
  }

  for (const arg of args) {
    const remoteItem = _.get(remoteConfig, arg);
    if (!_.isEmpty(remoteItem) || _.isNumber(remoteItem)) {
      _.set(inputs.props, arg, remoteItem);
    }
  }

  return inputs;
};

async function getRemoteConfig(fcInfo, cloneInputs, props) {
  cloneInputs.props = props;
  try {
    return await fcInfo.info(cloneInputs);
  } catch (ex) {
    if (ex.code?.endsWith('NotFound')) {
      return {};
    }
    throw ex;
  }
}

