angular.module('starter.controllers', [])

.controller('LoginCtrl', function(store, $scope, $state, $location, auth){
  function doAuth() {
    auth.signin({
      closable: false,
      // This asks for the refresh token
      // So that the user never has to log in again
      authParams: {
        scope: 'openid offline_access'
      }
    },function(profile,token, accessToken, state, refreshToken){
      store.set('profile',profile);
      store.set('token',token);
      store.set('refreshToken',refreshToken);
      $state.go('tab.dash');
    },function(){
      console.log('something fucked up now');
    });
  }

  $scope.$on('$ionic.reconnectScope', function() {
    doAuth();
  });
  doAuth();
})

.controller('DashCtrl', function($scope,  $cordovaCamera, auth) {

  $scope.auth = auth;
  $scope.postAuthorId = auth.profile.user_id;
  $scope.postAuthor = auth.profile.name;
  $scope.postAuthorPic = auth.profile.picture;
  $scope.postContent = "";
  $scope.postImage = "";
  $scope.likes = 0;


  $scope.myData = new Firebase('https://chatcathere.firebaseio.com/Posts');

  $scope.takePicture = function() {
       var options = {
           quality : 75,
           destinationType : Camera.DestinationType.DATA_URL,
           sourceType : Camera.PictureSourceType.CAMERA,
           allowEdit : true,
           encodingType: Camera.EncodingType.JPEG,
           targetWidth: 300,
           targetHeight: 300,
           popoverOptions: CameraPopoverOptions,
           saveToPhotoAlbum: false
       };
       $cordovaCamera.getPicture(options).then(function(imageData) {
           $scope.postImage = "data:image/jpeg;base64," + imageData;
       }, function(err) {
           // An error occured. Show a message to the user
       });
   };
   $scope.savePost = function(){
     $scope.myData.push({postAuthorId:$scope.postAuthorId,
                         postAuthor:$scope.postAuthor,
                         postAuthorPic:$scope.postAuthorPic,
                         postContent:$scope.postContent,
                         postImage:$scope.postImage,
                         postDate:Date.now(),
                         likes:$scope.likes
                         });

   },function(err){
     console.log("some error in savePost "+err);
   };
})

//reverse filter for posts
.filter('toArray', function () {
    'use strict';

    return function (obj) {
        if (!(obj instanceof Object)) {
            return obj;
        }

        return Object.keys(obj).map(function (key) {
            return Object.defineProperty(obj[key], '$key', {__proto__: null, value: key});
        });
    }
})
.directive('clickOnce', function($timeout) {
    return {
        restrict: 'A',
        link: function(scope, element, attrs) {
            var replacementText = attrs.clickOnce;

            element.bind('click', function() {
                $timeout(function() {
                    if (replacementText) {
                        element.html(replacementText);
                    }
                    element.attr('disabled', true);
                }, 0);
            });
        }
    };
})
//safe apply mode for modules
.factory('safeApply', [function($rootScope) {
    return function($scope, fn) {
        var phase = $scope.$root.$$phase;
        if(phase == '$apply' || phase == '$digest') {
            if (fn) {
                $scope.$eval(fn);
            }
        } else {
            if (fn) {
                $scope.$apply(fn);
            } else {
                $scope.$apply();
            }
        }
    }
}])
.controller('ChatsCtrl', function($scope,$filter,safeApply, $http) {
  //set arraylist with details from database
  $scope.Posts = {};
  $scope.myData = new Firebase('https://chatcathere.firebaseio.com/Posts');
  $scope.myData.on('value', function(snapshot){
    $scope.Posts = snapshot.val();
    safeApply($scope);
  },function(err){
    console.log("hey there, you have an error in : " +err);
  });
  $scope.myData.doClick = function(item, event){
    alert("clicked: "+ item.postAuthor);
  }
  //add likes to post
  $scope.count = function(post){
    $scope.like = post.likes + 1;
    var likeRef = $scope.myData.child(post.$key);
      likeRef.update({
        likes:$scope.like
      });
    }

  $scope.delete = function(post){

  }
})

.controller('ChatDetailCtrl', function($scope, $stateParams, Chats) {
  $scope.chat = Chats.get($stateParams.chatId);
})

.controller('AccountCtrl', function($scope,store,$state, auth) {
  $scope.auth = auth;

  $scope.settings = {
    enableFriends: true
  };
  $scope.logout = function() {
    auth.signout();
    store.remove('token');
    store.remove('profile');
    store.remove('refreshToken');
    $state.go('login', {}, {reload: true});
  };
});
