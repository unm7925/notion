const { CONFIG } = require("./site.config")

module.exports = {
  siteUrl: CONFIG.link,
  generateRobotsTxt: false,
  sitemapSize: 7000,
  generateIndexSitemap: false,
}
