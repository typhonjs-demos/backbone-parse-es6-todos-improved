/**
 * Loads mapped paths for TyphonJS in the browser and via Gulp / Node.js allowing normalized dependencies to be
 * used in defining further mapped paths.
 */
/* eslint-disable */

var System = System || global.System;

System.config(
{
   map:
   {
      'mainEventbus': 'site/js/events/mainEventbus.js',
      'parseconfig': 'config/production-config.js',
      'pathConfig': 'config',
      'pathSite': 'site'
   }
});