
const path = require('path')

    function getBreadcrumbs(req, res, next) {
      const urls = req.originalUrl.split('/');
    
      urls.shift();
     
      req.breadcrumbs = urls.map((url, i) => {
        return {
          breadcrumbName: (url === '' ? '' : url.charAt(0).toUpperCase() + url.slice(1)),
          breadcrumbUrl: `/${urls.slice(0, i + 1).join('/')}`,
        };
      });
      next();
    }

//    function getBreadcrumbs(req, res, next) {

//     console.log("bread")
//   const urls = req.originalUrl.split('/').filter(Boolean);
//   console.log("urls",urls)
//   const breadcrumbs = [
//     {
//       breadcrumbName: 'Home',
//       breadcrumbUrl: '/'
//     }
//   ];

//   urls.forEach((url, i) => {
//     breadcrumbs.push({
//       breadcrumbName: url.charAt(0).toUpperCase() + url.slice(1),
//       breadcrumbUrl: '/' + urls.slice(0, i + 1).join('/')
//     });
//   });

//   res.locals.breadcrumbs = breadcrumbs;
//   next();
// }


    module.exports = getBreadcrumbs