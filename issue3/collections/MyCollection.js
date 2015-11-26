// path/collections/MyCollection.js
'use strict';

import Backbone from 'backbone';
import MyModel from '../models/MyModel.js';

class MyCollection extends Backbone.Collection
{
   /**
    * Reference to this collection's model.
    *
    * @returns {MyModel}
    */
   get model() { return MyModel; }
}

/**
 * Exports an instance of MyCollection.
 */
export default new MyCollection();