const express = require('express');
const proxy = require('http-proxy');
const app = express();
const curl = require('curlrequest');
const uuid = require('node-uuid');
const moment = require('moment');
const cheerio = require('cheerio');

const config = require('../config.json');

const port = 3000;

app.set('port', port);
app.use(express.static(__dirname + '/app'));

proxy.prototype.onError = (err) => {
    console.log(err);
}

const router = express.Router();
const api = proxy.createProxyServer({ changeOrigin: false });

router.use((req, res, next) => {
    console.log(moment().format('h:mm:ss a'), req.method, req.url);
    next();
});

router.get('/api/weather', (req, res) => {
    api.web(req, res, {
        target:
        'http://api.openweathermap.org/data/2.5/weather?APPID={0}&units={1}&q={2}'
            .replace('{0}', process.env.YAMM_WEATHER_KEY)
            .replace('{1}', config.units)
            .replace('{2}', config.weather.city)
    });
});

router.get('/api/forecast', (req, res) => {
    api.web(req, res, {
        target:
        'http://api.openweathermap.org/data/2.5/forecast?APPID={0}&units={1}&q={2}'
            .replace('{0}', process.env.YAMM_WEATHER_KEY)
            .replace('{1}', config.units)
            .replace('{2}', config.weather.city)
    });
});

const GoogleMapsAPI = require('googlemaps');


router.get('/api/travel', (req, res) => {
    const gmAPI = new GoogleMapsAPI({ key: process.env.YAMM_MAPS_KEY, secure: true });
    const params = {
        origins: config.travel.home,
        destinations: config.travel.destinations[0],
        units: config.units
    }

    gmAPI.distance(params, (err, results) => {
        err ? res.send(err) : res.send(results);
    });
});

router.get('/api/reddit', (req, res) => {
    curl.request('https://www.reddit.com/r/{0}/top.json?count=20'.replace('{0}', config.subreddit), (err, data) => {
        err ? res.send(err) : res.send(data);
    })
});

router.get('/api/todo', (req, res) => {
    const options = {
        url: 'https://todoist.com/API/v6/sync',
        data: {
            token: process.env.YAMM_TODOIST_KEY,
            seq_no: 0,
            resource_types: '["items"]'
        }
    }
    curl.request(options, (err, data) => {
        if (err) {
            res.send(err);
        }

        const todos = JSON.parse(data).Items;

        // filter for todos of form: Completed: "title" and strip down to just title
        const completeTodos = todos.filter(todo => todo.content.includes("Completed:"));
        const mappedTodos = completeTodos.map(todo => todo.content.substring(todo.content.indexOf('"') + 1, todo.content.length - 1));
        const openTodos = todos.filter(todo => !todo.content.includes("Completed:"));
        const actualRemainingTodos = openTodos.filter(todo => {
            return mappedTodos.indexOf(todo.content) === -1;
        }).map(todo => todo.content);

        const notActualRemainingTodos = openTodos.filter(todo => mappedTodos.indexOf(todo.content) != -1);
        const toDelete = notActualRemainingTodos.concat(completeTodos).map(todo => todo.id);

        // delete from todoist
        if (toDelete.length) {
            const deleteOptions = {
                url: 'https://todoist.com/API/v6/sync',
                data: {
                    token: process.env.YAMM_TODOIST_KEY,
                    commands: '[{"type": "item_delete", "uuid": "{0}", "args": {"ids": [{1}]}}]'
                        .replace('{0}', uuid.v4())
                        .replace('{1}', toDelete.toString())
                }
            }
            curl.request(deleteOptions, (err2, data2) => {
                err2 ? console.dir(err2) : console.dir(data2);
            });
        }

        res.send(actualRemainingTodos);
    })
});

router.get('/api/xkcd', (req, res) => {
    // 1662 xkcd comics currently. find smarter way to do this.
    const comic = Math.floor(Math.random() * 1662)
    curl.request('http://xkcd.com/{0}/info.0.json'.replace('{0}', comic), (err, data) => {
        err ? res.send(err) : res.send(data);
    })
});

router.get('/api/jobs', (req, res) => {
    curl.request('http://www.wiaa.com/Jobs.aspx', (err, data) => {
        if (err) res.send(err);

        const $ = cheerio.load(data);

        var dates = [];
        var mixed = [];

        // grab table cells we care about  
        $('td[valign=top]').each(function (i, elem) {
            // dates are formatted differently from position and location tds
            elem.children.filter(child => child.name == 'a' && child.children[0].data).forEach(child => {
                dates.push(child.children[0].data);
            });

            // positions and locations are in the same array here, so we separate later
            elem.children.filter(child => child.data && child.data.trim().length > 0).forEach(child => {
                mixed.push(child.data.trim());
            })
        });

        var positions = [];
        var locations = [];
        mixed.forEach((item, index) => {
            index % 2 == 0 ? positions.push(item) : locations.push(item);
        })

        // populate our final array of objects
        var jobs = [];
        dates.forEach((date, index) => {
            jobs.push({
                'date': date,
                'position': positions[index],
                'location': locations[index]
            });
        });

        const volleyballJobs = jobs.filter(job => job.position.toLowerCase().includes('volleyball'));
        res.send(volleyballJobs);
    })
})

app.use('/', router);

app.listen(port, () => {
    console.log('Server listening on port ' + port);
});