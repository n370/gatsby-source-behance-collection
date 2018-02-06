# gatsby-source-behance-collection
> Gatsby.js source plugin for loading collection information from Behance.

If you're interested in getting user data and projects. Go see the original [gatsby-source-behance](https://github.com/LeKoArts/gatsby-source-behance).

Learn more about [Gatsby](https://www.gatsbyjs.org/) and its plugins here: [https://www.gatsbyjs.org/docs/plugins/](https://www.gatsbyjs.org/docs/plugins/)

## Install

```bash
npm install --save gatsby-source-behance-collection
```

## How to use

```Javascript
// In your gatsby-config.js
plugins: [
    {
        resolve: `gatsby-source-behance-collection`,
        options: {
            // Visit a collection page and grab the number after collection
            // Ex.https://www.behance.net/collection/28447865/Typefaces
            collectionId: '<< Collection ID >>', // 28447865
            // You can get your API Key here: https://www.behance.net/dev/register
            apiKey: '<< API Key >>',
        }
    }
]
```