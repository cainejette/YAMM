'use strict';

angular.module('yamm').controller('voiceCtrl',
    ['$scope', '$rootScope', '$timeout',
        function($scope, $rootScope, $timeout) {
            
            // this.command = [];
            
            // annyang.addCommands({
            //     'go away': () => {
            //         this.command = ['go away'];
            //         $rootScope.$broadcast('hide');
            //         $timeout(() => {
            //             this.command = [];
            //         }, 2000);
            //     },
            //     'come back': () => {
            //         this.command = ['come back'];
            //         $rootScope.$broadcast('show');
            //         $timeout(() => {
            //             this.command = [];
            //         }, 2000);
            //     }
            // });
            
            // annyang.start();
        }]
)