'use strict';

import Backbone         from 'backbone';
import Parse            from 'parse';
import eventbus         from 'mainEventbus';

import AppRouter        from 'pathSite/js/router/AppRouter.js';
import LogInView        from 'pathSite/js/views/LogInView.js';
import ManageTodosView  from 'pathSite/js/views/ManageTodosView.js';

import appState         from 'pathSite/js/models/appState.js';
import todoList         from 'pathSite/js/collections/todoList.js';

/**
 * Provides the main entry point for the Todos app and major control functionality (the C in MVC). This control
 * functionality is exposed over an eventbus created by `mainEventbus.js`. `typhonjs-backbone-parse` provides
 * additional functionality particularly for `Backbone.Events` adding the ability to invoke asynchronous actions
 * over the eventbus using the `triggerThen` method which resolves any Promises returned by event targets.
 *
 * While in this simple app there is only one view of the `TodoList` a benefit of separating control functionality and
 * the `TodoList` instance from a specific view is that it could be used across multiple views.
 *
 * Please note that all Parse specific API access is isolated in this class. By isolating Parse API access to
 * just this class if the app was rewritten to use a different backend then only this class needs to be modified
 * to support the new backend API after selecting an alternate Backbone implementation.
 */
export default class App
{
   /**
    * Wires up the main eventbus, invokes the private s_INITIALIZE_ROUTE function which creates `AppRouter` and sets up
    * a catch all handler then invokes `Backbone.history.start` with the root path and finally the constructor shows the
    * proper view based on whether there is a current logged in user.
    */
   constructor()
   {
      // Wire up the main eventbus to respond to the following events. By passing in `this` in the third field to
      // `on` that sets the context when the callback is invoked.
      eventbus.on('app:create:item', this.createItem, this);
      eventbus.on('app:select:filter', this.selectFilter, this);
      eventbus.on('app:user:is:current', this.isUserCurrent, this);
      eventbus.on('app:user:login', this.logInUser, this);
      eventbus.on('app:user:logout', this.logOutUser, this);
      eventbus.on('app:user:signup', this.signUpUser, this);

      // Invokes a private method to initialize the `AppRouter`, add a default catch all handler, and start
      // `Backbone.history`.
      s_INITIALIZE_ROUTE();

      // Get the current user and show the proper initial view given whether a user is currently logged in to the app.
      const user = Parse.User.current();

      /**
       * Creates the initial displayed view based given if a user is currently logged into the app.
       *
       * @type {View} Stores the current active view.
       */
      this.currentView = user !== null ? this.showTodos(user.escape('username')) : new LogInView();
   }

   /**
    * Creates a new Item in the todos list. Note the addition of user which becomes a Parse pointer and an
    * Parse.ACL (access control list) which limits the item to be only accessible to the current user.
    *
    * @param {string}   content - The text for the item.
    */
   createItem(content)
   {
      const user = Parse.User.current();

      // Ensure that content is a string and there is a currently logged in user. If so then create a new
      // `Item` entry in `todoList`.
      if (typeof content === 'string' && user !== null)
      {
         todoList.create(
         {
            content,
            order: todoList.nextOrder(),
            done: false,
            user,                      // Current user is assigned as a pointer.
            ACL: new Parse.ACL(user)   // An ACL with the current user ensures that it is only accessible by this user.
         });
      }
   }

   /**
    * Returns a boolean indicating if a user is logged into the app.
    *
    * @returns {boolean}
    */
   isUserCurrent()
   {
      return Parse.User.current() !== null;
   }

   /**
    * Logs in the user and invokes `showTodos` on success.
    *
    * Please note that an ES6 Promise wraps the Parse API call and this promise is resolved by the TyphonJS eventbus
    * via Promise.all before executing any handlers by the callee of `triggerThen`.
    *
    * @param {object}   data - An object that has username & password entries.
    * @returns {Promise}
    */
   logInUser(data = {})
   {
      return new Promise((resolve, reject) =>
      {
         // Invoke `showTodos` on the success.
         Parse.User.logIn(data.username, data.password).then((user) =>
         {
            this.showTodos(user.escape('username'));
            resolve(user);
         },
         (error) => { reject(error); });
      });
   }

