angular.module('yamm').factory('api', ['$http', '$q', function ($http, $q) {
  getData = (url) => {
    var deferred = $q.defer();
    $http.get(url)
      .success(data => deferred.resolve(data))
      .error(err => {
        console.log('Error fetching from: ' + url);
        deferred.reject(err);
      });

    return deferred.promise;
  }

  getWeather = () => {
    return getData('/api/weather');
  }
  
  getForecast = () => {
    return getData('/api/forecast');
  }

  return {
    getWeather: getWeather,
    getForecast: getForecast
  };
}]);