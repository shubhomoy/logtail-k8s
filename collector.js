var chokidar = require('chokidar');
Tail = require('tail').Tail;
var socket = require('socket.io-client')('http://10.233.7.242:3001');

// const log_dir = __dirname + '/logs/dir2';
const log_dir = '/var/logs/logtail';


function extractEntities(path) {
    var filename = path.replace(log_dir + '/', '');
    var items = filename.split("_");

    try{
        var container = items[2].split(".")[0].split("-")
        container.pop();
        var entities = {
            podName: items[0],
            namespace: items[1],
            container: container.join("-")
        }
        return entities;
    }catch(err) {
        return null;
    }
}


var namespaces = [];
var watcher = chokidar.watch(log_dir, {ignored: /^\./, persistent: true});
watcher
.on('add', (path) => {
    console.log(path);
    var entities = extractEntities(path);

    if (entities) {

        var tail = new Tail(path);

        tail.on("line", function(data) {
            socket.emit('new_line', {
                namespace: entities.namespace,
                podName: entities.podName,
                container: entities.container,
                line: data
            });
        });
        
        tail.on("error", function(error) {
            console.log('ERROR: ', error);
        });

        var ns = namespaces.find(obj => {
            return obj.name === entities.namespace
        });

        if (ns) {
            var po = ns.pods.find(obj => {
                return obj.name === entities.podName
            });

            if(po) {
                var con = po.containers.find(obj => {
                    return obj.name === entities.container
                });

                if(!con) {
                    po.containers.push({
                        name: entities.container,
                        log_path: path
                    })
                }
            }else{
                ns.pods.push({
                    name: entities.podName,
                    containers: [{
                        name: entities.container,
                        log_path: path
                    }]
                })
            }
        }else{
            namespaces.push({
                name: entities.namespace,
                pods: [{
                    name: entities.podName,
                    containers: [{
                        log_path: path,
                        name: entities.container
                    }]
                }]
            })
        }
    }

    socket.emit('new_file', namespaces);
}
)
.on('unlink', (path) => {

    var entities = extractEntities(path);
    if (entities) {
        var ns = namespaces.find(obj => {
            return obj.name === entities.namespace
        });

        if (ns) {
            var po = ns.pods.find(obj => {
                return obj.name === entities.podName
            });

            if(po) {
                var con = po.containers.find(obj => {
                    return obj.name === entities.container
                });

                if(con) {
                    po.containers = po.containers.filter(obj => obj.name !== entities.container);
                }

                if (po.containers.length == 0)  {
                    ns.pods = ns.pods.filter(obj => obj.name !== po.name);
                }
            }

            if (ns.pods.length == 0) {
                namespaces = namespaces.filter(obj => obj.name !== ns.name);
            }
        }
    }
    
    socket.emit('delete_file', entities);
});
