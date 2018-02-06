const crypto = require(`crypto`)
const axios = require(`axios`)

exports.sourceNodes = async (
    {
      boundActionCreators: {
        createNode
      }
    }, {
      collectionId,
      apiKey
    }
  ) => {

  if (!collectionId || !apiKey) {
    throw 'You need to define collectionId and apiKey'
  }
  // Thanks to https://github.com/Jedidiah/gatsby-source-twitch/blob/master/src/gatsby-node.js
  // and https://stackoverflow.com/questions/43482639/throttling-axios-requests
  const rateLimit = 500
  let lastCalled = undefined

  const rateLimiter = (call) => {
    const now = Date.now()
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

  const axiosClient = axios.create({
    baseURL: `https://api.behance.net/v2/`,
  })
  axiosClient.interceptors.request.use(rateLimiter)

  const { data: { collection } } = await axiosClient.get(`/collections/${collectionId}?client_id=${apiKey}`)
  const { data: { projects } } = await axiosClient.get(`/collections/${collectionId}/projects?client_id=${apiKey}`)

  createNode(Object.assign(mapCollection(collection), {
    children: [],
    parent: `__SOURCE__`,
    internal: {
      type: `BehanceCollection`,
      contentDigest: crypto.createHash(`md5`).update(JSON.stringify(collection)).digest(`hex`)
    }
  }))

  projects.forEach((project) => {
    createNode(Object.assign(mapProject(project), {
      children: [],
      parent: `__SOURCE__`,
      internal: {
        type: `BehanceCollectionProjects`,
        contentDigest: crypto.createHash(`md5`).update(JSON.stringify(project)).digest(`hex`),
      }
    }))
  })
}

function mapCollection(collection) {
  return {
    id: collection.id.toString(),
    user_id: collection.user_id,
    public: collection.public,
    label: collection.label,
    project_count: collection.project_count,
    follower_count: collection.follower_count,
    admin_lock: collection.admin_lock,
    data: collection.data,
    created_on: collection.created_on,
    updated_on: collection.updated_on,
    modified_on: collection.modified_on,
    creator_id: collection.creator_id,
    owners: collection.owners.map(mapOwner),
    latest_projects: collection.latest_projects.map(mapProject),
    stats: collection.stats,
    url: collection.url,
    title: collection.title,
    privacy: collection.privacy,
    project_covers: collection.project_covers,
    is_owner: collection.is_owner,
    is_coowner: collection.is_coowner,
    multiple_owners: collection.multiple_owners,
    gallery_text: collection.gallery_text,
    show_lock: collection.show_lock
  };
}

function mapProject(project) {
  return {
    id: project.id.toString(),
    name: project.name,
    published_on: project.published_on,
    created_on: project.created_on,
    modified_on: project.modified_on,
    url: project.url,
    privacy: project.privacy,
    project_fields: project.fields,
    covers: {
      size115: project.covers['115'],
      size202: project.covers['202'],
      size230: project.covers['230'],
      size404: project.covers['404'],
      original: project.covers.original
    },
    mature_content: project.mature_content,
    mature_access: project.mature_access,
    owners: project.owners.map(mapOwner),
    stats: {
      views: project.stats.views,
      appreciations: project.stats.appreciations,
      comments: project.stats.comments
    },
    conceived_on: project.conceived_on
  }
}

function mapOwner (owner) {
  return {
    id: owner.id.toString(),
    first_name: owner.first_name,
    last_name: owner.last_name,
    username: owner.username,
    city: owner.city,
    state: owner.state,
    country: owner.country,
    location: owner.location,
    company: owner.company,
    occupation: owner.occupation,
    created_on: owner.created_on,
    url: owner.url,
    images: {
      size50: owner.images['50'],
      size100: owner.images['100'],
      size115: owner.images['115'],
      size138: owner.images['138'],
      size230: owner.images['230'],
      size276: owner.images['276']
    },
    display_name: owner.display_name,
    owner_fields: owner.fields,
    has_default_image: owner.has_default_image,
    website: owner.website,
    stats: {
      followers: owner.followers,
      following: owner.following,
      appreciations: owner.appreciations,
      views: owner.views,
      comments: owner.comments
    }
  };
}
