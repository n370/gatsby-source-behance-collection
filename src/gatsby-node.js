const crypto = require(`crypto`)
const axios = require(`axios`)

exports.sourceNodes = async ({ boundActionCreators }, pluginConfig) => {
  if (pluginConfig.collectionId === undefined || !pluginConfig.apiKey === undefined) {
    return 'You need to define collectionId and apiKey'
  }

  const axiosClient = axios.create({
    baseURL: `https://api.behance.net/v2/`,
  });
  axiosClient.interceptors.request.use(rateLimiter(500));

  const { data: { collection } } = await axiosClient.get(`/collections/${pluginConfig.collectionId}?client_id=${pluginConfig.apiKey}`)
  const { data: { projects } } = await axiosClient.get(`/collections/${pluginConfig.collectionId}/projects?client_id=${pluginConfig.apiKey}`)

  boundActionCreators.createNode({
    ...mapCollection(collection),
    fields: undefined,
    children: [],
    parent: `__SOURCE__`,
    internal: {
      type: `BehanceCollection`,
      contentDigest: crypto.createHash(`md5`).update(JSON.stringify(collection)).digest(`hex`)
    }
  });

  await asyncForEach(projects, async (collectionProject) => {
    const { data: { project } } = await axiosClient.get(`/projects/${collectionProject.id}?client_id=${pluginConfig.apiKey}`);
    boundActionCreators.createNode({
      ...mapProject(project),
      fields: undefined,
      children: [],
      parent: `__SOURCE__`,
      internal: {
        type: `BehanceCollectionProjects`,
        contentDigest: crypto.createHash(`md5`).update(JSON.stringify(project)).digest(`hex`),
      }
    });
  });
}

async function asyncForEach(array, callback) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array)
  }
}

function mapCollection(collection) {
  return {
    ...collection,
    id: collection.id.toString(),
    areas: collection.fields,
    owners: collection.owners.map(mapOwner),
    latest_projects: collection.latest_projects.map(mapProject),
  };
}

function mapProject(project) {
  return {
    ...project,
    id: project.id.toString(),
    areas: project.fields,
    covers: addSufixToPropertyNames('cover', project.covers),
    owners: project.owners.map(mapOwner),
    modules: project.modules && project.modules.map(mapModules)
  };
}

function mapOwner (owner) {
  return {
    ...owner,
    areas: owner.fields,
    images: addSufixToPropertyNames('image', owner.images)
  };
}

function mapModules (module) {
  return {
    ...module,
    sizes: module.sizes && addSufixToPropertyNames('size', module.sizes),
    dimensions: module.dimensions && addSufixToPropertyNames('dimension', module.dimensions),
    components: module.components && module.components.map(mapComponents)
  }
}

function mapComponents (component) {
  return {
    ...component,
    sizes: component.sizes && addSufixToPropertyNames('size', component.sizes),
    dimensions: component.dimensions && addSufixToPropertyNames('dimension', component.dimensions)
  };
}

function addSufixToPropertyNames(sufix, dictionary) {
  let renamed = {};
  Object.keys(dictionary).forEach((key) => {
    renamed[`${sufix}_${key}`] = dictionary[key];
  });
  return renamed;
}

// Thanks to https://github.com/Jedidiah/gatsby-source-twitch/blob/master/src/gatsby-node.js
// and https://stackoverflow.com/questions/43482639/throttling-axios-requests
function rateLimiter(rateLimit) {
  let lastCalled;
  return call => {
    const now = Date.now();
    if (lastCalled) {
      lastCalled += rateLimit
      const wait = (lastCalled - now)
      if (wait > 0) {
        return new Promise((resolve) => setTimeout(() => resolve(call), wait))
      }
    }
    lastCalled = now
    return call
  }
}
