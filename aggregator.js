const express = require('express');
const app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
const port = 3001;
const util = require('util')

var namespaces = [];

function store(data) {
    if(namespaces.length == 0) {
        namespaces = data;
    }else{
        data.forEach((received_ns) => {
            var found = false;
            namespaces.forEach((ns) => {
                if (ns.name === received_ns.name) {
                    found = true;

                    received_ns.pods.forEach((received_pod) => {
                        var foundPod = false;
                        ns.pods.forEach((po) => {
                            if(po.name === received_pod.name) {
                                foundPod = true;

                                received_pod.containers.forEach((received_container) => {
                                    var foundContainer = false;
                                    po.containers.forEach((co) => {
                                        if (received_container.name === co.name) {
                                            foundContainer = true;
                                            return;
                                        }
                                    })
                                    if(!foundContainer) {
                                        po.containers.push(received_container);
                                    }
                                })
                                return;
                            }
                        })
                        if(!foundPod) {
                            ns.pods.push(received_pod);
                        }
                    });
                    return;
                }
            });

            if(!found) {
                namespaces.push(received_ns);
            }
        });
    }
}

function removeStore(entities) {
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

    io.emit('update', namespaces);
}

io.on('connection', (client) => {
    client.on('new_file', (data) => {
        store(data);
        console.log("New file added");
        io.emit('new_file', namespaces);
    });

    client.on('new_line', (data) => {
        io.emit(data.namespace + "_" + data.podName + "_" + data.container, data.line);
    })

    client.on('get_all', () => {
        io.emit('new_file', namespaces);
    })

    client.on('delete_file', (entities) => {
        removeStore(entities);
    })
});




http.listen(port, () => console.log(`I'm listening on port ${port}!`))

