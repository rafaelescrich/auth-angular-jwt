;(function(){
function authInterceptor(API, auth) {
  return {
    // automatically attach Authorization header
    request: function(config) {
      var token = auth.getToken();
      if(config.url.indexOf(API) === 0 && token) {
        console.log('headers' + config.headers);
        config.headers.Authorization = 'Bearer ' + token;
      }
      return config;
    },

    response: function(res) {
      var headers = res.data.headers;
      console.log(res);
      if(res.config.url.indexOf(API) === 0 && res.data.token) {
        auth.saveToken(res.data.token);
      }

      return res;
    },
  }
}

function authService($window) {
  var srvc = this;

  srvc.parseJwt = function (token) {
    var base64Url = token.split('.')[1];
    var base64 = base64Url.replace('-', '+').replace('_', '/');
    return JSON.parse($window.atob(base64));
  };

  srvc.saveToken = function (token) {
    $window.localStorage['jwtToken'] = token
  };

  srvc.logout = function (token) {
    $window.localStorage.removeItem('jwtToken');
  };

  srvc.getToken = function () {
    return $window.localStorage['jwtToken'];
  };

  srvc.isAuthed = function () {
    var token = srvc.getToken();
    if (token) {
      var params = srvc.parseJwt(token);
      return Math.round(new Date().getTime() / 1000) <= params.exp;
    } else {
      return false;
    }
  }

}

function userService($http, API, auth) {
  var srvc = this;
  srvc.getQuote = function() {
    return $http.get(API + '/auth/quote')
  }
  srvc.register = function (username, password) {
    return $http.post(API + '/auth/register', {
      email: username,
      password: password
    });
  };

  srvc.login = function (username, password) {
    return $http.post(API + '/auth/sign_in', {
      email: username,
      password: password
    });
  };

  srvc.myActivities = function() {
    return $http.get(API + '/my_activities')
  };

}

// We won't touch anything in here
function MainCtrl(user, auth) {
  var self = this;
  self.isauthed = false;

  self.response;

  function handleRequest(res) {
    self.response = res;
    var token = res.data ? res.data.token : null;
    if(token) {
      console.log('JWT:', token);
    }
    self.message = res.data.message;
  }

  self.login = function() {
    user.login(self.username, self.password)
      .then(handleRequest, handleRequest)
  }
  self.register = function() {
    user.register(self.username, self.password)
      .then(handleRequest, handleRequest)
  }
  self.getQuote = function() {
    user.getQuote()
      .then(handleRequest, handleRequest)
  }
  self.logout = function() {
    auth.logout && auth.logout()
  }
  self.isAuthed = function() {
    self.isauthed = auth.isAuthed ? auth.isAuthed() : false;
    //return auth.isAuthed ? auth.isAuthed() : false
  }
  self.myActivities = function() {
    user.myActivities()
      .then(handleRequest, handleRequest)
  }
}

angular.module('app', [])
.factory('authInterceptor', authInterceptor)
.service('user', userService)
.service('auth', authService)
.constant('API', 'http://portalmecapi.c3sl.ufpr.br/v1')
.config(function($httpProvider) {
  $httpProvider.interceptors.push('authInterceptor');
})
.controller('Main', MainCtrl)
})();