   /**
    * Logs out the user and shows the login view.
    *
    * Please note that an ES6 Promise wraps the Parse API call and this promise is resolved by the TyphonJS eventbus
    * via Promise.all before executing any handlers by the callee of `triggerThen`.
    *
    * @returns {Promise}
    */
   logOutUser()
   {
      return new Promise((resolve, reject) =>
      {
         // Close any current view and create the LogInView on success.
         Parse.User.logOut().then(() =>
         {
            if (this.currentView) { this.currentView.close(); }
            this.currentView = new LogInView();
            appState.set('filter', 'all');
         },
         (error) => { reject(error); });
      });
   }

   /**
    * Sets the app state with the new filter type and updates `Backbone.History`.
    *
    * @param {string}   filter - Filter type to select.
    */
   selectFilter(filter)
   {
      // When setting a value on a `Backbone.Model` if the value is the same as what is being set a change event will
      // not be fired. In this case we set the new state with the `silent` option which won't fire any events then
      // we manually trigger a change event so that any listeners respond regardless of the original state value.
      appState.set({ filter }, { silent: true });
      appState.trigger('change', appState);

      // Update the history state with the new filter type.
      Backbone.history.navigate(filter);
   }

   /**
    * Creates and shows a new ManageTodosView then sets a new `Parse.Query` for `todoList` for the current user and
    * fetches the collection.
    *
    * @param {string}   username - Name of current user.
    * @returns {*}
    */
   showTodos(username)
   {
      if (this.currentView) { this.currentView.close(); }

      Backbone.history.navigate(appState.get('filter'), { replace: true });

      // Create a new ManageTodosView and pass in the username via optional parameters. In a Backbone.View additional
      // options are available via `this.options.<key>`. Passing in the user name to the view allows the Parse API
      // isolated to just `App.js`.
      this.currentView = new ManageTodosView({ username });

      // Set the `todoList` query which is necessary for Parse backed collections. The `equalTo` qualifier returns
      // items that are associated with the current user.
      todoList.query = new Parse.Query(todoList.model);
      todoList.query.equalTo('user', Parse.User.current());

      // Fetch all the todos items for this user. Any listeners for `todoList` reset events will be invoked.
      todoList.fetch({ reset: true });

      return this.currentView;
   }

   /**
    * Potentially signs up a new user and if successful invokes `showTodos`.
    *
    * Please note that an ES6 Promise wraps the Parse API call and this promise is resolved by the TyphonJS eventbus
    * via Promise.all before executing any handlers by the callee of `triggerThen`.
    *
    * @param {object}   data - An object that has username & password entries.
    * @returns {Promise}
    */
   signUpUser(data = {})
   {
      return new Promise((resolve, reject) =>
      {
         // Invoke `showTodos` on the success.
         Parse.User.signUp(data.username, data.password, { ACL: new Parse.ACL() }).then((user) =>
         {
            this.showTodos(user.escape('username'));
            resolve(user);
         },
         (error) => { reject(error); });
      });
   }
}

/**
 * A private function in the module scope, but outside of the class which initializes the `AppRouter`, adds a default
 * catch all handler, and start `Backbone.history`.
 */
const s_INITIALIZE_ROUTE = () =>
{
   new AppRouter();

   // Defines a catch all handler for all non-matched routes (anything that isn't `all`, `active` or `completed`). If
   // a user is logged in the catch all navigates to `all` triggering the route and replacing the invalid route in
   // the browser history.
   Backbone.history.handlers.push(
   {
      route: /(.*)/,
      callback: () =>
      {
         if (Parse.User.current() !== null)
         {
            Backbone.history.navigate('all', { trigger: true, replace: true });
         }
         else
         {
            Backbone.history.navigate('', { replace: true });
         }
      }
   });

   // This regex matches the root path, so that it can be set in `Backbone.history.start`
   let urlMatch;

   if (typeof window.location !== 'undefined')
   {
      urlMatch = window.location.toString().match(/\/\/[\s\S]*\/([\s\S]*\/)([\s\S]*\.html)/i);
   }

   // Construct the root path to the web app which is the path above the domain including `index.html` for the bundle
   // or `indexSrc.html` when running the app from source code transpiled in the browser.
   const root = urlMatch && urlMatch.length >= 3 ? `${urlMatch[1]}${urlMatch[2]}` : undefined;

   Backbone.history.start({ root });
};