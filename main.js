/**
 * Provides the main entry point to the web app first invoking `typhonjs-core-parse-init` which is a component mapped
 * via `package.json->jspm->dependencies`. `typhonjs-core-parse-init` will initialize the Parse API by
 * loading `production-config.js` which is mapped to `parseconfig` in `config-app-paths.js`. Please see `indexSrc.html`
 * and notice that `config-app-paths.js` is loaded after `config.js` is loaded.
 */

'use strict';

import      'typhonjs-core-parse-init';
import App  from 'pathSite/js/App.js';

// Uncomment to turn off eventbus logging.
// import logger  from 'typhonjs-core-logging';
// logger.setLogLevel('off');

// Create and initialize the app
new App();