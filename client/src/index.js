import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import openSocket from 'socket.io-client';
const http = require('http');
let querystring = require('querystring');

class Board extends React.Component {

    /**
     * Function to send a post request to a server.
     * @param type the type of the message.
     * @param id the id of this server.
     */
    sendPost = (type, id) => {
        console.log("Sending post " + type +  " to: " + id);
        // Build the post string from an object
        const postData = querystring.stringify({
            id: id
        });

        const options = {
            hostname: 'localhost',
            port: id + 3000,
            path: type,
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        const request = http.request(options, (resource) => {
        });

        request.on('error', (e) => {
            console.error(`problem with request: ${e.message}`);
        });

        // write data to request body
        request.write(postData);
        request.end();
    };

    render() {
        const info = this.props.info;
        const id = this.props.info.id;
        if (info.state === "RELEASED") {
            return (
                <div>
                    <div id="released">
                        <button onClick={this.sendPost.bind(this, '/client/request', id)}>Request Resource </button>
                    </div>
                </div>
            );
        }
        else if (info.state === "WANTED") {
            return (
                <div>
                    <div id="waiting">
                        Requesting Mutual Exclusion...
                        Got {this.props.info.repliesReceived} replies
                    </div>
                </div>
            );
        }
        else if (info.state === "HELD") {
            return (
                <div>
                    <div id="held">
                        <button onClick={this.sendPost.bind(this, '/client/release', id)}>Release Resource </button>
                    </div>
                </div>
            );
        }
    }
}

class Interface extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            //Set this process id.
            id: document.location.port - 4000,
            //Set the process this process communicates with.
            votingSet: [],
            //Current state.
            state: "RELEASED",
            //If already voted.
            voted: false,
            //Amount of replies received.
            repliesReceived: 0,
            //Queue of requests.
            queue: []
        }
    }

    componentDidMount() {
        const socket = openSocket('http://localhost:' + (this.state.id + 5000));
        socket.on("FromAPI", data => this.setState({
            state: data.state,
            voted: data.voted,
            repliesReceived: data.repliesReceived,
            queue: data.queue,
            votingSet: data.votingSet
        }));
    }

    render() {

        return (
            <div className="interface">
                <div className="info">
                    <div>Id: {this.state.id}</div>
                    <ol>VotingSet: {this.state.votingSet.map((number) =>
                        <li key={number}>{number}</li>
                        )}</ol>
                    <ol>State: {this.state.state}</ol>
                    <ol>Voted: {this.state.voted}</ol>
                    <ol>Queue: {this.state.queue}</ol>
                </div>
                <div className="board">
                    <Board info={this.state}/>
                </div>
            </div>
        );
    }
}

// ========================================

ReactDOM.render(
    <Interface/>,
    document.getElementById('root')
);