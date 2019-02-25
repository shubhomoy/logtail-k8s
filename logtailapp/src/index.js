import React from 'react';
import ReactDOM from 'react-dom';
import openSocket from 'socket.io-client';
import leftArrow from './images/left-arrow.png'
import heartImg from './images/heart.jpg'
import logoImg from './images/logo.png'

const socket = openSocket('http://10.157.49.126:32576/');
// const socket = openSocket('http://localhost:3001/');

class Canvas extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            namespaces: [],
            selected: {
                namespace: '',
                pod: '',
                container: ''
            },
            step: 'namespace'
        }

        socket.emit('get_all');

        socket.on('new_file', (ns) => {
            this.setState({
                namespaces: ns
            })
        });

        socket.on('update', (ns) => {
            this.setState({
                namespaces: ns
            })
        });
        
        socket.on('all', (ns) => {
            this.setState({
                namespaces: ns
            })
        })

        this.namespaceSelected = this.namespaceSelected.bind(this);
        this.podSelected = this.podSelected.bind(this);
        this.containerSelected = this.containerSelected.bind(this);
        this.setStep = this.setStep.bind(this);
    }

    namespaceSelected(ns) {
        var selected = this.state.selected;
        selected.namespace = ns;
        this.setState({selected, step: 'pod'})
    }

    podSelected(po) {
        var selected = this.state.selected;
        selected.pod = po;
        this.setState({selected, step: 'container'})
    }

    containerSelected(con) {
        var selected = this.state.selected;
        selected.container = con;
        this.setState({selected, step: 'log'})
    }

    setStep(step) {
        this.setState({step});
    }

    dynamicSort(property) {
        var sortOrder = 1;
    
        if(property[0] === "-") {
            sortOrder = -1;
            property = property.substr(1);
        }
    
        return function (a,b) {
            if(sortOrder == -1){
                return b[property].localeCompare(a[property]);
            }else{
                return a[property].localeCompare(b[property]);
            }        
        }
    }

    render() {
        if (this.state.step === 'namespace') {
            return (
                <div className="center-box">
                    <Namespace namespaces={this.state.namespaces} clickHandler={this.namespaceSelected} sortHandler={this.dynamicSort}/>
                    <div className="footer">
                        <p>Created with <img src={heartImg} height="20" className="heart"></img> by JioCloud DevOps</p>
                    </div>
                    <div className="header">
                        <img src={logoImg} className="logo"/> &nbsp;&nbsp; JioCloud > tail -f
                    </div>
                </div>
            );
        }else if(this.state.step === 'pod') {
            var ns = this.state.namespaces.filter(obj => obj.name === this.state.selected.namespace);
            if (ns.length > 0) {
                return (
                    <div className="center-box">
                        <Pod pods={ns[0].pods} setStepHandler={this.setStep} clickHandler={this.podSelected} sortHandler={this.dynamicSort}/>
                        <div className="footer">
                            <p>Created with <img src={heartImg} height="20" className="heart"></img> by JioCloud DevOps</p>
                        </div>
                        <div className="header">
                            <img src={logoImg} className="logo"/> &nbsp;&nbsp; JioCloud > tail -f
                            <div className="indicator">
                                <div className="ns-indicator">
                                    {this.state.selected.namespace}
                                </div>
                            </div>
                        </div>
                    </div>
                );
            }else{
                return(
                    <div>No Namespace found</div>
                )
            }
            
        }else if(this.state.step === 'container') {
            var ns = this.state.namespaces.filter(obj => obj.name === this.state.selected.namespace);
            var po = ns[0].pods.filter(obj => obj.name === this.state.selected.pod);
            if (po.length > 0) {
                return (
                    <div className="center-box">
                        <Container containers={po[0].containers} setStepHandler={this.setStep} clickHandler={this.containerSelected} sortHandler={this.dynamicSort}/>
                        <div className="footer">
                            <p>Created with <img src={heartImg} height="20" className="heart"></img> by JioCloud DevOps</p>
                        </div>
                        <div className="header">
                            <img src={logoImg} className="logo"/> &nbsp;&nbsp; JioCloud > tail -f
                            <div className="indicator">
                                <div className="ns-indicator">
                                    {this.state.selected.namespace}
                                </div>
                                <div className="po-indicator">
                                    {this.state.selected.pod}
                                </div>
                            </div>
                        </div>
                    </div>
                );
            }else{
                return(
                    <div>
                        No Pods selected
                        <div className="footer">
                            <p>Created with <img src={heartImg} height="20" className="heart"></img> by JioCloud DevOps</p>
                        </div>
                    </div>
                )
            }
            
        }else if(this.state.step === 'log') {
            return(
                <div className="center-box">
                    <Log selected={this.state.selected} setStepHandler={this.setStep}/>
                    <div className="footer">
                        <p>Created with <img src={heartImg} height="20" className="heart"></img> by JioCloud DevOps</p>
                    </div>
                    <div className="header">
                        <img src={logoImg} className="logo"/> &nbsp;&nbsp; JioCloud > tail -f
                        <div className="indicator">
                            <div className="ns-indicator">
                                {this.state.selected.namespace}
                            </div>
                            <div className="po-indicator">
                                {this.state.selected.pod}
                            </div>
                            <div className="co-indicator">
                                {this.state.selected.container}
                            </div>
                        </div>
                    </div>
                </div>
            )
        }
    }
}

