// path/models/MyModel.js

'use strict';

import Backbone from 'backbone';

export default class MyModel extends Backbone.Model
{
   /**
    * Returns the `className` which is the table stored in Parse.
    *
    * @returns {string}
    */
   get className() { return 'Issue3'; }
}