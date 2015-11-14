'use strict';

import _                from 'underscore';
import Backbone         from 'backbone';
import eventbus         from 'mainEventbus';

import loginTmpl        from 'pathSite/templates/login.html!text';

/**
 * Provides a `Backbone.View` allowing a user to login or sign up.
 */
export default class LogInView extends Backbone.View
{
   /**
    * Delegated events for logging in and signing up.
    *
    * @returns {object}
    */
   get events()
   {
      return {
         'submit form.login-form': 'logIn',
         'submit form.signup-form': 'signUp'
      };
   }

   /**
    * Sets the element this view is associated with to `.content`.
    */
   constructor()
   {
      super({ el: '.content' });
   }

   /**
    * Binds `this` to the methods specified and renders the view.
    */
   initialize()
   {
      // Binds the `this` context to all methods such that it is accessible via Backbone event callbacks.
      _.bindAll(this, 'logIn', 'signUp');

      this.render();
   }

   /**
    * Attempts to login a user by invoking `triggerThen` sending a `app:user:login` event which is handled in `App.js`
    * which subsequently returns a Promise.
    *
    * @param {object}   e - event data
    */
   logIn(e)
   {
      // When dealing with a form submit button it's necessary to prevent the default form submission.
      e.preventDefault();

      const username = this.$('#login-username').val();
      const password = this.$('#login-password').val();

      // Dispatch the `app:user:login` event with the username / password and catch any login error. If an error occurs
      // then briefly show the error message.
      eventbus.triggerThen('app:user:login', { username, password }).catch(() =>
      {
         this.$('.login-form .error').html('Invalid username or password. Please try again.').show('fast');

         // Hide the error message and enable the login button.
         setTimeout(() =>
         {
            this.$('.login-form .error').hide('fast');
            this.$('.login-form button').prop('disabled', false);
         }, 3000);
      });

      // Always set the login button to disabled. If there is an error the button is enabled again.
      this.$('.login-form button').prop('disabled', true);
   }

   /**
    * Renders the login view.
    */
   render()
   {
      // Set the `.content` element to the login template.
      this.$el.html(_.template(loginTmpl));

      // Automatically wires all events specified by `get events()`.
      this.delegateEvents();
   }

   /**
    * Attempts to sign up a user by invoking `triggerThen` sending a `app:user:signup` event which is handled in
    * `App.js` which subsequently returns a Promise.
    *
    * @param {object}   e - event data
    */
   signUp(e)
   {
      // When dealing with a form submit button it's necessary to prevent the default form submission.
      e.preventDefault();

      const username = this.$('#signup-username').val();
      const password = this.$('#signup-password').val();

      // Dispatch the `app:user:signup` event with the username / password and catch any sign up error. If an error
      // occurs then briefly show the error message.
      eventbus.triggerThen('app:user:signup', { username, password }).catch((error) =>
      {
         this.$('.signup-form .error').html(_.escape(error.message)).show('fast');

         // Hide the error message and enable the sign up button.
         setTimeout(() =>
         {
            this.$el.find('.signup-form .error').hide('fast');
            this.$('.signup-form button').prop('disabled', false);
         }, 3000);
      });

      // Always set the sign up button to disabled. If there is an error the button is enabled again.
      this.$('.signup-form button').prop('disabled', true);
   }
}