class Namespace extends React.Component {
    render() {
        var namespaces = this.props.namespaces.sort(this.props.sortHandler("name"));
        return (
            <div className="center-content">
                <div className="menu-title">Select <b>Namespace</b></div>
                <div className="content">
                    {namespaces.map((item, key) =>
                    <div className="center-item-namespace" key={key} onClick={() => this.props.clickHandler(item.name)}>
                        {item.name}
                    </div>
                    )}
                </div>
            </div>
        );
    }
}

class Pod extends React.Component {

    render() {
        var pods = this.props.pods.sort(this.props.sortHandler("name"));
        return (
            <div className="center-content">
                <div className="menu-title">Select <b>Pod</b></div>
                <div className="content">
                    {pods.map((item, key) =>
                    <div className="center-item-pod" key={key} onClick={() => this.props.clickHandler(item.name)}>
                        {item.name}
                    </div>
                    )}
                </div>

                <img src={leftArrow} height="40" className={['center', 'button'].join(" ")} onClick={() => this.props.setStepHandler('namespace')} alt="next"/>
            </div>
        )
    }
}

class Container extends React.Component {
    render() {
        var containers = this.props.containers.sort(this.props.sortHandler("name"));
        return (
            <div className="center-content">
                <div className="menu-title">Select <b>Container</b></div>
                <div className="content">
                    {containers.map((item, key) =>
                    <div className="center-item-container" key={key} onClick={() => this.props.clickHandler(item.name)}>
                        {item.name}
                    </div>
                    )}
                </div>

                <img src={leftArrow} height="40" className={['center', 'button'].join(" ")} onClick={() => this.props.setStepHandler('pod')} alt="next"/>
            </div>
        )
    }
}

class Log extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            lines: []
        }

        socket.on(this.props.selected.namespace + "_" + this.props.selected.pod + "_" + this.props.selected.container, (line) => {
            line = JSON.parse(line);
            this.setState({
                lines: [...this.state.lines, line.log]
            })
        });

        this.showTail = this.showTail.bind(this);
    }

    showTail() {
        if (this.state.lines.length == 0 ) {
            return <div><center>
                <br /><br />
                New logs will appear from here...
                </center></div>
        }else{
            return this.state.lines.map((item, key) =>
                <div className="log-line" key={key}>
                    {item}
                </div>
            )
        }
    }

    scrollToBottom = () => {
        this.messagesEnd.scrollIntoView({ behavior: "auto" });
    }
      
    componentDidMount() {
        this.scrollToBottom();
    }
      
    componentDidUpdate() {
        this.scrollToBottom();
    }

    render() {
        return (
            <div>
                <div className="log-container">
                    {this.showTail()}
                </div>
                <img src={leftArrow} height="40" className={['center', 'button'].join(" ")} onClick={() => this.props.setStepHandler('container')} alt="back"
                ref={(el) => { this.messagesEnd = el; }}/>
            </div>
        )
    }
}

ReactDOM.render(
    <Canvas />,
    document.getElementById('root')
)