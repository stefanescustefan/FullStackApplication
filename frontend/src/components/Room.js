import React, { Component } from "react";
import {Typography, Grid, Button} from "@material-ui/core";
import { Link }  from "react-router-dom";
import CreateRoomPage from "./CreateRoomPage";
import MusicPlayer from "./MusicPlayer";

export default class Room extends Component {
    constructor(props) {
        super(props);
        this.state = {
            votesToSkip: 2,
            guestCanPause: false,
            isHost: false,
            showSettings: false,
            spotifyAuthenticated: false,
            song: {},
        };
        this.roomCode = this.props.match.params.roomCode;
        this.getRoomDetails();
    }

    componentDidMount() {
        this.interval = setInterval(this.getCurrentSong, 1000);
    }

    componentWillUnmount() {
        clearInterval(this.interval);
    }

    getRoomDetails = () => {
        fetch("/api/get-room?code=" + this.roomCode)
            .then((response) => {
                if (!response.ok) {
                    // Leave the room if it does not exist
                    this.props.leaveRoomCallback();
                    this.props.history.push('/');
                }
                return response.json();
            })
            .then((data) => {
                this.setState({
                    votesToSkip: data.votes_to_skip,
                    guestCanPause: data.guest_can_pause,
                    isHost: data.is_host,
                });
                if (data.is_host)
                    this.authenticateSpotify();
            })
    }

    getCurrentSong = () => {
        fetch('/spotify/current-song')
            .then((response) => {
                if (!response.ok) {
                    return {};
                } else {
                    return response.json();
                }
            })
            .then((data) => {
                this.setState({ song: data });
            })
    }

    authenticateSpotify = () => {
        fetch('/spotify/is-authenticated')
            .then((response) => response.json())
            .then((data) => {
                this.setState({spotifyAuthenticated: data.status });
                console.log(data.status ? "Already authenticated" : "Authenticating now");
                if (!data.status) {
                    fetch('/spotify/get-auth-url')
                        .then((response) => response.json())
                        .then((Data) => {
                            window.location.replace(Data.url);
                        })
                }

            })
    }

    updateShowSettings = (value) => {
        this.setState({
            showSettings: value,
        });
    }

    renderSettings = () => {
        return (<Grid container spacing={1}>
            <Grid item xs={12} align="center">
                <CreateRoomPage update={true} votesToSkip={this.state.votesToSkip}
                                guestCanPause={this.state.guestCanPause}
                                roomCode={this.roomCode} updateCallback={this.getRoomDetails}/>
            </Grid>
            <Grid item xs={12} align="center">
                <Button variant="contained" color="secondary" onClick={() => this.updateShowSettings(false)}>
                    Close
                </Button>
            </Grid>
        </Grid>
        );
    }

    renderSettingsButton = () => {
        return (
            <Grid item xs={12} align="center">
                <Button variant="contained" color="primary" onClick={() => this.updateShowSettings(true)}>
                    Settings
                </Button>
            </Grid>
        )
    }

    leaveButtonPressed = () => {
        const requestOptions = {
            method: "POST",
            headers: { "Content-Type" : "application/json" },
        }

        fetch("/api/leave-room", requestOptions)
            .then((_response) => {
                this.props.leaveRoomCallback();
                this.props.history.push('/');
            })
    }

    render() {
        if (this.state.showSettings) {
            return this.renderSettings();
        }

        return (
            <Grid container spacing={1}>
                <Grid item xs={12} align="center">
                    <Typography variant="h4" component="h4">
                        Code: {this.roomCode}
                    </Typography>
                </Grid>
                <MusicPlayer {...this.state.song}/>
                {this.state.isHost ? this.renderSettingsButton() : null}
                <Grid item xs={12} align="center">
                    <Button variant="contained" color="secondary" onClick={this.leaveButtonPressed}>
                        Leave Room
                    </Button>
                </Grid>
            </Grid>
        )
    }
}