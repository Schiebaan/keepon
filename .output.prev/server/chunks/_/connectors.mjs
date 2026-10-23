import { c as createError } from '../nitro/nitro.mjs';

const connectors = {};
function registerConnector(connector) {
  connectors[connector.type] = connector;
}
function getConnector(type) {
  const connector = connectors[type];
  if (!connector) {
    throw createError({ statusCode: 400, message: `Onbekende integratie: ${type}` });
  }
  return connector;
}

export { getConnector as g, registerConnector as r };
//# sourceMappingURL=connectors.mjs.map
